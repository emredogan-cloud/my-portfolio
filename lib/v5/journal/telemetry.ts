import { kv } from "@vercel/kv";

/**
 * V5 Phase 9 Sub-PR 9.3 — journal adoption counters.
 *
 *   v5:journal:adoption  → hash {
 *     index_view     : /v5/journal index page rendered
 *                      (once per session via client-side
 *                      dedupe).
 *     entry_view     : any /v5/journal/<week> detail page
 *                      rendered (once per session per week).
 *     cron_generated : cron fired + wrote an entry.
 *     cron_error     : cron fired but failed to write
 *                      (KV down, snapshot threw, etc.).
 *   }
 *
 * Why these four kinds
 *   - `index_view` + `entry_view` answer "do visitors reach
 *     the journal at all?" and "do they drill into specific
 *     weeks?".
 *   - `cron_generated` is the OPERATOR-side health signal:
 *     "did this week's cron actually fire?".
 *   - `cron_error` lets the operator see the failure tail
 *     without needing to read logs.
 *
 * Same posture as every other V5 adoption hash:
 *   - Single HASH, atomic HINCRBY per event.
 *   - Graceful no-op when KV is unavailable.
 *   - Fire-and-forget at the call site; errors swallow.
 *
 * Privacy posture: aggregate-only. The four counters carry
 * no per-visitor identifier.
 */

export const JOURNAL_ADOPTION_HASH_KEY = "v5:journal:adoption";

export const JOURNAL_ADOPTION_EVENTS = [
  "index_view",
  "entry_view",
  "cron_generated",
  "cron_error",
] as const;

export type JournalAdoptionEvent =
  (typeof JOURNAL_ADOPTION_EVENTS)[number];

const KNOWN_EVENTS: ReadonlySet<JournalAdoptionEvent> = new Set(
  JOURNAL_ADOPTION_EVENTS,
);

export function isJournalAdoptionEvent(
  value: unknown,
): value is JournalAdoptionEvent {
  return (
    typeof value === "string" &&
    KNOWN_EVENTS.has(value as JournalAdoptionEvent)
  );
}

const hasKv = Boolean(
  process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN,
);

/** Increment one journal-adoption counter. Fire-and-forget;
 *  swallows every error path. */
export async function recordJournalEvent(
  kind: JournalAdoptionEvent,
): Promise<void> {
  if (!hasKv) return;
  if (!isJournalAdoptionEvent(kind)) return;
  try {
    await kv.hincrby(JOURNAL_ADOPTION_HASH_KEY, kind, 1);
  } catch {
    /* swallow — journal telemetry is decorative */
  }
}

/** Read the entire adoption hash. Returns an empty object
 *  on KV unavailable / hash never written / read error. */
export async function readJournalAdoption(): Promise<
  Record<string, number>
> {
  if (!hasKv) return {};
  try {
    const stored = await kv.hgetall<Record<string, number | string>>(
      JOURNAL_ADOPTION_HASH_KEY,
    );
    if (!stored || typeof stored !== "object") return {};
    const out: Record<string, number> = {};
    for (const [k, v] of Object.entries(stored)) {
      const n = typeof v === "number" ? v : Number(v);
      if (Number.isFinite(n)) out[k] = n;
    }
    return out;
  } catch {
    return {};
  }
}
