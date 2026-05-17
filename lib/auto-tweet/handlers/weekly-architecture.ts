import { anthropic } from "@ai-sdk/anthropic";
import { generateText } from "ai";
import { kv } from "@vercel/kv";
import { postTweet, TWEET_MAX_LENGTH } from "@/lib/twitter-client";
import { WEEKLY_ARCHITECTURE_SYSTEM_PROMPT } from "@/lib/auto-tweet/prompts/weekly-architecture";
import {
  isDuplicate,
  recordPost,
  readLastPost,
} from "@/lib/auto-tweet/dedupe";
import { AUTOTWEET_MODES } from "@/lib/auto-tweet/modes";

/**
 * Weekly architecture handler — Tuesday cron entry point.
 *
 * Same context source as daily_standup (GitHub Push events for the
 * past seven days), different prompt and different framing. NO OG
 * image in v1: the weekly post is meant to read as quiet observation,
 * not a banner card. Per-mode OG template is deferred — V4 § 6.1.B
 * SUB-PR 1.3 lists it but step 5 acknowledges text-only is the v1
 * shape for the new modes.
 */

const WEEKLY_KEY_PREFIX = "v4:autotweet:weekly_architecture:";
const WEEKLY_TTL_SECONDS = 60 * 60 * 24 * 120; // 120 days
const GITHUB_USER = "emredogan-cloud";
const GITHUB_EVENTS_URL = `https://api.github.com/users/${GITHUB_USER}/events/public`;

interface PushEvent {
  type: string;
  repo: { name: string };
  created_at: string;
  payload: {
    commits?: { message: string; sha: string }[];
    head?: string;
  };
}

interface WeeklyRecord {
  date: string;
  draft: string;
  tweet_id?: string;
  posted_at?: string;
  error?: string;
  error_detail?: string;
  skipped?: "duplicate" | "draft-empty";
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

async function loadSevenDayEvents(): Promise<PushEvent[]> {
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
    /* GitHub's public events API returns the last ~30 events. We
     * filter to PushEvent type and the last 7 UTC days. */
    const cutoff = Date.now() - 7 * 24 * 60 * 60 * 1000;
    return data.filter(
      (e) =>
        e.type === "PushEvent" &&
        new Date(e.created_at).getTime() >= cutoff,
    );
  } catch {
    return [];
  }
}

function buildContext(events: PushEvent[], lastWeekly: string | null): string {
  const lines: string[] = [
    "PushEvents from the last 7 UTC days (newest first):",
  ];
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
        `- ${repoName} @ ${e.created_at}: "${message}" (${sha.slice(0, 7)})`,
      );
    }
  }
  if (lines.length === 1) {
    lines.push(
      "- No PushEvents in the last 7 days. Pivot to a stability/identity/direction noticing.",
    );
  }
  if (lastWeekly) {
    lines.push("");
    lines.push(`Last weekly post fired at: ${lastWeekly}.`);
    lines.push(
      "Do not recycle the same noticing — if the week looks similar to last week, find a different angle.",
    );
  }
  return lines.join("\n");
}

async function generateDraft(context: string): Promise<string | null> {
  if (!process.env.ANTHROPIC_API_KEY) return null;
  try {
    const result = await generateText({
      model: anthropic("claude-haiku-4-5-20251001"),
      system: WEEKLY_ARCHITECTURE_SYSTEM_PROMPT,
      prompt: context,
      temperature: 0.65,
      maxOutputTokens: 240,
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
      "[auto-tweet] weekly_architecture: claude generation failed:",
      err instanceof Error ? err.message : "unknown",
    );
    return null;
  }
}

/**
 * Run the weekly architecture flow. Same response shape vocabulary
 * as daily_standup so the cron logs read consistently.
 */
export async function runWeeklyArchitecture(): Promise<Response> {
  const date = todayUtcDate();
  const recordKey = `${WEEKLY_KEY_PREFIX}${date}`;

  const [events, lastWeekly] = await Promise.all([
    loadSevenDayEvents(),
    readLastPost(AUTOTWEET_MODES.WEEKLY_ARCHITECTURE),
  ]);
  const context = buildContext(events, lastWeekly);

  const draft = await generateDraft(context);
  if (!draft || draft.length === 0) {
    return Response.json(
      { ok: false, error: "draft-failed", date, mode: "weekly_architecture" },
      { status: 502, headers: { "Cache-Control": "no-store" } },
    );
  }

  if (await isDuplicate(draft)) {
    console.warn(
      `[auto-tweet] weekly_architecture skipped — duplicate of recent tweet: "${draft.slice(0, 80)}…"`,
    );
    const record: WeeklyRecord = { date, draft, skipped: "duplicate" };
    if (hasKv) {
      try {
        await kv.set(recordKey, record, { ex: WEEKLY_TTL_SECONDS });
      } catch {
        /* swallow */
      }
    }
    return Response.json(
      { ok: true, skipped: "duplicate", date, draft, mode: "weekly_architecture" },
      { headers: { "Cache-Control": "no-store" } },
    );
  }

  /* Text-only post — V4 § 6.1.B SUB-PR 1.3 step 5 acknowledges
   * the new modes ship text-only for v1; the per-mode OG template
   * lands later. */
  const postResult = await postTweet(draft);

  const baseRecord: WeeklyRecord = { date, draft };
  const record: WeeklyRecord = postResult.ok
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
      await kv.set(recordKey, record, { ex: WEEKLY_TTL_SECONDS });
    } catch {
      /* swallow */
    }
  }

  if (postResult.ok) {
    void recordPost(AUTOTWEET_MODES.WEEKLY_ARCHITECTURE, draft);
  }

  if (!postResult.ok) {
    console.error(
      [
        "[auto-tweet] weekly_architecture POST failed.",
        `  date:           ${date}`,
        `  error code:     ${postResult.error}`,
        `  upstream body:  ${postResult.detail ?? "(none)"}`,
      ].join("\n"),
    );
    return Response.json(
      {
        ok: false,
        date,
        draft,
        error: postResult.error,
        error_detail: postResult.detail ?? null,
        mode: "weekly_architecture",
      },
      { status: 502, headers: { "Cache-Control": "no-store" } },
    );
  }

  console.log(
    [
      "[auto-tweet] weekly_architecture posted",
      `  date:     ${date}`,
      `  tweet_id: ${postResult.tweet_id}`,
      `  length:   ${draft.length}`,
    ].join("\n"),
  );
  return Response.json(
    {
      ok: true,
      date,
      draft,
      tweet_id: postResult.tweet_id,
      mode: "weekly_architecture",
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
