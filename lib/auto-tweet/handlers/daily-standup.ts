import { anthropic } from "@ai-sdk/anthropic";
import { generateText } from "ai";
import { kv } from "@vercel/kv";
import {
  postTweet,
  uploadMedia,
  TWEET_MAX_LENGTH,
} from "@/lib/twitter-client";
import { getSiteUrl } from "@/lib/site-url";
import { DAILY_STANDUP_SYSTEM_PROMPT } from "@/lib/auto-tweet/prompts/daily-standup";
import { isDuplicate, recordPost } from "@/lib/auto-tweet/dedupe";
import { AUTOTWEET_MODES } from "@/lib/auto-tweet/modes";

/**
 * Daily standup handler — extracted from the V3-era inline
 * implementation in app/api/auto-tweet/route.ts during the
 * Sub-PR 1.3 multi-format refactor.
 *
 * BEHAVIOUR PRESERVATION RULE: this handler must produce the same
 * tweet, the same Twitter API call, the same KV record, and the
 * same response shape as the pre-refactor route. The only
 * additions are:
 *   1. A 14-day dedupe check (V4 § 6.1.B SUB-PR 1.3 step 1).
 *   2. A recordPost call on success (feeds the dedupe ledger).
 *
 * Everything else — system prompt, OG image pipeline, fallback
 * paths, KV record schema, status codes, log lines — is bit-for-bit
 * what shipped in V3.
 */

const STANDUP_KEY_PREFIX = "cwh:daily-standup:";
const STANDUP_TTL_SECONDS = 60 * 60 * 24 * 90; // 90 days
const LAST_COMMIT_KV_KEY = "build:last_commit";
const GITHUB_USER = "emredogan-cloud";
const GITHUB_EVENTS_URL = `https://api.github.com/users/${GITHUB_USER}/events/public`;
const MAX_EVENTS = 10;

interface LastCommit {
  at: string;
  repo: string;
  message: string;
  sha: string;
}

interface PushEvent {
  type: string;
  repo: { name: string };
  created_at: string;
  payload: {
    commits?: { message: string; sha: string }[];
    head?: string;
  };
}

interface DailyStandupRecord {
  date: string;
  draft: string;
  tweet_id?: string;
  posted_at?: string;
  error?: string;
  error_detail?: string;
  context_summary?: string;
  og_repos?: string;
  media_id_string?: string;
  media_error?: string;
  media_error_detail?: string;
  /** Sub-PR 1.3 addition — when the run is short-circuited by the
   *  14-day dedupe check, the response carries this flag so logs
   *  can distinguish "skipped on purpose" from "failed". */
  skipped?: "duplicate";
}

const hasKv = Boolean(
  process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN,
);

