import { kv } from "@vercel/kv";

/**
 * V5 Phase 7 Sub-PR 7.3 — timeline engagement counters.
 *
 * V5 § 5.2 telemetry slot: `v5:topology:timeline:engagement_rate`.
 * Following the convention from Phase 6 + Phase 7.1-7.2, the
 * literal long-form slot maps to a 2-segment hash with named
 * fields. The engagement RATE itself is derived downstream as:
 *
 *   engagement_rate = engaged / mounted
 *
 * The hash stores raw counters:
 *
 *   v5:topology:timeline  → hash {
 *     mounted : the slider rendered into the DOM (one per session,
 *               session-deduped via sessionStorage on the client)
 *     engaged : the visitor made their first scrub / seek / play /
 *               keyboard interaction (one per session, session-
 *               deduped)
 *   }
 *
 * Two fields cleanly capture the engagement rate the V5 doc names.
 * `mounted` measures awareness — every render counts. `engaged`
 * measures use — only the first interaction in a session counts,
 * so a heavily-engaged visitor doesn't inflate the rate.
 *
 * Same posture as Phase 6.4 memory adoption + Phase 7.1 temporal
 * adoption + Phase 7.2 playback adoption:
 *   - Single HASH, atomic HINCRBY per event.
 *   - Graceful no-op when KV is unavailable.
 *   - Fire-and-forget from the client side; errors swallow inside
 *     the helper.
 *
 * Privacy posture: aggregate-only. No per-visitor identifier
 * exists on the persisted path. Symmetric with the rest of the
 * temporal layer — public-archive content, no consent gate.
 */

export const TIMELINE_ENGAGEMENT_HASH_KEY = "v5:topology:timeline";

export const TIMELINE_ENGAGEMENT_KINDS = ["mounted", "engaged"] as const;

export type TimelineEngagementKind =
  (typeof TIMELINE_ENGAGEMENT_KINDS)[number];

const KNOWN_KINDS: ReadonlySet<TimelineEngagementKind> = new Set(
  TIMELINE_ENGAGEMENT_KINDS,
);

export function isTimelineEngagementKind(
  value: unknown,
): value is TimelineEngagementKind {
  return (
    typeof value === "string" &&
    KNOWN_KINDS.has(value as TimelineEngagementKind)
  );
}

const hasKv = Boolean(
  process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN,
);

/** Increment one timeline-engagement counter. Fire-and-forget;
 *  the helper is async only because @vercel/kv is. Swallows
 *  every error path. */
export async function recordTimelineEngagement(
  kind: TimelineEngagementKind,
): Promise<void> {
  if (!hasKv) return;
  if (!isTimelineEngagementKind(kind)) return;
  try {
    await kv.hincrby(TIMELINE_ENGAGEMENT_HASH_KEY, kind, 1);
  } catch {
    /* swallow — timeline telemetry is decorative */
  }
}

/** Read the entire engagement hash. Returns an empty object on
 *  KV unavailable / hash never written / read error. Same shape
 *  as the rest of the V5 adoption hashes. */
export async function readTimelineEngagement(): Promise<
  Record<string, number>
> {
  if (!hasKv) return {};
  try {
    const stored = await kv.hgetall<Record<string, number | string>>(
      TIMELINE_ENGAGEMENT_HASH_KEY,
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
 * Derive the engagement rate from a stored snapshot. Returns
 * `null` when `mounted` is zero (no signal yet). Otherwise
 * returns the rate in [0, 1].
 *
 * Mirrors `computeHitRate` over the memory adoption hash —
 * downstream surfaces read raw counters; the rate is computed
 * at read time so the storage shape doesn't drift.
 */
export function computeEngagementRate(
  engagement: Record<string, number>,
): number | null {
  const mounted = Number(engagement.mounted ?? 0);
  const engaged = Number(engagement.engaged ?? 0);
  if (!Number.isFinite(mounted) || mounted <= 0) return null;
  if (!Number.isFinite(engaged) || engaged < 0) return 0;
  /* Cap at 1.0 — the engaged counter cannot legitimately exceed
   * mounted (every engaged session was first mounted), but a
   * stale snapshot might transiently have engaged > mounted if
   * the two writes raced. Capping keeps the displayed rate
   * sensible. */
  return Math.min(engaged / mounted, 1);
}
