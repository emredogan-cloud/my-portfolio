import { kv } from "@vercel/kv";

/**
 * V5 Phase 6 Sub-PR 6.4 — memory adoption counters.
 *
 * V5 § 5.1 telemetry slot: `v5:memory:adoption:hit_rate`. The
 * underlying KV shape is a single hash with four fields:
 *
 *   hit      → loadSession returned a stored thread
 *   miss     → loadSession was called but found nothing
 *   store    → saveSession wrote a thread successfully
 *   opt-out  → loadSession / saveSession skipped because the
 *              visitor has memory opt-out enabled
 *
 * The hit-rate is computed downstream as `hit / (hit + miss)`.
 * Store + opt-out are diagnostic — together with hit + miss
 * they fully describe what the memory layer is doing.
 *
 * Same posture as Phase 4.3's per-tool counter + Phase 5.4's
 * playground funnel:
 *   - Single HASH per metric class, one HINCRBY per event.
 *   - Graceful no-op when KV is unavailable.
 *   - Fire-and-forget at the call site; errors swallow inside
 *     the helper.
 *
 * Privacy posture:
 *   - Aggregate-only. Counters by event kind, nothing per-
 *     session, no IP, no session-id field.
 *   - The session-id passed to loadSession/saveSession is
 *     NEVER recorded — the helper signature is
 *     `recordMemoryEvent(kind)`, full stop.
 */

export const MEMORY_ADOPTION_HASH_KEY = "v5:memory:adoption";

export type MemoryEventKind = "hit" | "miss" | "store" | "opt-out";

const KNOWN_KINDS: ReadonlySet<MemoryEventKind> = new Set([
  "hit",
  "miss",
  "store",
  "opt-out",
]);

const hasKv = Boolean(
  process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN,
);

/** Increment one memory-adoption counter. Fire-and-forget; the
 *  helper is async only because @vercel/kv is. Swallows every
 *  error path. */
export async function recordMemoryEvent(
  kind: MemoryEventKind,
): Promise<void> {
  if (!hasKv) return;
  if (!KNOWN_KINDS.has(kind)) return;
  try {
    await kv.hincrby(MEMORY_ADOPTION_HASH_KEY, kind, 1);
  } catch {
    /* swallow — memory telemetry is decorative */
  }
}

/** Read the entire adoption hash. Returns an empty object on
 *  KV unavailable / hash never written / read error. */
export async function readMemoryAdoption(): Promise<
  Record<string, number>
> {
  if (!hasKv) return {};
  try {
    const stored = await kv.hgetall<Record<string, number | string>>(
      MEMORY_ADOPTION_HASH_KEY,
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

/**
 * Compute the hit-rate from an adoption snapshot. Returns
 * `null` when there are no hits and no misses (no signal yet).
 * Otherwise returns the rate as a number in [0, 1].
 */
export function computeHitRate(
  adoption: Record<string, number>,
): number | null {
  const hits = Number(adoption.hit ?? 0);
  const misses = Number(adoption.miss ?? 0);
  const total = hits + misses;
  if (!Number.isFinite(total) || total <= 0) return null;
  return hits / total;
}
