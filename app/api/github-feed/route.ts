import { kv } from "@vercel/kv";

/**
 * Edge-cached GitHub events feed.
 *
 * Strategy:
 *   - When KV is provisioned (KV_REST_API_URL + KV_REST_API_TOKEN
 *     present), serve from KV when available and re-populate after
 *     the TTL expires. Anonymous GitHub allows 60 req/hr/IP — we
 *     hit it at most once per TTL across the whole site.
 *   - When KV is NOT provisioned (local dev without secrets),
 *     fall through to a direct GitHub fetch so the LiveGitHubFeed
 *     component still renders the latest commit.
 *   - On any failure, return 503 so the client falls back to its
 *     "github feed unavailable" pill rather than rendering broken
 *     state.
 */

export const runtime = "edge";

const CACHE_KEY = "gh-feed:emredogan-cloud";
const TTL_SECONDS = 3600;
const GITHUB_URL =
  "https://api.github.com/users/emredogan-cloud/events/public";

const hasKv = Boolean(
  process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN,
);

async function fetchFromGitHub(): Promise<unknown> {
  const res = await fetch(GITHUB_URL, {
    headers: {
      "User-Agent": "emredogan.com portfolio",
      Accept: "application/vnd.github+json",
    },
  });
  if (!res.ok) throw new Error(`gh status ${res.status}`);
  return res.json();
}

export async function GET() {
  try {
    if (!hasKv) {
      const data = await fetchFromGitHub();
      return Response.json(data, { headers: { "x-cache": "bypass" } });
    }

    const cached = await kv.get(CACHE_KEY);
    if (cached) {
      return Response.json(cached, { headers: { "x-cache": "hit" } });
    }

    const data = await fetchFromGitHub();
    await kv.set(CACHE_KEY, data, { ex: TTL_SECONDS });
    return Response.json(data, { headers: { "x-cache": "miss" } });
  } catch {
    return Response.json({ error: "unavailable" }, { status: 503 });
  }
}
