import { kv } from "@vercel/kv";

/**
 * V5 Phase 7 Sub-PR 7.1 — temporal adoption telemetry.
 *
 * V5 § 2.13 prescribes the key shape
 *   v5:temporal:<surface>:<metric>:<bucket>
 * — but the foundation sub-PR consolidates the early signals
 * onto a single hash to match the 6.4 memory-adoption pattern.
 * One HASH, three event kinds, all aggregate.
 *
 * Schema:
 *   v5:temporal:adoption  → hash {
 *     view          : page-level visits to /evolution
 *     category_view : a category filter was applied via the URL
 *     event_view    : a specific event id was deep-linked / scrolled to
 *   }
 *
 * Same posture as Phase 4.3's per-tool counter + Phase 5.4's
 * playground funnel + Phase 6.4's memory adoption:
 *   - Single HASH, atomic HINCRBY per event.
 *   - Graceful no-op when KV is unavailable.
 *   - Fire-and-forget at the call site; errors swallow inside
 *     the helper.
 *
 * Privacy posture:
 *   - Aggregate-only. Counters by event kind, nothing per-
 *     visitor, no IP, no session-id field. The temporal layer
 *     does NOT collect any visitor identity.
 *   - The page visit is recorded by `VisitPing surface="evolution"`
 *     (V4 telemetry); this hash captures the FILTER / DEEP-LINK
 *     interactions specific to the temporal surface so the
 *     operator can see whether the layer earns its slot beyond
 *     the raw visit count.
 */

export const TEMPORAL_ADOPTION_HASH_KEY = "v5:temporal:adoption";

/**
 * The closed allow-list of temporal adoption event kinds. The
 * endpoint validates against this set before HINCRBY.
 *
 *   view          → the /evolution surface rendered (paired with
 *                   VisitPing for symmetry with /lumina/brain and
 *                   /v5/perception; the hash captures
 *                   surface-specific signal beyond the V4 visit
 *                   counter).
 *   category_view → a category filter was applied (`?category=...`).
 *                   Drives Phase 7+ tuning of which categories
 *                   earn editorial polish.
 *   event_view    → a deep link to a specific event was followed
 *                   (URL hash present on initial paint). Drives
 *                   Phase 7+ decisions about which entries warrant
 *                   detail pages of their own.
 */
export const TEMPORAL_ADOPTION_EVENTS = [
  "view",
  "category_view",
  "event_view",
] as const;

export type TemporalAdoptionEvent =
  (typeof TEMPORAL_ADOPTION_EVENTS)[number];

const KNOWN_EVENTS: ReadonlySet<TemporalAdoptionEvent> = new Set(
  TEMPORAL_ADOPTION_EVENTS,
);

export function isTemporalAdoptionEvent(
  value: unknown,
): value is TemporalAdoptionEvent {
  return (
    typeof value === "string" &&
    KNOWN_EVENTS.has(value as TemporalAdoptionEvent)
  );
}

const hasKv = Boolean(
  process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN,
);

/** Increment one temporal-adoption counter. Fire-and-forget;
 *  the helper is async only because @vercel/kv is. Swallows
 *  every error path. */
export async function recordTemporalEvent(
  kind: TemporalAdoptionEvent,
): Promise<void> {
  if (!hasKv) return;
  if (!KNOWN_EVENTS.has(kind)) return;
  try {
    await kv.hincrby(TEMPORAL_ADOPTION_HASH_KEY, kind, 1);
  } catch {
    /* swallow — temporal telemetry is decorative */
  }
}

/** Read the entire adoption hash. Returns an empty object on
 *  KV unavailable / hash never written / read error. Matches
 *  the shape `readMemoryAdoption` exposes. */
export async function readTemporalAdoption(): Promise<
  Record<string, number>
> {
  if (!hasKv) return {};
  try {
    const stored = await kv.hgetall<Record<string, number | string>>(
      TEMPORAL_ADOPTION_HASH_KEY,
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
