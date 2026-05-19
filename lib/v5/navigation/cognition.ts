/**
 * V5 Phase 6 Sub-PR 6.2 — cognition state taxonomy + inference.
 *
 * The cognition layer sits one level above the perception layer
 * (Sub-PR 6.1). Where perception records *what was observed* in
 * aggregate buckets, cognition records *what shape of attention*
 * the observed pattern implies. The states are deliberately few
 * and qualitative — V5 § 4.1 forbids per-visitor profiling, so
 * the taxonomy must work as ambient context rather than identity.
 *
 * The state is inferred client-side from session-scoped signals
 * (sessionStorage page counter for now; later sub-PRs may add
 * scroll velocity and dwell time as inputs). It is recorded as
 * a perception event in the `cognition-signal` category and
 * surfaces nowhere in the UI — Phase 6.2 ships zero consumers,
 * per the spec's "no user-visible behavior change" mandate.
 *
 * Why three states (arrival / exploring / engaged):
 *   - Three is the minimum useful granularity. Two collapses to
 *     "new vs returning"; four invites bikeshedding without
 *     adding decision value.
 *   - The transitions between states are monotone in the current
 *     inference logic (page counter only ascends), which keeps
 *     the model honest about its limits. A visitor never
 *     "regresses" from engaged back to exploring — they just
 *     stay engaged for the rest of the session.
 *   - More signals (scroll-velocity buckets, tab-visibility
 *     buckets) can refine the inference in later sub-PRs without
 *     changing the bucket set itself.
 *
 * Edge-safety: pure data + pure functions. No DOM access, no
 * module-scope side effects. Safe to load from any runtime.
 */

/**
 * The closed allow-list of cognition signal buckets.
 *
 *   arrival   — the visitor has just landed; this is their first
 *               navigation event in the session.
 *   exploring — the visitor has visited 2-4 routes; an active
 *               browsing pattern is forming.
 *   engaged   — 5+ routes visited; the visitor has committed to
 *               a deeper traversal of the site.
 *
 * Order matters here: the buckets are linearly progressive in
 * page count, and the order is preserved for UI consumers that
 * may want to render the current state alongside its progression.
 */
export const COGNITION_SIGNAL_BUCKETS = [
  "arrival",
  "exploring",
  "engaged",
] as const;

export type CognitionSignalBucket =
  (typeof COGNITION_SIGNAL_BUCKETS)[number];

/** sessionStorage key for the navigation observer's page counter.
 *  Per-tab, drops on tab close. The cognition state is derived from
 *  this counter — the counter itself is never persisted to KV. */
export const SESSION_PAGE_COUNTER_STORAGE_KEY =
  "v5:perception:navigation:page-count";

/**
 * Infer the cognition signal from a session-scoped page counter.
 *
 * The thresholds are tuned for a single visitor session:
 *   counter === 1            → arrival
 *   counter ∈ [2, 4]         → exploring
 *   counter >= 5             → engaged
 *
 * Edge cases:
 *   - counter < 1, non-finite, or NaN: treated as arrival. The
 *     observer guards against persistent-state corruption by
 *     defaulting to the safest state.
 */
export function inferCognitionSignal(
  pageCounter: number,
): CognitionSignalBucket {
  if (!Number.isFinite(pageCounter) || pageCounter < 2) return "arrival";
  if (pageCounter < 5) return "exploring";
  return "engaged";
}

/** Type guard for the bucket allow-list. Mirrors the pattern used
 *  in `lib/v5/perception/buckets.ts` for `isPerceptionCategory`. */
export function isCognitionSignalBucket(
  value: unknown,
): value is CognitionSignalBucket {
  return (
    typeof value === "string" &&
    (COGNITION_SIGNAL_BUCKETS as readonly string[]).includes(value)
  );
}
