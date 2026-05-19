/**
 * V5 Phase 6 Sub-PR 6.4 — configurable memory TTL.
 *
 * V4's `lib/lumina/memory.ts` hard-coded a 14-day TTL. Sub-PR
 * 6.4 makes the TTL operator-configurable in a 14-30 day range
 * via the env var `V5_MEMORY_TTL_DAYS`, with 14 as the default
 * (preserves V4 behavior when the env is unset).
 *
 * Why an env var and not a per-visitor preference:
 *   - Operator-level control matches the existing
 *     `V5_PERCEPTION_ENABLED` master-switch pattern from 6.1.
 *   - Visitor-level memory control is already binary (opt-out
 *     via the Lumina chat header). Exposing a duration slider
 *     to visitors would add a privacy axis the operator can
 *     better calibrate from aggregate adoption telemetry.
 *   - Env-driven means the change is a deploy event, not a
 *     runtime decision — predictable failure mode.
 *
 * Why 14-30 days as the range:
 *   - Lower bound = V4's existing default. Going below would
 *     regress visitors with active sessions.
 *   - Upper bound = 30 days. The V5 doc § 4.1 mentions
 *     "extended TTL"; 30 is the longest reasonable window
 *     before storage cost or stale-context concerns dominate.
 *   - Out-of-range values clamp to the nearest bound rather
 *     than error — degrades gracefully on operator typos.
 *
 * Edge-safety: pure read from `process.env`. No DOM, no I/O.
 */

/** Env var the operator sets to override the default TTL.
 *  Acceptable values: any integer in the 14-30 range.
 *  Out-of-range or non-numeric values clamp to defaults. */
export const V5_MEMORY_TTL_DAYS_ENV = "V5_MEMORY_TTL_DAYS";

/** Minimum allowed TTL in days. Below this == regression vs V4. */
export const MIN_TTL_DAYS = 14;

/** Maximum allowed TTL in days. Above this == defer to a future
 *  doc-amendment that justifies the storage cost shift. */
export const MAX_TTL_DAYS = 30;

/** Default TTL in days. Matches V4 exactly so the platform's
 *  default behavior is unchanged when the env is unset. */
export const DEFAULT_TTL_DAYS = 14;

/**
 * Resolve the configured TTL in DAYS. Reads the env, parses to
 * an integer, clamps to [MIN_TTL_DAYS, MAX_TTL_DAYS], or returns
 * `DEFAULT_TTL_DAYS` when the env is unset / invalid.
 *
 * Pure: no I/O beyond `process.env`. Safe to call from any
 * runtime (edge, node, build-time).
 */
export function resolveTtlDays(): number {
  const raw = process.env[V5_MEMORY_TTL_DAYS_ENV];
  if (typeof raw !== "string" || !raw) return DEFAULT_TTL_DAYS;
  const parsed = Number(raw);
  if (!Number.isFinite(parsed) || !Number.isInteger(parsed)) {
    return DEFAULT_TTL_DAYS;
  }
  if (parsed < MIN_TTL_DAYS) return MIN_TTL_DAYS;
  if (parsed > MAX_TTL_DAYS) return MAX_TTL_DAYS;
  return parsed;
}

/** Resolve the configured TTL in SECONDS, the unit @vercel/kv's
 *  `ex` option expects. Convenience wrapper around
 *  `resolveTtlDays()`. */
export function resolveTtlSeconds(): number {
  return resolveTtlDays() * 24 * 60 * 60;
}
