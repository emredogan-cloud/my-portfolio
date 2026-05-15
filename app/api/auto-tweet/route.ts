import { anthropic } from "@ai-sdk/anthropic";
import { generateText } from "ai";
import { kv } from "@vercel/kv";
import { postTweet, TWEET_MAX_LENGTH } from "@/lib/twitter-client";

/**
 * Daily standup auto-tweet.
 *
 * Vercel Cron hits this once a day at 09:00 GMT+3 (06:00 UTC). Flow:
 *   1. Verify Authorization: Bearer ${CRON_SECRET}.
 *   2. Read recent GitHub activity from KV (build:last_commit, set
 *      by /api/github-webhook) + a fresh pull from the public events
 *      API for breadth.
 *   3. Generate ONE tweet (≤280 chars) via Claude Haiku, in Emre's
 *      voice: terse, technically specific, no marketing fluff.
 *   4. POST to Twitter v2 via the OAuth 1.0a client.
 *   5. Persist the state to KV under cwh:daily-standup:{YYYY-MM-DD}
 *      (90-day TTL — long enough to spot patterns or debug a failure
 *      without bloating the bucket).
 *
 * The endpoint is also callable manually via curl with the same
 * bearer token, so you can dry-run it from a shell before letting
 * the cron pick it up. There is no GET — this is strictly POST/
 * triggered (cron sends POST).
 */

export const runtime = "edge";
export const maxDuration = 30;

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
  context_summary?: string;
}

const SYSTEM_PROMPT = `You are Emre Doğan's daily standup composer for Twitter / X.

Voice: Tech-founder, build-in-public. Confident, specific, slightly editorial. Reads like someone who is actually shipping, not announcing.

You produce ONE tweet per day summarising what Emre shipped in the last 24 hours. Use this STRUCTURE every time:

1. HOOK — one short opening line that lands. A claim, a punchline, or the headline outcome. NOT "Today I built…". NOT "Just shipped…". Aim for something a senior engineer would screenshot. Examples that work:
   - "Made the cron generate its own OG card."
   - "Closed the loop between webhook → KV → live UI."
   - "Phase 3 voice mode now under 800ms end-to-end."

2. THREE OR FEWER BULLETS — short, tech-specific, each opens with ONE tech emoji from a disciplined palette:
   ⚡  speed / shipping cadence
   🏗️  building / scaffolding
   ☁️  cloud / AWS / infra
   🤖  AI / LLM / agents
   🧠  intelligence / models / pipelines
   📡  live / streaming / webhooks
   🔐  security / auth / IAM
   🛠️  engineering / tooling
   🎯  precision / focus

   ONE emoji per bullet, NEVER stacked. Bullets name concrete tech: Lambda, Bedrock, DynamoDB, Whisper, ElevenLabs, Vercel KV, Terraform, ML Kit, etc. Don't say "AI things"; say what.

3. CLOSING THOUGHT — single short line. Monk-mode coded, philosophical-but-grounded. Examples that fit:
   - "The loop is the product."
   - "Discipline compounds faster than intellect."
   - "Boring stack, sharp execution."
   - "Most of the leverage is in the constraints."

   Don't recycle the same closer day after day; vary the angle.

Hard constraints:
- 280 character ceiling, weighted. Emojis count as 2 each — keep prose tight.
- No hashtags. No @ mentions. No URLs. No "— Emre" sign-off.
- No threads. No "1/" or "🧵" markers.
- If nothing technical shipped (docs/typos/refactors only), be honest:
  "Quiet day. Just cleanup — docs, a typo, a comment. Heads-down builds resume tomorrow."

Output: ONLY the tweet text exactly as it should appear on Twitter. No preamble. No quotation marks around the tweet. No meta-commentary. Just the words.`;

function unauthorized(): Response {
  return new Response(JSON.stringify({ error: "unauthorized" }), {
    status: 401,
    headers: { "Content-Type": "application/json" },
  });
}

function isAuthorized(req: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const header = req.headers.get("authorization") ?? "";
  const expected = `Bearer ${secret}`;
  // Constant-time-ish — string compare is fine, the secret is server-side.
  return header === expected;
}

function todayUtcDate(): string {
  const now = new Date();
  const y = now.getUTCFullYear();
  const m = String(now.getUTCMonth() + 1).padStart(2, "0");
  const d = String(now.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

const hasKv = Boolean(
  process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN,
);

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

async function generateDraft(context: string): Promise<string | null> {
  if (!process.env.ANTHROPIC_API_KEY) return null;
  try {
    const result = await generateText({
      model: anthropic("claude-haiku-4-5-20251001"),
      system: SYSTEM_PROMPT,
      prompt: context,
      temperature: 0.6,
      maxOutputTokens: 200,
    });
    let text = result.text.trim();
    // Strip surrounding quotes the model sometimes adds despite the
    // explicit instruction, then enforce the hard 280-char ceiling
    // (truncate with ellipsis if Claude went long).
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

export async function POST(req: Request) {
  if (!isAuthorized(req)) return unauthorized();

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

  const postResult = await postTweet(draft);

  const baseRecord: DailyStandupRecord = {
    date,
    draft,
    context_summary: context.slice(0, 500),
  };
  const record: DailyStandupRecord =
    postResult.ok
      ? {
          ...baseRecord,
          tweet_id: postResult.tweet_id,
          posted_at: new Date().toISOString(),
        }
      : {
          ...baseRecord,
          error: postResult.error,
        };

  if (hasKv) {
    try {
      await kv.set(recordKey, record, { ex: STANDUP_TTL_SECONDS });
    } catch {
      /* swallow — the draft was generated and posted (or not); the
         persistence failure shouldn't change the outward result. */
    }
  }

  if (!postResult.ok) {
    console.error(
      "[auto-tweet] post failed:",
      JSON.stringify({ date, error: postResult.error }),
    );
    return Response.json(
      { ok: false, date, draft, error: postResult.error },
      { status: 502, headers: { "Cache-Control": "no-store" } },
    );
  }

  console.log(
    "[auto-tweet] posted:",
    JSON.stringify({ date, tweet_id: postResult.tweet_id, length: draft.length }),
  );
  return Response.json(
    { ok: true, date, draft, tweet_id: postResult.tweet_id },
    { headers: { "Cache-Control": "no-store" } },
  );
}
