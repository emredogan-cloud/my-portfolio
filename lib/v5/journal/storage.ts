import { kv } from "@vercel/kv";

import {
  compareWeekIds,
  isValidWeekId,
  type JournalEntry,
} from "./schema";

/**
 * V5 Phase 9 Sub-PR 9.3 — journal KV storage.
 *
 * Two KV shapes:
 *
 *   v5:journal:entry:<week_id>  → JSON-encoded JournalEntry
 *   v5:journal:index            → JSON-encoded { weeks: string[] }
 *                                  (week ids that have entries)
 *
 * The index lets the public index page read the list of
 * available weeks in one round-trip; without it, listing
 * would need a SCAN over the entry keyspace which @vercel/kv
 * doesn't surface efficiently.
 *
 * Write path
 *   The cron writes BOTH keys atomically-ish: write the entry
 *   first, then add the week_id to the index (idempotent
 *   via the Set + JSON-encode dance). Failure on the second
 *   step leaves the entry without an index reference; the
 *   reader can still fetch by direct key.
 *
 * Read path
 *   `readJournalEntry(week)` returns the entry or null.
 *   `listJournalWeeks()` returns the sorted week-id list,
 *   newest first.
 *
 * Graceful no-op contract
 *   - KV unavailable → write silently returns; read returns
 *     null / empty list.
 *   - Malformed JSON in KV → read returns null; the public
 *     page renders an empty state.
 *   - The journal layer never throws.
 *
 * Privacy posture
 *   The journal entries are operator-side editorial data.
 *   No visitor identifier enters the KV path.
 *
 * Edge-safety: pure helpers + KV writes. Runs in any
 * runtime that supports @vercel/kv.
 */

const ENTRY_KEY_PREFIX = "v5:journal:entry:";
const INDEX_KEY = "v5:journal:index";

interface JournalIndex {
  weeks: readonly string[];
}

const hasKv = Boolean(
  process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN,
);

function entryKey(weekId: string): string {
  return `${ENTRY_KEY_PREFIX}${weekId}`;
}

/**
 * Persist a journal entry. Writes the entry's JSON +
 * appends its week_id to the index (deduped, sorted).
 *
 * Idempotent on the week_id slot — calling twice with
 * different entries for the same week ID overwrites + keeps
 * exactly one index entry.
 *
 * Graceful no-op: returns silently on KV unavailability or
 * any error.
 */
export async function writeJournalEntry(
  entry: JournalEntry,
): Promise<void> {
  if (!hasKv) return;
  if (!isValidWeekId(entry.week_id)) return;
  try {
    await kv.set(entryKey(entry.week_id), entry);
    /* Update the index in a non-atomic pair. The window
     * between the two writes is small; readers that catch
     * mid-update see the entry's direct key + an
     * unchanged index (the entry will surface on the next
     * index regeneration). */
    const stored = await kv.get<JournalIndex>(INDEX_KEY);
    const existing = new Set<string>(stored?.weeks ?? []);
    existing.add(entry.week_id);
    const sorted = [...existing].sort(compareWeekIds);
    await kv.set(INDEX_KEY, { weeks: sorted });
  } catch {
    /* swallow — the cron's caller logs the error path; the
     * journal stays in a consistent state from the last
     * successful write. */
  }
}

/**
 * Read a single journal entry by week id. Returns null on
 * KV unavailability, unknown week, malformed shape, or any
 * read error.
 *
 * Validates the inbound `weekId` syntactically before
 * touching KV — a malformed id can't accidentally read an
 * unrelated key.
 */
export async function readJournalEntry(
  weekId: string,
): Promise<JournalEntry | null> {
  if (!hasKv) return null;
  if (!isValidWeekId(weekId)) return null;
  try {
    const stored = await kv.get<JournalEntry>(entryKey(weekId));
    if (!stored || typeof stored !== "object") return null;
    /* Defensive shape check — we don't validate every field
     * (the writer's schema enforces shape), but we verify
     * the load-bearing primitives are present. */
    if (typeof stored.week_id !== "string") return null;
    if (stored.week_id !== weekId) return null;
    if (typeof stored.generated_at !== "string") return null;
    return stored;
  } catch {
    return null;
  }
}

/**
 * List all week ids that have entries. Newest first.
 * Returns an empty array on KV unavailability / index
 * absence / read error.
 *
 * The list reads from the maintained index — efficient,
 * one KV read. If the index is desync from the entry
 * keyspace (a partial-write window), entries without an
 * index reference are invisible to this listing until the
 * next successful index update.
 */
export async function listJournalWeeks(): Promise<readonly string[]> {
  if (!hasKv) return [];
  try {
    const stored = await kv.get<JournalIndex>(INDEX_KEY);
    if (!stored || !Array.isArray(stored.weeks)) return [];
    /* Defensive filter — drop malformed entries. */
    const valid = stored.weeks.filter(
      (w): w is string => typeof w === "string" && isValidWeekId(w),
    );
    /* Sort newest-first regardless of stored order
     * (the writer maintains chronological order; this
     * keeps consumers safe even if the index drifts). */
    return [...valid].sort((a, b) => -compareWeekIds(a, b));
  } catch {
    return [];
  }
}

/**
 * Batch-read every journal entry referenced in the index.
 * Used by the public index page to show entry summaries
 * (just the narrative + week_id + counts, no top_commits)
 * without rendering 52 separate fetches.
 *
 * Returns at most `limit` entries (default 12 — about a
 * quarter of a year). Older entries are paginated via
 * future surface design.
 */
export async function listRecentJournalEntries(
  limit: number = 12,
): Promise<readonly JournalEntry[]> {
  const weeks = await listJournalWeeks();
  const sliced = weeks.slice(0, limit);
  if (sliced.length === 0) return [];
  const entries = await Promise.all(
    sliced.map((week) => readJournalEntry(week)),
  );
  return entries.filter(
    (e): e is JournalEntry => e !== null,
  );
}
