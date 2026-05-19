/**
 * V5 Phase 6 Sub-PR 6.3 — pacing multiplier constants + ease curve.
 *
 * The cinematic pacing engine (V5 § 2.5) modulates animation
 * durations by a scalar in [0, 1]. The visitor's cognition state
 * (from Sub-PR 6.2) decides which multiplier applies; the
 * reduced-motion preference overrides everything to 0.
 *
 * Why scalars instead of a spring system:
 *   V5 § 2.5 explicitly bans spring physics (carried over from
 *   V4 § 2.12). The pacing law is duration discipline + ease-out
 *   curve, full stop. This module's TYPE SIGNATURE makes spring
 *   physics impossible to introduce — there is no `damping`,
 *   no `stiffness`, no `mass`, no `velocity` field anywhere.
 *   Adding spring behavior would require rewriting the module,
 *   which itself is the rollback boundary the V5 doc demands.
 *
 * Why four tiers and not a continuous range:
 *   Continuous multipliers invite per-visitor flicker — a 0.83
 *   vs 0.84 difference is invisible noise but a 0.85 vs 1.0
 *   difference is a real perceptual shift. Four discrete tiers
 *   give the engine a small, audit-able state space.
 *
 * Edge-safety: pure constants + pure helpers. No DOM, no
 * `process.env`, no module-scope side effects.
 */

/**
 * The four pacing tiers, named for the cognition state they
 * correspond to. The numeric value is the duration multiplier
 * applied to any animation that reads from `usePacing()`.
 *
 *   FULL    — 1.00, cinematic baseline. First-visit + reading.
 *   MID     — 0.85, mild compression. Mid-session browsing.
 *   SNAPPY  — 0.65, perceptible acceleration. Engaged depth.
 *   STILL   — 0.00, no motion. Reduced-motion override.
 */
export const PACING_MULTIPLIERS = {
  FULL: 1.0,
  MID: 0.85,
  SNAPPY: 0.65,
  STILL: 0.0,
} as const;

export type PacingTier = keyof typeof PACING_MULTIPLIERS;
export type PacingMultiplier =
  (typeof PACING_MULTIPLIERS)[PacingTier];

/**
 * Ease-out cubic-bezier the V5 pacing law mandates. Matches the
 * existing portfolio convention in `components/ui/Reveal.tsx`
 * (which uses `[0.22, 1, 0.36, 1]` directly today) so future
 * consumers that opt into `usePacing()` continue to feel native
 * to the cinematic identity rather than introducing a new
 * easing footprint.
 */
export const EASE_OUT_CURVE = [0.22, 1, 0.36, 1] as const;

/**
 * Apply a pacing multiplier to a base duration in milliseconds.
 * Returns an integer ms count, rounded to avoid fractional
 * frame budgets that motion / CSS can't honour anyway.
 *
 * Edge cases:
 *   - non-finite base: returns 0
 *   - negative base: clamped to 0
 *   - multiplier === 0 (STILL): returns 0 (motion suppressed)
 *
 * The function is intentionally synchronous and pure — consumers
 * can call it in render bodies without an effect wrapper.
 */
export function pacedDuration(
  baseMs: number,
  multiplier: PacingMultiplier,
): number {
  if (!Number.isFinite(baseMs) || baseMs <= 0) return 0;
  if (multiplier === PACING_MULTIPLIERS.STILL) return 0;
  return Math.round(baseMs * multiplier);
}

/**
 * Apply a pacing multiplier to a base duration expressed in
 * SECONDS (the unit `motion`'s `transition.duration` expects).
 * Same posture as `pacedDuration` but preserves fractional
 * precision the motion runtime can interpolate cleanly.
 */
export function pacedSeconds(
  baseSeconds: number,
  multiplier: PacingMultiplier,
): number {
  if (!Number.isFinite(baseSeconds) || baseSeconds <= 0) return 0;
  if (multiplier === PACING_MULTIPLIERS.STILL) return 0;
  /* Round to two decimal places — sub-10ms differences aren't
   * perceptible and reduce per-render reflow churn. */
  return Math.round(baseSeconds * multiplier * 100) / 100;
}
