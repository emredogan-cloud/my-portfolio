/**
 * V5 Phase 6 Sub-PR 6.1 — perception signal taxonomy + bucketization.
 *
 * The perception layer is the foundation Phase 6 builds on (V5
 * § 4.1). The contract this module ships:
 *
 *   1. A closed allow-list of signal CATEGORIES. Anything not listed
 *      here is rejected at the endpoint — visitors cannot invent
 *      arbitrary perception axes.
 *   2. A bucketization function per category that maps a raw client-
 *      side measurement (scroll velocity in px/s, dwell time in ms,
 *      section name) onto a SHORT-list label. Aggregate counts live
 *      at bucket granularity; raw values are never persisted.
 *   3. A closed allow-list of valid bucket labels per category. The
 *      endpoint validates inbound `bucket` strings against this list
 *      — an unrecognised bucket is dropped.
 *
 * Why this lives outside `lib/telemetry/metrics.ts`:
 *   Perception telemetry is a Phase-6+ surface with its own privacy
 *   posture (opt-in, aggregate-only, consent-gated). Keeping the
 *   schema in its own module makes the rollback story clean — Phase
 *   6 can be ripped out by deleting `lib/v5/` without touching the
 *   V4 telemetry contract.
 *
 * What this module is NOT:
 *   - It is NOT an observer. No DOM access, no `window` reads, no
 *     setInterval, no IntersectionObserver, no scroll listener.
 *     Observers land in Sub-PR 6.2+. This module is pure data.
 *   - It is NOT a recorder. KV writes happen in
 *     `lib/v5/perception/telemetry.ts`. This module is upstream
 *     of any I/O.
 *
 * Edge-safety: pure functions, no module-scope side effects, no
 * imports beyond TypeScript types. Safe to load from either runtime.
 */

/**
 * The closed allow-list of perception signal categories.
 *
 * Each entry is a single ambient dimension the layer aggregates.
 * The categories are deliberately coarse — the V5 doc's "ambient
 * context only" stance forbids anything that approaches identity
 * reconstruction.
 *
 *   scroll-velocity     → how fast did the visitor scroll?
 *   dwell-time          → how long did they stay on a page?
 *   section-engagement  → which on-page section drew attention?
 *   tab-visibility      → how long was the tab backgrounded?
 *   navigation-flow     → which page-to-page transition fired?
 *   cognition-signal    → which inferred attention state (arrival /
 *                         exploring / engaged) the session is in
 *                         at the moment of recording. Added in
 *                         Sub-PR 6.2 as the navigation observer's
 *                         primary output. Maps to V5 § 5.1's
 *                         `v5:perception:navigation:cognition_signals`
 *                         telemetry slot.
 *   pacing-transition   → how many navigations the session reached
 *                         before backgrounding (first / few / many /
 *                         deep). Added in Sub-PR 6.3 as the
 *                         cinematic pacing engine's session-end
 *                         signal. Maps to V5 § 5.1's
 *                         `v5:pacing:transitions_per_session`
 *                         telemetry slot.
 *   adoption            → opt-in / revoke / deny events for the
 *                         perception layer itself (the only events
 *                         allowed to fire without prior consent —
 *                         they ARE the consent decision)
 */
export const PERCEPTION_CATEGORIES = [
  "scroll-velocity",
  "dwell-time",
  "section-engagement",
  "tab-visibility",
  "navigation-flow",
  "cognition-signal",
  "pacing-transition",
  "adoption",
] as const;

export type PerceptionCategory = (typeof PERCEPTION_CATEGORIES)[number];

const CATEGORY_SET: ReadonlySet<string> = new Set(PERCEPTION_CATEGORIES);

/** Return true when `value` is a registered category. Used at the
 *  endpoint to validate the inbound `category` field. */
export function isPerceptionCategory(
  value: unknown,
): value is PerceptionCategory {
  return typeof value === "string" && CATEGORY_SET.has(value);
}

/* ── Bucket allow-lists ────────────────────────────────────────
 *
 * Each category has a closed set of bucket labels. The endpoint
 * MUST reject any bucket value not present in the category's set.
 * Aggregate counts only ever land in these slots; the V5 § 4.1
 * "aggregate-only, no fingerprint" guarantee is enforced here.
 *
 * The allow-lists are intentionally short — the perception layer
 * is ambient context, not behavioural analytics. If a future
 * sub-PR needs finer granularity, the doc demands a new round of
 * privacy review BEFORE the bucket list grows.
 */

/** scroll-velocity buckets. Derived from average px/s over a
 *  1-second window. The "idle" bucket also covers the case where
 *  the visitor isn't scrolling at all. */
export const SCROLL_VELOCITY_BUCKETS = [
  "idle", // 0-50 px/s
  "browsing", // 50-300 px/s
  "scanning", // 300-1200 px/s
  "skimming", // 1200+ px/s
] as const;
export type ScrollVelocityBucket =
  (typeof SCROLL_VELOCITY_BUCKETS)[number];

/** dwell-time buckets in seconds. The granularity widens as time
 *  passes — a visitor's 12-second vs 14-second dwell is meaningless;
 *  their 12-second vs 4-minute dwell is. */
export const DWELL_TIME_BUCKETS = [
  "0-10s",
  "10-30s",
  "30-60s",
  "60-180s",
  "180-600s",
  "600s+",
] as const;
export type DwellTimeBucket = (typeof DWELL_TIME_BUCKETS)[number];

