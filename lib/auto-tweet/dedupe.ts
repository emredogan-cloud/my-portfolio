import { kv } from "@vercel/kv";
import type { AutotweetMode } from "./modes";

/**
 * Auto-tweet 2.0 — content history + duplicate prevention.
 *
 * V4 Phase 1 — Sub-PR 1.3 step 1.3.7 / V4 § 6.1.B SUB-PR 1.3.1
 * "Dedupe: aynı içerik 14 gün boyunca tekrar yasak".
 *
 * Schema:
 *   v4:autotweet:history:<YYYY-MM-DD>        list of recent tweets (today's bucket)
 *   v4:autotweet:format:<mode>:last_post     timestamp of last successful post
 *
 * Storage strategy:
 *   - Daily bucket of tweet content, 15-day TTL (one day extra so
 *     the 14-day check at midnight UTC never misses an edge case).
 *   - On a new draft: hash the normalised content, scan the last
 *     14 daily buckets, abort if any bucket contains the same hash.
 *   - On a successful post: append the hash + raw text to today's
 *     bucket, refresh the bucket TTL, set `format:<mode>:last_post`.
 *
 * Graceful no-op contract: when KV is unavailable, dedupe degrades
 * to "allow everything" — better to let a near-duplicate slip than
 * to silently block all auto-tweets during a KV outage. Telemetry-
 * style decorative behaviour.
 */

const HISTORY_KEY_PREFIX = "v4:autotweet:history:";
const FORMAT_LAST_POST_PREFIX = "v4:autotweet:format:";
const HISTORY_TTL_SECONDS = 60 * 60 * 24 * 15;
const DEDUPE_WINDOW_DAYS = 14;

interface HistoryEntry {
  hash: string;
  text: string;
  posted_at: string;
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
 * Normalise text for stable hashing: lower-case, collapse runs of
 * whitespace, strip punctuation noise. Reduces false-negatives
 * caused by Claude's mild variation in phrasing across days.
 */
function normalise(text: string): string {
  return text
    .toLowerCase()
    .replace(/\s+/g, " ")
    .replace(/[.,!?;:'"`()[\]{}]/g, "")
    .trim();
}

/**
 * Edge-safe hash: SubtleCrypto SHA-256, hex-encoded, first 16 chars.
 * 64 bits of collision space is plenty for a 14-day × ~10-tweets-
 * per-day corpus; the hash is for equality, not security.
 */
async function hash16(text: string): Promise<string> {
  const buf = new TextEncoder().encode(normalise(text));
  const digest = await crypto.subtle.digest("SHA-256", buf);
  const bytes = new Uint8Array(digest);
  let hex = "";
  for (let i = 0; i < 8; i++) {
    hex += bytes[i]!.toString(16).padStart(2, "0");
  }
  return hex;
}

/**
 * Returns the YYYY-MM-DD strings for the last `n` UTC days,
 * newest first. Used to walk the daily history buckets.
 */
function lastNDates(n: number): string[] {
  const out: string[] = [];
  const today = new Date();
  for (let i = 0; i < n; i++) {
    const d = new Date(
      Date.UTC(
        today.getUTCFullYear(),
        today.getUTCMonth(),
        today.getUTCDate() - i,
      ),
    );
    const y = d.getUTCFullYear();
    const m = String(d.getUTCMonth() + 1).padStart(2, "0");
    const day = String(d.getUTCDate()).padStart(2, "0");
    out.push(`${y}-${m}-${day}`);
  }
  return out;
}

/**
 * Return `true` if the given text already appeared within the last
 * 14 days. Returns `false` on any KV failure (fail-open).
 */
export async function isDuplicate(text: string): Promise<boolean> {
  if (!hasKv) return false;
  try {
    const target = await hash16(text);
    const dates = lastNDates(DEDUPE_WINDOW_DAYS);
    const buckets = await Promise.all(
      dates.map((d) => kv.get<HistoryEntry[]>(`${HISTORY_KEY_PREFIX}${d}`)),
    );
    for (const bucket of buckets) {
      if (!Array.isArray(bucket)) continue;
      if (bucket.some((entry) => entry?.hash === target)) return true;
    }
    return false;
  } catch {
    return false;
  }
}

/**
 * Persist a successful post into today's history bucket and bump
 * the per-format last-post timestamp. No-op when KV is unavailable.
 */
export async function recordPost(
  mode: AutotweetMode,
  text: string,
): Promise<void> {
  if (!hasKv) return;
  if (typeof text !== "string" || text.length === 0) return;
  try {
    const today = todayUtcDate();
    const bucketKey = `${HISTORY_KEY_PREFIX}${today}`;
    const prior = (await kv.get<HistoryEntry[]>(bucketKey)) ?? [];
    const entry: HistoryEntry = {
      hash: await hash16(text),
      text: text.slice(0, 320),
      posted_at: new Date().toISOString(),
    };
    const next = [...prior, entry];
    await kv.set(bucketKey, next, { ex: HISTORY_TTL_SECONDS });
    await kv.set(
      `${FORMAT_LAST_POST_PREFIX}${mode}:last_post`,
      new Date().toISOString(),
    );
  } catch {
    /* swallow — dedupe ledger is decorative, never blocks the post */
  }
}

/**
 * Read the ISO timestamp of the last successful post for a given
 * mode. Returns `null` when KV is unavailable, the key is unset,
 * or the read errors. Used by mode handlers that want to inject
 * "last ran" awareness into their prompt.
 */
export async function readLastPost(
  mode: AutotweetMode,
): Promise<string | null> {
  if (!hasKv) return null;
  try {
    const value = await kv.get<string>(
      `${FORMAT_LAST_POST_PREFIX}${mode}:last_post`,
    );
    return typeof value === "string" ? value : null;
  } catch {
    return null;
  }
}
