import type { CognitionSignalBucket } from "@/lib/v5/navigation/cognition";

import {
  PACING_MULTIPLIERS,
  type PacingMultiplier,
  type PacingTier,
} from "./multipliers";

/**
 * V5 Phase 6 Sub-PR 6.3 — cognition → pacing multiplier inference.
 *
 * The single point at which a cognition signal (from Sub-PR 6.2)
 * + reduced-motion preference become a duration multiplier.
 * Pure function, no I/O, no state. Edge-safe.
 *
 * Mapping (V5 future-systems § 1.3 prescription):
 *
 *   reduced-motion = true               → STILL  (0.00)
 *   cognition = arrival                  → FULL   (1.00)
 *   cognition = exploring                → MID    (0.85)
 *   cognition = engaged                  → SNAPPY (0.65)
 *
 * The reduced-motion override is unconditional — even an
 * "engaged" visitor with reduced-motion preference gets STILL.
 * The CSS guard in `app/globals.css` (`@media
 * (prefers-reduced-motion: reduce)`) is what actually collapses
 * the animation to 0.01ms; this multiplier is the engine being
 * honest about its own state for consumers that want to branch
 * on it.
 *
 * Why "arrival" gets FULL and not a faster tier:
 *   The first-visit moment is when the visitor is forming their
 *   impression of the site. V5 § 2.5 explicitly forbids
 *   compressing this moment ("HIZLI hissettiren restraint, yavaş
 *   hissettiren spectacle değil"). FULL timing here is the
 *   cinematic baseline; only after the visitor has demonstrated
 *   commitment to deeper traversal does the engine accelerate.
 */

/** Result of an inference call. Carries both the human-readable
 *  tier name and the numeric multiplier so consumers don't need
 *  to map back. */
export interface PacingInference {
  tier: PacingTier;
  multiplier: PacingMultiplier;
}

const COGNITION_TO_TIER: Record<CognitionSignalBucket, PacingTier> = {
  arrival: "FULL",
  exploring: "MID",
  engaged: "SNAPPY",
};

/**
 * Infer the pacing tier + multiplier from the current cognition
 * signal and the visitor's motion preference.
 *
 * Edge cases:
 *   - prefersReducedMotion === true: always returns STILL,
 *     regardless of cognition.
 *   - Unknown cognition value (defensive — should be impossible
 *     under TS): falls back to FULL. The visitor's first
 *     experience is never compressed below cinematic.
 */
export function inferPacingMultiplier(
  cognition: CognitionSignalBucket,
  prefersReducedMotion: boolean,
): PacingInference {
  if (prefersReducedMotion) {
    return {
      tier: "STILL",
      multiplier: PACING_MULTIPLIERS.STILL,
    };
  }
  const tier = COGNITION_TO_TIER[cognition] ?? "FULL";
  return {
    tier,
    multiplier: PACING_MULTIPLIERS[tier],
  };
}