/** tab-visibility buckets. Records how long a tab spent in the
 *  background between focus events. "short" covers the natural
 *  "alt-tab to check something" pattern. */
export const TAB_VISIBILITY_BUCKETS = ["short", "medium", "long"] as const;
export type TabVisibilityBucket = (typeof TAB_VISIBILITY_BUCKETS)[number];

/** adoption buckets. The three states the consent decision can
 *  take. Recorded WITHOUT consent because the visitor's act of
 *  toggling the perception layer IS the consent signal. */
export const ADOPTION_BUCKETS = [
  "opt_in_granted",
  "opt_in_revoked",
  "opt_in_denied",
] as const;
export type AdoptionBucket = (typeof ADOPTION_BUCKETS)[number];

/** cognition-signal buckets. Re-exported from
 *  `lib/v5/navigation/cognition.ts` so the perception endpoint's
 *  bucket validation has a single import surface, while the
 *  navigation observer can import the same constant for its own
 *  inference logic. Added in Sub-PR 6.2. */
export {
  COGNITION_SIGNAL_BUCKETS,
  type CognitionSignalBucket,
} from "@/lib/v5/navigation/cognition";
import { COGNITION_SIGNAL_BUCKETS as COG_BUCKETS } from "@/lib/v5/navigation/cognition";

/** pacing-transition buckets. Re-exported from
 *  `lib/v5/pacing/telemetry.ts` for the same single-import-
 *  surface reason. Added in Sub-PR 6.3. */
export {
  PACING_TRANSITION_BUCKETS,
  type PacingTransitionBucket,
} from "@/lib/v5/pacing/telemetry";
import { PACING_TRANSITION_BUCKETS as PACING_BUCKETS } from "@/lib/v5/pacing/telemetry";

/* section-engagement + navigation-flow buckets are dynamic — the
 * label is the section / path slug itself. The endpoint validates
 * these against a syntactic shape (kebab-case, max length) instead
 * of a closed list, since enumerating every section / page in the
 * portfolio would be brittle. The shape check is in
 * `isValidDynamicBucket` below. */

const DYNAMIC_BUCKET_PATTERN = /^[a-z0-9][a-z0-9-]{0,40}(>[a-z0-9-]{1,40})?$/;

/** Validate a section / navigation-flow bucket. Pattern: kebab-case
 *  ASCII, max 41 chars, optionally a single `>` separator (for
 *  `from>to` navigation flow). Reject anything else — query strings,
 *  whitespace, control chars, IDs, etc. */
export function isValidDynamicBucket(value: unknown): value is string {
  return (
    typeof value === "string" &&
    value.length > 0 &&
    value.length <= 83 && // 41 + 1 + 41
    DYNAMIC_BUCKET_PATTERN.test(value)
  );
}

/** Validate an inbound `bucket` value for a given category. */
export function isValidBucket(
  category: PerceptionCategory,
  value: unknown,
): boolean {
  if (typeof value !== "string" || !value) return false;
  switch (category) {
    case "scroll-velocity":
      return (SCROLL_VELOCITY_BUCKETS as readonly string[]).includes(value);
    case "dwell-time":
      return (DWELL_TIME_BUCKETS as readonly string[]).includes(value);
    case "tab-visibility":
      return (TAB_VISIBILITY_BUCKETS as readonly string[]).includes(value);
    case "adoption":
      return (ADOPTION_BUCKETS as readonly string[]).includes(value);
    case "cognition-signal":
      return (COG_BUCKETS as readonly string[]).includes(value);
    case "pacing-transition":
      return (PACING_BUCKETS as readonly string[]).includes(value);
    case "section-engagement":
    case "navigation-flow":
      return isValidDynamicBucket(value);
  }
}

/* ── Bucketization (raw measurement → label) ───────────────────
 *
 * These helpers are exported for Sub-PR 6.2+ observers, which will
 * read raw client-side measurements and forward the bucketed label
 * to the endpoint. The endpoint itself does NOT call these — it
 * accepts pre-bucketed labels, since accepting raw px/s or ms
 * values would invite identity reconstruction via timing.
 */

/** Bucket a scroll velocity in CSS px/s. Negative inputs and
 *  non-finite values map to "idle". */
export function bucketScrollVelocity(pxPerSec: number): ScrollVelocityBucket {
  if (!Number.isFinite(pxPerSec) || pxPerSec < 50) return "idle";
  if (pxPerSec < 300) return "browsing";
  if (pxPerSec < 1200) return "scanning";
  return "skimming";
}

/** Bucket a dwell time in milliseconds. Negative inputs and
 *  non-finite values map to "0-10s". */
export function bucketDwellTime(ms: number): DwellTimeBucket {
  if (!Number.isFinite(ms) || ms < 10_000) return "0-10s";
  if (ms < 30_000) return "10-30s";
  if (ms < 60_000) return "30-60s";
  if (ms < 180_000) return "60-180s";
  if (ms < 600_000) return "180-600s";
  return "600s+";
}

/** Bucket a tab-background duration in milliseconds. */
export function bucketTabVisibility(ms: number): TabVisibilityBucket {
  if (!Number.isFinite(ms) || ms < 10_000) return "short";
  if (ms < 60_000) return "medium";
  return "long";
}