function todayUtcDate(): string {
  const now = new Date();
  const y = now.getUTCFullYear();
  const m = String(now.getUTCMonth() + 1).padStart(2, "0");
  const d = String(now.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

async function loadLastCommit(): Promise<LastCommit | null> {
  if (!hasKv) return null;
  try {
    const value = await kv.get<LastCommit>(LAST_COMMIT_KV_KEY);
    return value ?? null;
  } catch {
    return null;
  }
}

async function loadRecentEvents(): Promise<PushEvent[]> {
  try {
    const res = await fetch(GITHUB_EVENTS_URL, {
      headers: {
        "User-Agent": "emredogan.com auto-tweet",
        Accept: "application/vnd.github+json",
      },
      cache: "no-store",
    });
    if (!res.ok) return [];
    const data = (await res.json()) as PushEvent[];
    if (!Array.isArray(data)) return [];
    return data.filter((e) => e.type === "PushEvent").slice(0, MAX_EVENTS);
  } catch {
    return [];
  }
}

function buildContext(lastCommit: LastCommit | null, events: PushEvent[]): string {
  const lines: string[] = ["Recent activity (last 24h, newest first):"];
  if (lastCommit) {
    lines.push(
      `- [last_commit_kv] ${lastCommit.repo} at ${lastCommit.at}: "${lastCommit.message}" (${lastCommit.sha.slice(0, 7)})`,
    );
  }
  for (const e of events) {
    const repoName = e.repo.name.split("/").pop() ?? e.repo.name;
    const tip =
      e.payload.commits && e.payload.commits.length > 0
        ? e.payload.commits[e.payload.commits.length - 1]
        : undefined;
    const message = tip?.message?.split("\n")[0]?.trim();
    const sha = tip?.sha ?? e.payload.head ?? "";
    if (message) {
      lines.push(
        `- [events] ${repoName} at ${e.created_at}: "${message}" (${sha.slice(0, 7)})`,
      );
    } else {
      lines.push(
        `- [events] ${repoName} at ${e.created_at}: push to ${sha.slice(0, 7)} (no commit message available)`,
      );
    }
  }
  if (lines.length === 1) {
    lines.push(
      "- No activity in the last 24h. Compose a 'quiet day' tweet honestly.",
    );
  }
  return lines.join("\n");
}

function deriveRepos(
  lastCommit: LastCommit | null,
  events: PushEvent[],
): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  const push = (name: string | undefined) => {
    if (!name) return;
    const short = name.split("/").pop() ?? name;
    if (!seen.has(short)) {
      seen.add(short);
      out.push(short);
    }
  };
  push(lastCommit?.repo);
  for (const e of events) push(e.repo.name);
  return out.slice(0, 6);
}

async function fetchOgImage(
  date: string,
  repos: string[],
): Promise<ArrayBuffer | null> {
  const base = getSiteUrl();
  const params = new URLSearchParams({ date });
  if (repos.length > 0) params.set("repos", repos.join(","));
  const url = `${base}/api/og/standup?${params.toString()}`;

  try {
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) {
      console.error(
        "[auto-tweet] og fetch non-2xx:",
        JSON.stringify({ status: res.status, url }),
      );
      return null;
    }
    const buf = await res.arrayBuffer();
    if (buf.byteLength === 0) {
      console.error("[auto-tweet] og fetch empty body");
      return null;
    }
    return buf;
  } catch (err) {
    console.error(
      "[auto-tweet] og fetch failed:",
      err instanceof Error ? err.message : "unknown",
    );
    return null;
  }
}

async function generateDraft(context: string): Promise<string | null> {
  if (!process.env.ANTHROPIC_API_KEY) return null;
  try {
    const result = await generateText({
      model: anthropic("claude-haiku-4-5-20251001"),
      system: DAILY_STANDUP_SYSTEM_PROMPT,
      prompt: context,
      temperature: 0.6,
      maxOutputTokens: 200,
    });
    let text = result.text.trim();
    if (
      (text.startsWith('"') && text.endsWith('"')) ||
      (text.startsWith("'") && text.endsWith("'"))
    ) {
      text = text.slice(1, -1).trim();
    }
    if (text.length > TWEET_MAX_LENGTH) {
      text = text.slice(0, TWEET_MAX_LENGTH - 1) + "…";
    }
    return text;
  } catch (err) {
    console.error(
      "[auto-tweet] claude generation failed:",
      err instanceof Error ? err.message : "unknown",
    );
    return null;
  }
}

/**
 * Execute the daily standup auto-tweet flow.
 *
 * Returns the same Response shape the pre-refactor inline POST used.
 */
