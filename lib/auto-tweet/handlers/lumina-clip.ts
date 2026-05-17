import { anthropic } from "@ai-sdk/anthropic";
import { generateText } from "ai";
import { kv } from "@vercel/kv";
import type { UIMessage } from "ai";
import { postTweet, TWEET_MAX_LENGTH } from "@/lib/twitter-client";
import { LUMINA_CLIP_SYSTEM_PROMPT } from "@/lib/auto-tweet/prompts/lumina-clip";
import { isDuplicate, recordPost } from "@/lib/auto-tweet/dedupe";
import { AUTOTWEET_MODES } from "@/lib/auto-tweet/modes";

/**
 * Lumina clip handler — weekly "best answer of the week" text post.
 *
 * V4 § 6.1.B SUB-PR 1.3 step 5: "Phase 1'de just text post, video
 * Phase 3.6'da."
 *
 * Selection signal in v1: scan up to N recent Lumina KV sessions
 * (key prefix lumina:session:*), pick the longest assistant turn
 * from the most-recently-touched session that has at least one
 * substantial reply. The "copy-pressed + follow-up positive" signal
 * V4 § 6.1.B describes needs telemetry that lands in Sub-PR 1.5;
 * until then the length+recency heuristic is the v1 stand-in.
 *
 * Privacy: only the assistant turn ever surfaces to the model and
 * the tweet — visitor messages are read for context but not echoed.
 * Visitor session IDs are anonymous UUIDs by design (lib/lumina/memory)
 * so even the read path doesn't expose identity.
 */

const CLIP_KEY_PREFIX = "v4:autotweet:lumina_clip:";
const CLIP_TTL_SECONDS = 60 * 60 * 24 * 120; // 120 days
const SESSION_SCAN_LIMIT = 25;
const MIN_ASSISTANT_TURN_CHARS = 200;
const MAX_ASSISTANT_TURN_CHARS_FOR_PROMPT = 800;

