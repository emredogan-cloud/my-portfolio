import { kv } from "@vercel/kv";
import type { UIMessage } from "ai";

/**
 * Lumina conversation memory — KV-backed, per-session, 7-day TTL.
 *
 * Contract:
 *   - Session IDs are anonymous UUIDs minted client-side and persisted
 *     in localStorage. The server never asks "who are you" — it just
 *     looks up the bucket whose key matches.
 *   - Stored value is the full UIMessage[] thread at last write.
 *   - TTL refreshes on every saveSession, so an actively-used thread
 *     never expires; an abandoned one drops out of KV after 7 days.
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

const TTL_SECONDS = 60 * 60 * 24 * 7; // 7 days
const KEY_PREFIX = "lumina:session:";
// Hard cap on stored thread size — prevents an adversarial visitor
// from filling KV with megabytes of synthetic context. 100 messages
// is well past any realistic conversation length.
const MAX_MESSAGES = 100;

const hasKv = Boolean(
  process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN,
);

function sessionKey(sessionId: string): string {
  return `${KEY_PREFIX}${sessionId}`;
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

/** Persist the thread and refresh the 7-day TTL. Truncates to
 *  MAX_MESSAGES (keeping the most recent) before write. No-op when
 *  KV is unavailable or the session-id shape is wrong. */
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

  try {
    await kv.set(sessionKey(sessionId), trimmed, { ex: TTL_SECONDS });
  } catch {
    /* swallow — memory is decorative, not critical to chat */
  }
}