export async function runDailyStandup(): Promise<Response> {
  const date = todayUtcDate();
  const recordKey = `${STANDUP_KEY_PREFIX}${date}`;

  const [lastCommit, events] = await Promise.all([
    loadLastCommit(),
    loadRecentEvents(),
  ]);
  const context = buildContext(lastCommit, events);

  const draft = await generateDraft(context);
  if (!draft) {
    const record: DailyStandupRecord = {
      date,
      draft: "",
      error: "claude-generation-failed",
      context_summary: context.slice(0, 500),
    };
    if (hasKv) {
      try {
        await kv.set(recordKey, record, { ex: STANDUP_TTL_SECONDS });
      } catch {
        /* swallow */
      }
    }
    return Response.json(
      { ok: false, error: "draft-failed", date },
      { status: 502, headers: { "Cache-Control": "no-store" } },
    );
  }

  /* Sub-PR 1.3 addition: 14-day dedupe guard. If the freshly
   * generated draft already went out in the last fortnight, abort
   * before the Twitter POST. The dedupe ledger fails open, so a KV
   * outage still lets the tweet through. */
  if (await isDuplicate(draft)) {
    console.warn(
      `[auto-tweet] daily_standup skipped — duplicate of recent tweet: "${draft.slice(0, 80)}…"`,
    );
    const record: DailyStandupRecord = {
      date,
      draft,
      skipped: "duplicate",
      context_summary: context.slice(0, 500),
    };
    if (hasKv) {
      try {
        await kv.set(recordKey, record, { ex: STANDUP_TTL_SECONDS });
      } catch {
        /* swallow */
      }
    }
    return Response.json(
      { ok: true, skipped: "duplicate", date, draft },
      { headers: { "Cache-Control": "no-store" } },
    );
  }

  const repos = deriveRepos(lastCommit, events);
  let mediaIdString: string | null = null;
  let mediaError: string | null = null;
  let mediaErrorDetail: string | null = null;

  const ogBuffer = await fetchOgImage(date, repos);
  if (!ogBuffer) {
    mediaError = "og-fetch-failed";
    console.warn(
      "[auto-tweet] media path: OG fetch returned no buffer — falling back to text-only tweet.",
    );
  } else {
    const uploadResult = await uploadMedia(ogBuffer, "image/png");
    if (uploadResult.ok) {
      mediaIdString = uploadResult.media_id_string;
    } else {
      mediaError = uploadResult.error;
      mediaErrorDetail = uploadResult.detail ?? null;
      console.warn(
        [
          `[auto-tweet] media path: upload failed (${uploadResult.error})`,
          "  → falling back to text-only tweet (this is expected on Twitter Free Tier).",
        ].join("\n"),
      );
    }
  }

  const postResult = await postTweet(draft, {
    mediaIds: mediaIdString ? [mediaIdString] : undefined,
  });

  const baseRecord: DailyStandupRecord = {
    date,
    draft,
    context_summary: context.slice(0, 500),
    og_repos: repos.join(","),
  };
  if (mediaIdString) baseRecord.media_id_string = mediaIdString;
  if (mediaError) baseRecord.media_error = mediaError;
  if (mediaErrorDetail) baseRecord.media_error_detail = mediaErrorDetail;

  const record: DailyStandupRecord = postResult.ok
    ? {
        ...baseRecord,
        tweet_id: postResult.tweet_id,
        posted_at: new Date().toISOString(),
      }
    : {
        ...baseRecord,
        error: postResult.error,
        ...(postResult.detail ? { error_detail: postResult.detail } : {}),
      };

  if (hasKv) {
    try {
      await kv.set(recordKey, record, { ex: STANDUP_TTL_SECONDS });
    } catch {
      /* swallow — the draft was generated and posted (or not); the
         persistence failure shouldn't change the outward result. */
    }
  }

  if (postResult.ok) {
    /* Sub-PR 1.3: feed the dedupe ledger. Fire-and-forget; the
     * post already succeeded so this never blocks the response. */
    void recordPost(AUTOTWEET_MODES.DAILY_STANDUP, draft);
  }

  if (!postResult.ok) {
    console.error(
      [
        "[auto-tweet] tweet POST failed — no tweet went out today.",
        `  date:           ${date}`,
        `  error code:     ${postResult.error}`,
        `  upstream body:  ${postResult.detail ?? "(none)"}`,
        `  media path:     ${mediaError ?? "ok"}`,
      ].join("\n"),
    );
    return Response.json(
      {
        ok: false,
        date,
        draft,
        error: postResult.error,
        error_detail: postResult.detail ?? null,
        media_error: mediaError,
        media_error_detail: mediaErrorDetail,
      },
      { status: 502, headers: { "Cache-Control": "no-store" } },
    );
  }

  console.log(
    [
      `[auto-tweet] posted ${
        mediaIdString ? "with media" : "TEXT-ONLY (media fallback)"
      }`,
      `  date:        ${date}`,
      `  tweet_id:    ${postResult.tweet_id}`,
      `  length:      ${draft.length}`,
      `  with_media:  ${Boolean(mediaIdString)}`,
      `  media_error: ${mediaError ?? "ok"}`,
    ].join("\n"),
  );
  return Response.json(
    {
      ok: true,
      date,
      draft,
      tweet_id: postResult.tweet_id,
      with_media: Boolean(mediaIdString),
      media_error: mediaError ?? undefined,
      media_error_detail: mediaErrorDetail ?? undefined,
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
