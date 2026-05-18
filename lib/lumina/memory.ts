import { kv } from "@vercel/kv";
import type { UIMessage } from "ai";
import { redactMessages } from "./redact";

/**
 * Lumina conversation memory — KV-backed, per-session, 14-day TTL.
 *
 * Contract:
 *   - Session IDs are anonymous UUIDs minted client-side and persisted
 *     in localStorage. The server never asks "who are you" — it just
 *     looks up the bucket whose key matches.
 *   - Stored value is the full UIMessage[] thread at last write,
 *     with PII (emails / phone numbers / AWS access keys) redacted
 *     via lib/lumina/redact before persistence. The redaction is
 *     idempotent — re-storing an already-redacted thread is a no-op.
 *   - A parallel summary bucket caches a 2-3 sentence factual recap
 *     of the older turns once the thread crosses the verbatim-context
 *     window (8 turns). The chat route reads the summary, prepends
 *     it to the system prompt as a session-memory note, and feeds
 *     only the last 8 turns verbatim to the model.
 *   - TTL refreshes on every saveSession + saveSummary, so an
 *     actively-used thread never expires; an abandoned one drops
 *     out of KV after 14 days.
 *   - When KV is not provisioned (local dev), every function is a
 *     graceful no-op: load returns null, save returns silently. The
 *     route handler can still operate, it just won't carry state
 *     across browser tabs.
 *
 * Why KV instead of vector search:
 *   Phase 2 doc allows either. For an MVP the visitor's recall
 *   needs are chronological ("last week we talked about CWH"), not
 *   semantic. KV keeps the dependency surface tight and removes the
 *   embedding cost. Phase 3+ can upgrade to Upstash Vector if memory
 *   ever needs cross-session semantic recall.
 */

/* V4 § 4.4 Sub-PR 4.1 spec: 14-day session TTL. */
const TTL_SECONDS = 60 * 60 * 24 * 14;
const KEY_PREFIX = "lumina:session:";
const SUMMARY_KEY_PREFIX = "lumina:summary:";
// Hard cap on stored thread size — prevents an adversarial visitor
// from filling KV with megabytes of synthetic context. 100 messages
// is well past any realistic conversation length.
const MAX_MESSAGES = 100;
/* Verbatim-context cap, V4 § 4.4 Sub-PR 4.1 spec: only the most
 * recent 8 turns get fed to the model verbatim. Older turns are
 * collapsed into a single-paragraph summary that lives at
 * SUMMARY_KEY_PREFIX + sessionId. */
export const VERBATIM_CONTEXT_MESSAGES = 8;

const hasKv = Boolean(
  process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN,
);

function sessionKey(sessionId: string): string {
  return `${KEY_PREFIX}${sessionId}`;
}

function summaryKey(sessionId: string): string {
  return `${SUMMARY_KEY_PREFIX}${sessionId}`;
}

/**
 * Cached session summary shape. `threadLength` is the number of
 * messages that existed at the time the summary was generated —
 * used by the chat route to decide whether the summary still
 * covers the visible verbatim window or needs regeneration.
 */
export interface SessionSummary {
  summary: string;
  threadLength: number;
  generatedAt: number;
}

/**
 * Lightweight session-id shape check. We don't enforce a strict UUID
 * format because the client generates IDs via crypto.randomUUID()
 * which produces standard v4 UUIDs, but anything that's a short
 * non-empty ASCII string is acceptable — the KV key is name-spaced
 * with KEY_PREFIX and the field is never echoed back to clients.
 */
export function isValidSessionId(value: unknown): value is string {
  return typeof value === "string" && /^[a-zA-Z0-9_-]{8,128}$/.test(value);
}

/** Return the persisted thread for this session, or null if KV is
 *  unavailable / has never seen this id / errors during read. */
export async function loadSession(
  sessionId: string,
): Promise<UIMessage[] | null> {
  if (!hasKv) return null;
  if (!isValidSessionId(sessionId)) return null;
  try {
    const stored = await kv.get<UIMessage[]>(sessionKey(sessionId));
    if (!Array.isArray(stored)) return null;
    return stored;
  } catch {
    return null;
  }
}

/** Persist the thread and refresh the 14-day TTL. Truncates to
 *  MAX_MESSAGES (keeping the most recent), then redacts PII out of
 *  every text part before write. No-op when KV is unavailable or
 *  the session-id shape is wrong. */
export async function saveSession(
  sessionId: string,
  messages: UIMessage[],
): Promise<void> {
  if (!hasKv) return;
  if (!isValidSessionId(sessionId)) return;
  if (!Array.isArray(messages) || messages.length === 0) return;

  const trimmed =
    messages.length > MAX_MESSAGES
      ? messages.slice(-MAX_MESSAGES)
      : messages;
  const redacted = redactMessages(trimmed);

  try {
    await kv.set(sessionKey(sessionId), redacted, { ex: TTL_SECONDS });
  } catch {
    /* swallow — memory is decorative, not critical to chat */
  }
}

/** Return the cached session summary, or null if KV is unavailable,
 *  the session has no summary yet, or the read errors out. */
export async function loadSummary(
  sessionId: string,
): Promise<SessionSummary | null> {
  if (!hasKv) return null;
  if (!isValidSessionId(sessionId)) return null;
  try {
    const stored = await kv.get<SessionSummary>(summaryKey(sessionId));
    if (
      !stored ||
      typeof stored.summary !== "string" ||
      typeof stored.threadLength !== "number"
    ) {
      return null;
    }
    return stored;
  } catch {
    return null;
  }
}

/** Delete both KV buckets (thread + summary) for the given session.
 *  Called by /api/chat/forget when the visitor clicks the Forget-Me
 *  control in the chat header. Always silent on errors — the
 *  client-side state reset must succeed regardless of KV reachability,
 *  and KV records expire naturally within 14 days anyway. */
export async function forgetSession(sessionId: string): Promise<void> {
  if (!hasKv) return;
  if (!isValidSessionId(sessionId)) return;
  try {
    /* del() accepts varargs; sending both keys in one round-trip
     * keeps the privacy action atomic from the client's POV. */
    await kv.del(sessionKey(sessionId), summaryKey(sessionId));
  } catch {
    /* swallow — the data falls out naturally on TTL expiry */
  }
}

/** Persist a freshly-generated session summary. Caps the body at
 *  2000 chars so a runaway model response can't bloat KV. */
export async function saveSummary(
  sessionId: string,
  summary: string,
  threadLength: number,
): Promise<void> {
  if (!hasKv) return;
  if (!isValidSessionId(sessionId)) return;
  if (typeof summary !== "string" || summary.length === 0) return;

  const trimmed = summary.length > 2000 ? `${summary.slice(0, 2000)}…` : summary;
  const payload: SessionSummary = {
    summary: trimmed,
    threadLength,
    generatedAt: Date.now(),
  };
  try {
    await kv.set(summaryKey(sessionId), payload, { ex: TTL_SECONDS });
  } catch {
    /* swallow — summary is opportunistic, not critical to chat */
  }
}
