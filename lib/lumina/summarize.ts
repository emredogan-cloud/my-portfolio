import { anthropic } from "@ai-sdk/anthropic";
import { generateText } from "ai";
import type { UIMessage } from "ai";
import {
  loadSummary,
  saveSummary,
  VERBATIM_CONTEXT_MESSAGES,
  type SessionSummary,
} from "./memory";
import { redactMessages } from "./redact";

/**
 * Lumina session summarization — Sub-PR 3.3.
 *
 * When a thread crosses the verbatim context window (8 turns), the
 * chat route can no longer feed every prior message to the model
 * without bloating cost. The summarization layer maintains a cached
 * 2-3 sentence factual recap of every turn that falls outside the
 * verbatim window, so the model still has cheap recall of "what we
 * talked about earlier".
 *
 * Generation cadence:
 *   - First summary fires when the thread reaches 12 messages
 *     (8 verbatim + 4 older).
 *   - Subsequent regenerations fire whenever the older-turn count
 *     has grown by 4 since the cached summary was made. This caps
 *     the regen rate at one Haiku call per ~4 turns, keeping the
 *     marginal cost well under $0.001 per conversation.
 *
 * Cost shape:
 *   - One Haiku 4.5 call per regeneration, max 200 output tokens,
 *     input is the redacted text of older turns (capped at ~6 KB).
 *     ≈ $0.0001 per regen. Cheaper than the chat-turn savings the
 *     summary unlocks (cutting 12 → 8 verbatim turns saves more
 *     than that on the very next chat turn).
 *
 * Failure shape:
 *   - Fire-and-forget from onFinish. If KV is offline, the model
 *     call fails, or the prompt is empty, the function silently
 *     returns without writing anything — the next save attempt
 *     will try again.
 */

const SUMMARY_TRIGGER_GAP = 4;
const SUMMARY_MODEL_ID = "claude-haiku-4-5-20251001";
const SUMMARY_MAX_INPUT_CHARS = 6000;
const SUMMARY_MAX_OUTPUT_TOKENS = 200;

const SUMMARY_SYSTEM_PROMPT = `
You are a memory-summarization layer for an operator console.

Read the conversation excerpt below and return a SHORT factual recap of
what the visitor and the assistant discussed. The recap will be fed
back into the assistant's system prompt as "earlier in this session"
context — so it must be readable and useful, not theatrical.

Rules:
- 2 to 3 sentences. No more.
- Third person, factual register. Reference the visitor as "the visitor".
- Mention the concrete topics actually discussed (project names,
  technical concepts, tools the assistant ran). Do NOT speculate.
- Do NOT mention names, emails, phone numbers, or any other personally
  identifying detail even if you see one — the upstream layer redacts
  most of it, but assume you may see partial fragments.
- Do NOT include greetings, sign-offs, or filler.
- Output the recap text only. No preamble, no headers, no quotes.
`.trim();

/** Flatten a UIMessage[] thread into a single plain-text blob the
 *  summarizer can read. Tool calls + tool results are skipped — they
 *  carry structured data the summarizer can't meaningfully recap. */
function serializeForSummary(messages: UIMessage[]): string {
  const lines: string[] = [];
  for (const m of messages) {
    const partsAny = (m as unknown as { parts?: unknown }).parts;
    if (!Array.isArray(partsAny)) continue;
    const role = m.role === "user" ? "Visitor" : "Assistant";
    for (const p of partsAny) {
      const part = p as { type?: unknown; text?: unknown };
      if (part?.type === "text" && typeof part.text === "string") {
        const t = part.text.trim();
        if (t.length === 0) continue;
        lines.push(`${role}: ${t}`);
      }
    }
  }
  let out = lines.join("\n");
  if (out.length > SUMMARY_MAX_INPUT_CHARS) {
    out = out.slice(out.length - SUMMARY_MAX_INPUT_CHARS);
  }
  return out;
}

/**
 * Decide whether the thread warrants regenerating the cached summary.
 * Returns true when:
 *   - The thread is long enough to need one at all (more than the
 *     verbatim window), AND
 *   - Either no summary exists yet, OR the summary covers a thread
 *     length that's at least SUMMARY_TRIGGER_GAP turns behind the
 *     current thread length.
 */
function shouldRegenerate(
  threadLength: number,
  existing: SessionSummary | null,
): boolean {
  if (threadLength <= VERBATIM_CONTEXT_MESSAGES) return false;
  if (!existing) return true;
  return threadLength - existing.threadLength >= SUMMARY_TRIGGER_GAP;
}

/**
 * Regenerate the session summary if conditions are met. Safe to
 * fire-and-forget from onFinish — every error path is swallowed
 * silently. Caller is the chat route after the verbatim save has
 * landed; this runs as a background tail-task.
 */
export async function maybeRegenerateSummary(
  sessionId: string,
  messages: UIMessage[],
): Promise<void> {
  if (!messages || messages.length === 0) return;

  /* Slice off the messages already covered by the verbatim window;
   * older-turn block is what the summary describes. */
  const olderCount = messages.length - VERBATIM_CONTEXT_MESSAGES;
  if (olderCount <= 0) return;
  const older = messages.slice(0, olderCount);

  const existing = await loadSummary(sessionId);
  if (!shouldRegenerate(messages.length, existing)) return;

  /* Redact a second time defensively — even though the verbatim
   * save also redacts, a passing model call should never see raw
   * PII. Idempotent so this is a cheap no-op when already clean. */
  const sanitized = redactMessages(older);
  const serialized = serializeForSummary(sanitized);
  if (serialized.length === 0) return;

  let text: string;
  try {
    const result = await generateText({
      model: anthropic(SUMMARY_MODEL_ID),
      system: SUMMARY_SYSTEM_PROMPT,
      prompt: `Conversation excerpt:\n\n${serialized}`,
      temperature: 0.1,
      maxOutputTokens: SUMMARY_MAX_OUTPUT_TOKENS,
    });
    text = result.text.trim();
  } catch {
    /* Anthropic call failed — leave the prior summary in place, try
     * again on the next regen window. */
    return;
  }

  if (text.length === 0) return;

  await saveSummary(sessionId, text, messages.length);
}
