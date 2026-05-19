import { kv } from "@vercel/kv";

import { type PlaybackEventKind, isPlaybackEventKind } from "./playback";

/**
 * V5 Phase 7 Sub-PR 7.2 — playback adoption counters.
 *
 * V5 § 5.2 telemetry slot: `v5:topology:playback:scrub_events_weekly`.
 * Following the convention established in Phase 6 (where the
 * literal V5 doc slot maps to a 2-segment hash for endpoint
 * reuse), the implementation lives at:
 *
 *   v5:topology:playback  → hash {
 *     seek   : seek() / seekToIndex() fired
 *     scrub  : scrubTo() fired
 *     play   : play() entered the playing state
 *     pause  : pause() or end-of-timeline fired
 *     step   : nextFrame() / prevFrame() fired
 *   }
 *
 * The "weekly" qualifier in the V5 slot name is left to the
 * future read pass — the raw counters here are cumulative; a
 * future surface that wants a windowed rate (e.g. an operations
 * dashboard tile showing scrub events in the last 7 days)
 * captures a snapshot pair and diffs them. The Phase 7
 * foundation keeps the writer simple.
 *
 * Same posture as the other V5 adoption hashes (Phase 6.4 memory,
 * Phase 7.1 temporal-adoption):
 *   - Single HASH, atomic HINCRBY per event.
 *   - Graceful no-op when KV is unavailable.
 *   - Fire-and-forget at the call site; errors swallow inside
 *     the helper.
 *
 * Privacy posture
 *   - Aggregate-only. Counters by event kind, never per-visitor.
 *   - No identifier field exists in the persisted hash.
 *   - The Phase 7.2 controller emits events via the
 *     `onTelemetry` callback the consumer wires; this module is
 *     the destination the eventual endpoint POSTs to.
 *
 * Privacy contract symmetric with the Phase 7.1 temporal
 * adoption hash: temporal data is public-archive content, and
 * the playback counters never carry any visitor-identifying
 * signal.
 */

export const PLAYBACK_ADOPTION_HASH_KEY = "v5:topology:playback";

const hasKv = Boolean(
  process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN,
);

/** Increment one playback-adoption counter. Fire-and-forget;
 *  the helper is async only because @vercel/kv is. Swallows
 *  every error path. */
export async function recordPlaybackEvent(
  kind: PlaybackEventKind,
): Promise<void> {
  if (!hasKv) return;
  if (!isPlaybackEventKind(kind)) return;
  try {
    await kv.hincrby(PLAYBACK_ADOPTION_HASH_KEY, kind, 1);
  } catch {
    /* swallow — playback telemetry is decorative */
  }
}

/** Read the entire adoption hash. Returns an empty object on
 *  KV unavailable / hash never written / read error. Same shape
 *  as `readMemoryAdoption` and `readTemporalAdoption`. */
export async function readPlaybackAdoption(): Promise<
  Record<string, number>
> {
  if (!hasKv) return {};
  try {
    const stored = await kv.hgetall<Record<string, number | string>>(
      PLAYBACK_ADOPTION_HASH_KEY,
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
