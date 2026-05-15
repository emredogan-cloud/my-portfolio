/**
 * Twitter v2 client — POST /2/tweets via OAuth 1.0a User Context.
 *
 * Why OAuth 1.0a instead of OAuth 2.0:
 *   The v2 tweet-create endpoint accepts both, but OAuth 1.0a is the
 *   only flow that works cleanly from a Vercel Cron (no refresh-token
 *   redirect dance). We sign with HMAC-SHA1 via crypto.subtle so this
 *   file stays edge-runtime compatible — no Node-only crypto imports.
 *
 * Required env vars:
 *   TWITTER_API_KEY              consumer key
 *   TWITTER_API_SECRET           consumer secret
 *   TWITTER_ACCESS_TOKEN         user access token
 *   TWITTER_ACCESS_TOKEN_SECRET  user access token secret
 *
 * Missing any → getTwitterCredentials() returns null; postTweet()
 * returns { ok:false, error:"twitter-not-configured" } so the caller
 * can degrade gracefully (the auto-tweet cron treats this as a
 * "draft saved but not posted" state, not a 5xx).
 */

export const TWEET_MAX_LENGTH = 280;

interface TwitterCredentials {
  consumerKey: string;
  consumerSecret: string;
  accessToken: string;
  accessTokenSecret: string;
}

export function getTwitterCredentials(): TwitterCredentials | null {
  const consumerKey = process.env.TWITTER_API_KEY;
  const consumerSecret = process.env.TWITTER_API_SECRET;
  const accessToken = process.env.TWITTER_ACCESS_TOKEN;
  const accessTokenSecret = process.env.TWITTER_ACCESS_TOKEN_SECRET;
  if (!consumerKey || !consumerSecret || !accessToken || !accessTokenSecret) {
    return null;
  }
  return { consumerKey, consumerSecret, accessToken, accessTokenSecret };
}

/** RFC 3986 percent-encoding — stricter than encodeURIComponent's
 *  default (extra escapes for !'()*) which Twitter's signer expects. */
function percentEncode(s: string): string {
  return encodeURIComponent(s).replace(
    /[!'()*]/g,
    (c) => "%" + c.charCodeAt(0).toString(16).toUpperCase(),
  );
}

async function hmacSha1Base64(key: string, message: string): Promise<string> {
  const encoder = new TextEncoder();
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    encoder.encode(key) as BufferSource,
    { name: "HMAC", hash: "SHA-1" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign(
    "HMAC",
    cryptoKey,
    encoder.encode(message) as BufferSource,
  );
  let binary = "";
  new Uint8Array(sig).forEach((b) => {
    binary += String.fromCharCode(b);
  });
  return btoa(binary);
}

function randomNonce(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

async function buildAuthorizationHeader(
  method: "POST" | "GET",
  url: string,
  credentials: TwitterCredentials,
): Promise<string> {
  const oauthParams: Record<string, string> = {
    oauth_consumer_key: credentials.consumerKey,
    oauth_token: credentials.accessToken,
    oauth_signature_method: "HMAC-SHA1",
    oauth_timestamp: String(Math.floor(Date.now() / 1000)),
    oauth_nonce: randomNonce(),
    oauth_version: "1.0",
  };

  // Twitter signs query params alongside OAuth params. We don't pass
  // query strings on POST /2/tweets, but the parser must handle them
  // for forward compatibility.
  const parsed = new URL(url);
  const queryParams: Record<string, string> = {};
  parsed.searchParams.forEach((value, key) => {
    queryParams[key] = value;
  });

  const allParams: Record<string, string> = { ...queryParams, ...oauthParams };
  const paramString = Object.keys(allParams)
    .sort()
    .map((k) => `${percentEncode(k)}=${percentEncode(allParams[k])}`)
    .join("&");

  const baseUrl = `${parsed.protocol}//${parsed.host}${parsed.pathname}`;
  const baseString = [
    method.toUpperCase(),
    percentEncode(baseUrl),
    percentEncode(paramString),
  ].join("&");

  const signingKey = `${percentEncode(credentials.consumerSecret)}&${percentEncode(
    credentials.accessTokenSecret,
  )}`;

  const signature = await hmacSha1Base64(signingKey, baseString);

  const headerParams: Record<string, string> = {
    ...oauthParams,
    oauth_signature: signature,
  };

  const headerString = Object.keys(headerParams)
    .sort()
    .map(
      (k) => `${percentEncode(k)}="${percentEncode(headerParams[k])}"`,
    )
    .join(", ");

  return `OAuth ${headerString}`;
}

export type PostTweetResult =
  | { ok: true; tweet_id: string }
  | {
      ok: false;
      error:
        | "twitter-not-configured"
        | "tweet-too-long"
        | "tweet-empty"
        | "twitter-unreachable"
        | "no-tweet-id"
        | `twitter-error-${number}`;
      detail?: string;
    };

export async function postTweet(text: string): Promise<PostTweetResult> {
  const trimmed = text.trim();
  if (!trimmed) return { ok: false, error: "tweet-empty" };
  if (trimmed.length > TWEET_MAX_LENGTH) {
    return { ok: false, error: "tweet-too-long" };
  }

  const credentials = getTwitterCredentials();
  if (!credentials) {
    return { ok: false, error: "twitter-not-configured" };
  }

  const url = "https://api.twitter.com/2/tweets";

  let authHeader: string;
  try {
    authHeader = await buildAuthorizationHeader("POST", url, credentials);
  } catch (err) {
    console.error(
      "[twitter] auth header build failed:",
      err instanceof Error ? err.message : "unknown",
    );
    return { ok: false, error: "twitter-unreachable" };
  }

  let res: Response;
  try {
    res = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: authHeader,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ text: trimmed }),
    });
  } catch (err) {
    console.error(
      "[twitter] fetch failed:",
      err instanceof Error ? err.message : "unknown",
    );
    return { ok: false, error: "twitter-unreachable" };
  }

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    console.error(
      "[twitter] non-2xx:",
      JSON.stringify({ status: res.status, detail: detail.slice(0, 300) }),
    );
    return {
      ok: false,
      error: `twitter-error-${res.status}` as const,
      detail: detail.slice(0, 300),
    };
  }

  const data = (await res.json().catch(() => ({}))) as {
    data?: { id?: string };
  };
  const tweetId = data.data?.id;
  if (!tweetId) {
    return { ok: false, error: "no-tweet-id" };
  }
  return { ok: true, tweet_id: tweetId };
}
