/**
 * V5 Phase 6 Sub-PR 6.3 — pacing transitions-per-session
 * bucketer + session-fire helper.
 *
 * V5 § 5.1's stated telemetry slot is
 * `v5:pacing:transitions_per_session`. The literal V5 § 2.13
 * pattern (`v5:pacing:<surface>:<metric>:<bucket>`) would imply
 * a separate top-level surface from `v5:perception:*`, but
 * doing so would fork the existing perception machinery
 * (endpoint, validation, consent gate). Instead, this sub-PR
 * extends the 6.1 perception schema with a new category
 * `pacing-transition` whose hash key is
 * `v5:perception:pacing-transition` — same record / read
 * pipeline, same consent gate, same rollback path. The mapping
 * is documented on the public transparency page.
 *
 * The bucket the observer fires on visibility:hidden:
 *
 *   first  — 1 navigation in the session (visitor leaves early)
 *   few    — 2-4 navigations
 *   many   — 5-9 navigations
 *   deep   — 10+ navigations
 *
 * Four buckets, matching the cognition taxonomy's three-tier
 * progression plus one extra slot to distinguish "deep" sessions
 * from merely "engaged" ones — useful for the cinematic
 * topology phases that will tune surfaces to the deep-visitor
 * cohort.
 *
 * sessionStorage key for the once-per-session dedupe of the
 * visibility:hidden fire. The Provider sets this on first fire;
 * subsequent visibility events check the flag and silently
 * skip. The flag drops on tab close along with the rest of
 * sessionStorage.
 *
 * Edge-safety: pure constants + pure functions. No DOM, no
 * `process.env`.
 */

/** The closed allow-list of pacing-transition buckets. */
export const PACING_TRANSITION_BUCKETS = [
  "first",
  "few",
  "many",
  "deep",
] as const;

export type PacingTransitionBucket =
  (typeof PACING_TRANSITION_BUCKETS)[number];

/** Session-storage flag for the once-per-session dedupe.
 *  Storing the literal "fired" sentinel; presence-of-flag is
 *  the dedupe signal. */
export const PACING_TRANSITION_FIRED_STORAGE_KEY =
  "v5:pacing:transitions-per-session:fired";

/**
 * Map a per-session navigation count onto a transitions-per-
 * session bucket. The thresholds mirror the cognition signal
 * taxonomy's progression so the two telemetry surfaces line
 * up at the boundaries:
 *
 *   count === 1            → first   (matches cognition "arrival")
 *   count ∈ [2, 4]         → few     (matches cognition "exploring")
 *   count ∈ [5, 9]         → many    (matches cognition "engaged"
 *                                    early phase)
 *   count >= 10            → deep    (matches cognition "engaged"
 *                                    late phase)
 *
 * Edge cases:
 *   - non-finite count, count < 1, NaN: returns "first". The
 *     visitor has at minimum reached the page that fires the
 *     observer, so 1 is the floor.
 */
export function bucketTransitionsPerSession(
  count: number,
): PacingTransitionBucket {
  if (!Number.isFinite(count) || count < 2) return "first";
  if (count < 5) return "few";
  if (count < 10) return "many";
  return "deep";
}

/** Type guard for the bucket allow-list. */
export function isPacingTransitionBucket(
  value: unknown,
): value is PacingTransitionBucket {
  return (
    typeof value === "string" &&
    (PACING_TRANSITION_BUCKETS as readonly string[]).includes(value)
  );
}