interface ClipRecord {
  date: string;
  draft: string;
  tweet_id?: string;
  posted_at?: string;
  error?: string;
  error_detail?: string;
  skipped?: "duplicate" | "no-substantial-turn" | "draft-empty";
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

/**
 * Extract the plain text of a UIMessage. AI SDK 6's UIMessage has
 * `parts` (an array of text/tool-call parts) rather than a single
 * `content` string; we concatenate the text parts only.
 */
function uiMessageText(msg: UIMessage): string {
  if (!Array.isArray(msg.parts)) return "";
  return msg.parts
    .filter((p): p is { type: "text"; text: string } => p.type === "text")
    .map((p) => p.text)
    .join("\n");
}

interface AssistantTurnCandidate {
  sessionId: string;
  text: string;
}

/**
 * Walk up to SESSION_SCAN_LIMIT recent Lumina sessions and pick the
 * single longest assistant turn that meets the minimum-length bar.
 * Returns null when KV has no Lumina sessions or every turn is too
 * thin to quote.
 */
async function pickBestAssistantTurn(): Promise<AssistantTurnCandidate | null> {
  if (!hasKv) return null;
  try {
    /* Scan iterator pattern from lib/lumina/memory's KEY_PREFIX
     * (`lumina:session:`). We collect candidate keys, fetch in
     * parallel, then choose. */
    const keys: string[] = [];
    let cursor = "0";
    do {
      const result = (await kv.scan(cursor, {
        match: "lumina:session:*",
        count: 100,
      })) as [string, string[]];
      cursor = result[0];
      keys.push(...result[1]);
      if (keys.length >= SESSION_SCAN_LIMIT) break;
    } while (cursor !== "0");

    if (keys.length === 0) return null;

    const slice = keys.slice(0, SESSION_SCAN_LIMIT);
    const threads = await Promise.all(
      slice.map((k) => kv.get<UIMessage[]>(k)),
    );

    let best: AssistantTurnCandidate | null = null;
    for (let i = 0; i < slice.length; i++) {
      const thread = threads[i];
      if (!Array.isArray(thread)) continue;
      for (const msg of thread) {
        if (msg.role !== "assistant") continue;
        const text = uiMessageText(msg);
        if (text.length < MIN_ASSISTANT_TURN_CHARS) continue;
        if (!best || text.length > best.text.length) {
          best = {
            sessionId: slice[i]!.replace("lumina:session:", ""),
            text: text.slice(0, MAX_ASSISTANT_TURN_CHARS_FOR_PROMPT),
          };
        }
      }
    }
    return best;
  } catch (err) {
    console.error(
      "[auto-tweet] lumina_clip: KV scan failed:",
      err instanceof Error ? err.message : "unknown",
    );
    return null;
  }
}

async function generateDraft(turn: string): Promise<string | null> {
  if (!process.env.ANTHROPIC_API_KEY) return null;
  try {
    const result = await generateText({
      model: anthropic("claude-haiku-4-5-20251001"),
      system: LUMINA_CLIP_SYSTEM_PROMPT,
      prompt: `Lumina assistant turn to clip:\n\n${turn}`,
      temperature: 0.55,
      maxOutputTokens: 220,
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
      "[auto-tweet] lumina_clip: claude generation failed:",
      err instanceof Error ? err.message : "unknown",
    );
    return null;
  }
}

/**
 * Run the lumina_clip flow. Same response shape vocabulary as the
 * other handlers.
 */
export async function runLuminaClip(): Promise<Response> {
  const date = todayUtcDate();
  const recordKey = `${CLIP_KEY_PREFIX}${date}`;

  const candidate = await pickBestAssistantTurn();
  if (!candidate) {
    console.warn(
      "[auto-tweet] lumina_clip skipped — no substantial assistant turn in recent sessions.",
    );
    const record: ClipRecord = {
      date,
      draft: "",
      skipped: "no-substantial-turn",
    };
    if (hasKv) {
      try {
        await kv.set(recordKey, record, { ex: CLIP_TTL_SECONDS });
      } catch {
        /* swallow */
      }
    }
    return Response.json(
      { ok: true, skipped: "no-substantial-turn", date, mode: AUTOTWEET_MODES.LUMINA_CLIP },
      { headers: { "Cache-Control": "no-store" } },
    );
  }

  const draft = await generateDraft(candidate.text);
  if (!draft || draft.length === 0) {
    const record: ClipRecord = {
      date,
      draft: "",
      skipped: "draft-empty",
    };
    if (hasKv) {
      try {
        await kv.set(recordKey, record, { ex: CLIP_TTL_SECONDS });
      } catch {
        /* swallow */
      }
    }
    return Response.json(
      { ok: true, skipped: "draft-empty", date, mode: AUTOTWEET_MODES.LUMINA_CLIP },
      { headers: { "Cache-Control": "no-store" } },
    );
  }

  if (await isDuplicate(draft)) {
    console.warn(
      `[auto-tweet] lumina_clip skipped — duplicate of recent tweet: "${draft.slice(0, 80)}…"`,
    );
    const record: ClipRecord = { date, draft, skipped: "duplicate" };
    if (hasKv) {
      try {
        await kv.set(recordKey, record, { ex: CLIP_TTL_SECONDS });
      } catch {
        /* swallow */
      }
    }
    return Response.json(
      { ok: true, skipped: "duplicate", date, draft, mode: AUTOTWEET_MODES.LUMINA_CLIP },
      { headers: { "Cache-Control": "no-store" } },
    );
  }

  const postResult = await postTweet(draft);

  const baseRecord: ClipRecord = { date, draft };
  const record: ClipRecord = postResult.ok
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
      await kv.set(recordKey, record, { ex: CLIP_TTL_SECONDS });
    } catch {
      /* swallow */
    }
  }

  if (postResult.ok) {
    void recordPost(AUTOTWEET_MODES.LUMINA_CLIP, draft);
  }

  if (!postResult.ok) {
    console.error(
      [
        "[auto-tweet] lumina_clip POST failed.",
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
        mode: AUTOTWEET_MODES.LUMINA_CLIP,
      },
      { status: 502, headers: { "Cache-Control": "no-store" } },
    );
  }

  console.log(
    [
      "[auto-tweet] lumina_clip posted",
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
      mode: AUTOTWEET_MODES.LUMINA_CLIP,
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
