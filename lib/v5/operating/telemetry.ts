import { kv } from "@vercel/kv";

/**
 * V5 Phase 9 Sub-PR 9.1 — operational twin adoption counters.
 *
 * Single hash, six event kinds. Same posture as every
 * other V5 adoption hash since Phase 6.4:
 *
 *   v5:operating:adoption  → hash {
 *     view                      : the /v5/operating page rendered
 *                                 (one per session via client-side
 *                                 dedupe).
 *     section_weekly_inspected  : visitor focused / scrolled into
 *                                 the weekly-commits section.
 *     section_infra_inspected   : focused on active infrastructure.
 *     section_experiments_inspected : focused on running experiments.
 *     section_planned_inspected     : focused on planned-next.
 *     section_failures_inspected    : focused on recent failures.
 *     og_rendered               : the /api/og/operating route
 *                                 composed + returned a PNG
 *                                 (Phase 9.4). Fires server-side;
 *                                 every social-card scrape +
 *                                 every share-preview rebuild
 *                                 bumps this counter.
 *   }
 *
 * Why these six kinds
 *   - `view` is the basic reach signal (does anyone find
 *     the surface?).
 *   - The five `section_*_inspected` kinds answer the
 *     operator's question "which surface section earns
 *     attention?". Lets future editorial passes prioritise.
 *
 * The Phase 9.1 endpoint accepts all six kinds + validates
 * the closed allow-list, but no consumer fires in 9.1 (no
 * /v5/operating route mount yet). Future sub-PR's surface
 * wires the inspection events.
 *
 * Same posture as Phase 8.1 + 8.4 + 8.5:
 *   - Single HASH, atomic HINCRBY per event.
 *   - Graceful no-op when KV is unavailable.
 *   - Fire-and-forget at the call site; errors swallow.
 *
 * Privacy posture: aggregate-only. No per-visitor field.
 * No consent gate (the twin is operator-visibility content;
 * the adoption signal carries no per-visitor data).
 */

export const OPERATING_ADOPTION_HASH_KEY = "v5:operating:adoption";

export const OPERATING_ADOPTION_EVENTS = [
  "view",
  "section_weekly_inspected",
  "section_infra_inspected",
  "section_experiments_inspected",
  "section_planned_inspected",
  "section_failures_inspected",
  "og_rendered",
] as const;

export type OperatingAdoptionEvent =
  (typeof OPERATING_ADOPTION_EVENTS)[number];

const KNOWN_EVENTS: ReadonlySet<OperatingAdoptionEvent> = new Set(
  OPERATING_ADOPTION_EVENTS,
);

export function isOperatingAdoptionEvent(
  value: unknown,
): value is OperatingAdoptionEvent {
  return (
    typeof value === "string" &&
    KNOWN_EVENTS.has(value as OperatingAdoptionEvent)
  );
}

const hasKv = Boolean(
  process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN,
);

/** Increment one operating-adoption counter. Fire-and-forget;
 *  swallows every error path. */
export async function recordOperatingEvent(
  kind: OperatingAdoptionEvent,
): Promise<void> {
  if (!hasKv) return;
  if (!isOperatingAdoptionEvent(kind)) return;
  try {
    await kv.hincrby(OPERATING_ADOPTION_HASH_KEY, kind, 1);
  } catch {
    /* swallow — operating telemetry is decorative */
  }
}

/** Read the entire adoption hash. Returns an empty object on
 *  KV unavailable / hash never written / read error. */
export async function readOperatingAdoption(): Promise<
  Record<string, number>
> {
  if (!hasKv) return {};
  try {
    const stored = await kv.hgetall<Record<string, number | string>>(
      OPERATING_ADOPTION_HASH_KEY,
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
