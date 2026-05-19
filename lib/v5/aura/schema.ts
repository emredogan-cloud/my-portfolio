/**
 * V5 Phase 8 Sub-PR 8.4 — engineering aura schema.
 *
 * V5 future § 9.1 specifies that each page in the ecosystem
 * carries an "aura" expressed as 4 compressed perceptual
 * parameters. The user's Phase 8 brief frames this as the
 * subtle perceptual layer — visitors don't see it, they feel
 * it. The schema below names the four axes deliberately:
 *
 *   temperature  — cool (cyan / blue) ↔ warm (amber). The
 *                  dominant atmospheric hue. Maps from 0
 *                  (deepest cyan) to 1 (warmest amber); 0.5
 *                  is the cinematic neutral.
 *   intensity    — how PRESENT the aura is. 0 = barely a
 *                  hint, 1 = pronounced ambient wash. Maps to
 *                  the strength of the ambient gradient + the
 *                  prominence of accent colors.
 *   pace         — still ↔ active. Modulates animation
 *                  duration multipliers + transition timing.
 *                  Analogous to the Phase 6.3 pacing engine's
 *                  multiplier; aura.pace and the cinematic
 *                  pacing engine are distinct dimensions that
 *                  can be composed by future consumers.
 *   clarity      — diffuse ↔ precise. Modulates the focal
 *                  sharpness of ambient gradients (blur
 *                  radius), edge weights, label contrast.
 *
 * All four parameters live in [0, 1]. The schema does not
 * permit values outside this range; validators clamp on
 * input. A "neutral" aura is { 0.5, 0.5, 0.5, 0.5 } — the
 * cinematic baseline the existing portfolio identity already
 * occupies.
 *
 * What this module is NOT
 *   - It is NOT a renderer. The CSS-variable mapping
 *     (`./css.ts`) is the bridge between schema values + the
 *     existing identity surfaces.
 *   - It is NOT a theme switcher. The visitor cannot toggle
 *     the aura; it is compositional, computed per page +
 *     time + cognition signal.
 *   - It is NOT a registry of visual STATES. Aura is a
 *     parameter shape, not a palette enum. A future renderer
 *     could interpolate between auras smoothly — the schema
 *     supports continuous values, not just named presets.
 *
 * Phase 8 cognition note
 *   The 4-parameter compression is the load-bearing decision.
 *   A larger schema (8 parameters, 12 parameters, a full
 *   theme object) would invite designers to tweak each axis
 *   independently — death by a thousand levers. Four
 *   parameters force COMPOSITION: a "calm + warm" aura sets
 *   temperature high + pace low + intensity low + clarity
 *   medium. Each named feeling decomposes into the same four
 *   axes.
 *
 * Edge-safety: pure data + pure functions. No DOM, no I/O.
 */

/** A single point in the aura's 4-dimensional parameter
 *  space. Every page in the registry maps to one of these
 *  values; modulation functions return additive deltas
 *  (a `Partial<AuraParameters>` shape with signed values).
 *  The composer applies modulations + clamps to [0, 1]. */
export interface AuraParameters {
  /** 0 = coolest cyan, 0.5 = neutral, 1 = warmest amber. */
  temperature: number;
  /** 0 = barely present, 1 = pronounced. */
  intensity: number;
  /** 0 = still, 1 = active motion. */
  pace: number;
  /** 0 = diffuse haze, 1 = precise focus. */
  clarity: number;
}

/** A signed delta on each axis. Modulation functions return
 *  these; the composer sums them into a baseline. Any axis
 *  missing from the delta is treated as zero (no modulation
 *  on that dimension). */
export type AuraModulation = Partial<AuraParameters>;

/** The neutral cinematic baseline — every axis at 0.5. The
 *  composer returns this when no page-specific aura is
 *  registered for the current route. */
export const NEUTRAL_AURA: AuraParameters = {
  temperature: 0.5,
  intensity: 0.5,
  pace: 0.5,
  clarity: 0.5,
};

/** True when `value` is a finite number in [0, 1]. */
export function isUnit(value: unknown): value is number {
  return (
    typeof value === "number" &&
    Number.isFinite(value) &&
    value >= 0 &&
    value <= 1
  );
}

/** True when `value` is a well-formed AuraParameters. */
export function isAuraParameters(
  value: unknown,
): value is AuraParameters {
  if (value === null || typeof value !== "object") return false;
  const p = value as Partial<AuraParameters>;
  return (
    isUnit(p.temperature) &&
    isUnit(p.intensity) &&
    isUnit(p.pace) &&
    isUnit(p.clarity)
  );
}

/** Clamp a single value to [0, 1]. Non-finite values map to
 *  `fallback` (default 0.5 = neutral). */
export function clampUnit(value: unknown, fallback = 0.5): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return fallback;
  }
  if (value < 0) return 0;
  if (value > 1) return 1;
  return value;
}

/** Build an AuraParameters from arbitrary input, clamping each
 *  axis to [0, 1] and filling defaults from NEUTRAL_AURA when
 *  an axis is missing. Used by the JSON-feed endpoint + the
 *  registry-load validation pass. */
export function coerceAuraParameters(
  value: unknown,
  fallback: AuraParameters = NEUTRAL_AURA,
): AuraParameters {
  if (value === null || typeof value !== "object") return { ...fallback };
  const p = value as Partial<AuraParameters>;
  return {
    temperature: clampUnit(p.temperature, fallback.temperature),
    intensity: clampUnit(p.intensity, fallback.intensity),
    pace: clampUnit(p.pace, fallback.pace),
    clarity: clampUnit(p.clarity, fallback.clarity),
  };
}
