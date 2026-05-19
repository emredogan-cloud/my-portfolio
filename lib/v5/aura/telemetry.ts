import { kv } from "@vercel/kv";

/**
 * V5 Phase 8 Sub-PR 8.4 — aura adoption counters.
 *
 * V5 § 5.3 8.3 doesn't list an explicit telemetry slot, but
 * consistency with every other Phase 6-8 system says one
 * should exist. Single hash, four event kinds:
 *
 *   v5:aura:adoption  → hash {
 *     mounted          : AuraProvider rendered (once per
 *                        session per slug via client-side
 *                        sessionStorage dedupe)
 *     temperature_warm : composed aura's temperature > 0.6
 *                        (the slot tracks "how often does the
 *                        observer land on warm surfaces")
 *     temperature_cool : composed aura's temperature < 0.4
 *     time_modulation_applied : the time-of-day delta moved
 *                               at least one axis by ≥ 0.05
 *   }
 *
 * Why these four kinds
 *   - `mounted` is the basic reach signal.
 *   - The two temperature buckets surface a "warm vs cool"
 *     distribution operator-side; helps validate that the
 *     editorial aura assignments cover both ends of the axis.
 *   - `time_modulation_applied` answers "does the
 *     time-of-day modulation actually trigger?" — the
 *     modulation only fires outside 12-18, so it should be
 *     dominant for non-afternoon visitors.
 *
 * Same posture as every other V5 adoption hash:
 *   - Single HASH, atomic HINCRBY per event.
 *   - Graceful no-op when KV is unavailable.
 *   - Fire-and-forget at the call site; errors swallow.
 *
 * Privacy posture: aggregate-only. No identifier on the
 * persisted path. No consent gate (the aura is server-derived
 * + time-of-day-derived; no per-visitor signal contributes).
 */

export const AURA_ADOPTION_HASH_KEY = "v5:aura:adoption";

export const AURA_ADOPTION_EVENTS = [
  "mounted",
  "temperature_warm",
  "temperature_cool",
  "time_modulation_applied",
] as const;

export type AuraAdoptionEvent = (typeof AURA_ADOPTION_EVENTS)[number];

const KNOWN_EVENTS: ReadonlySet<AuraAdoptionEvent> = new Set(
  AURA_ADOPTION_EVENTS,
);

export function isAuraAdoptionEvent(
  value: unknown,
): value is AuraAdoptionEvent {
  return (
    typeof value === "string" &&
    KNOWN_EVENTS.has(value as AuraAdoptionEvent)
  );
}

const hasKv = Boolean(
  process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN,
);

/** Increment one aura-adoption counter. Fire-and-forget;
 *  swallows every error path. */
export async function recordAuraEvent(
  kind: AuraAdoptionEvent,
): Promise<void> {
  if (!hasKv) return;
  if (!isAuraAdoptionEvent(kind)) return;
  try {
    await kv.hincrby(AURA_ADOPTION_HASH_KEY, kind, 1);
  } catch {
    /* swallow — aura telemetry is decorative */
  }
}

/** Read the entire adoption hash. Returns an empty object on
 *  KV unavailable / hash never written / read error. */
export async function readAuraAdoption(): Promise<
  Record<string, number>
> {
  if (!hasKv) return {};
  try {
    const stored = await kv.hgetall<Record<string, number | string>>(
      AURA_ADOPTION_HASH_KEY,
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
