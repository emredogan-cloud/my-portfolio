import type { AuraParameters } from "./schema";

/**
 * V5 Phase 8 Sub-PR 8.4 — aura → CSS custom property mapping.
 *
 * Pure function from the schema's 4 parameters to a flat
 * `Record<string, string>` keyed by CSS custom property
 * names. The AuraProvider (or any future consumer) calls
 * this + applies the entries via
 * `element.style.setProperty(key, value)`.
 *
 * Property naming
 *   The `--v5-aura-` prefix scopes every property under the
 *   V5 namespace so existing portfolio styles don't collide.
 *   Each axis maps to one or more derived properties:
 *
 *     --v5-aura-temperature       → raw [0, 1] value
 *     --v5-aura-intensity         → raw [0, 1] value
 *     --v5-aura-pace              → raw [0, 1] value
 *     --v5-aura-clarity           → raw [0, 1] value
 *     --v5-aura-accent-hue        → CSS hue derived from temperature
 *     --v5-aura-accent-rgb        → R,G,B triple derived from temperature
 *     --v5-aura-ambient-alpha     → ambient opacity derived from intensity
 *     --v5-aura-blur-radius       → blur derived from (1 - clarity)
 *     --v5-aura-motion-multiplier → animation duration multiplier from pace
 *
 * Why expose BOTH raw + derived properties
 *   - Raw values let consumers do their own math.
 *   - Derived values cover the common cases without forcing
 *     every consumer to recompute.
 *   - Future renderers / surfaces can opt into reading
 *     whichever shape fits.
 *
 * No CSS rule in 8.4 reads ANY of these properties. The
 * properties exist as a CONTRACT; future opt-in by existing
 * surfaces (or new ones) consumes them. The visitor sees
 * zero visual change in 8.4 because nothing reads.
 *
 * Edge-safety: pure function. No DOM, no I/O.
 */

export const AURA_CSS_PREFIX = "--v5-aura-";

/* Hue endpoints. The portfolio's cinematic identity is
 * cyan (#00d2ff ≈ HSL hue 192°). Aura.temperature shifts
 * from "cool cyan" to "warm amber" — interpolating from
 * hue 192° (cyan) down to hue 36° (amber). */
const COOL_HUE = 192;
const WARM_HUE = 36;

/* The portfolio identity's primary accent is cyan; the
 * warm endpoint is the inverse aesthetic (amber). The RGB
 * triples below are the named hex colours decoded once,
 * for the accent-rgb CSS property. */
const COOL_RGB = { r: 0, g: 210, b: 255 } as const;  // #00d2ff
const WARM_RGB = { r: 255, g: 184, b: 87 } as const;  // amber accent

/**
 * Build the CSS custom-property map from an aura. The
 * returned object's keys all start with `--v5-aura-`; the
 * values are CSS-ready strings (raw numbers as strings,
 * percentages where appropriate, RGB triples for color
 * functions).
 *
 * Applying:
 *   const props = toCssCustomProperties(aura);
 *   for (const [key, value] of Object.entries(props)) {
 *     document.documentElement.style.setProperty(key, value);
 *   }
 */
export function toCssCustomProperties(
  aura: AuraParameters,
): Record<string, string> {
  const { temperature, intensity, pace, clarity } = aura;

  /* Linear interpolation from COOL_HUE → WARM_HUE. */
  const hue = COOL_HUE + (WARM_HUE - COOL_HUE) * temperature;

  /* Interpolate the RGB triple as well (callers using
   * `rgb(var(--v5-aura-accent-rgb))` get a single-property
   * accent without writing the math themselves). */
  const r = Math.round(
    COOL_RGB.r + (WARM_RGB.r - COOL_RGB.r) * temperature,
  );
  const g = Math.round(
    COOL_RGB.g + (WARM_RGB.g - COOL_RGB.g) * temperature,
  );
  const b = Math.round(
    COOL_RGB.b + (WARM_RGB.b - COOL_RGB.b) * temperature,
  );

  /* Intensity → ambient alpha in [0.02, 0.18]. The lower
   * bound matches the existing /lumina/brain + /v5/perception
   * ambient gradient alpha; the upper bound stays well within
   * cinematic restraint. */
  const ambientAlpha = 0.02 + 0.16 * intensity;

  /* Clarity → ambient blur radius in [120px, 220px] (lower
   * clarity = larger blur = more diffuse). Existing ambient
   * gradients use 160-180px; the range here straddles that. */
  const blurRadius = 220 - 100 * clarity;

  /* Pace → animation duration multiplier in [1.3, 0.7]
   * (low pace = slower animations = higher multiplier;
   * high pace = faster animations = lower multiplier).
   * Mirrors the Phase 6.3 cinematic pacing engine's tier
   * range. */
  const motionMultiplier = 1.3 - 0.6 * pace;

  return {
    [`${AURA_CSS_PREFIX}temperature`]: temperature.toFixed(3),
    [`${AURA_CSS_PREFIX}intensity`]: intensity.toFixed(3),
    [`${AURA_CSS_PREFIX}pace`]: pace.toFixed(3),
    [`${AURA_CSS_PREFIX}clarity`]: clarity.toFixed(3),
    [`${AURA_CSS_PREFIX}accent-hue`]: hue.toFixed(1),
    [`${AURA_CSS_PREFIX}accent-rgb`]: `${r}, ${g}, ${b}`,
    [`${AURA_CSS_PREFIX}ambient-alpha`]: ambientAlpha.toFixed(3),
    [`${AURA_CSS_PREFIX}blur-radius`]: `${blurRadius.toFixed(1)}px`,
    [`${AURA_CSS_PREFIX}motion-multiplier`]: motionMultiplier.toFixed(3),
  };
}

/**
 * Apply the CSS custom properties to a host element (defaults
 * to `document.documentElement`). Pure side-effect helper;
 * returns nothing. Safe to call repeatedly — `setProperty`
 * with the same value is a no-op.
 *
 * Guards against `typeof document === "undefined"` so SSR
 * callers don't throw.
 */
export function applyAuraToElement(
  aura: AuraParameters,
  host?: HTMLElement,
): void {
  if (typeof document === "undefined") return;
  const target = host ?? document.documentElement;
  if (!target || typeof target.style?.setProperty !== "function") return;
  const props = toCssCustomProperties(aura);
  for (const [key, value] of Object.entries(props)) {
    try {
      target.style.setProperty(key, value);
    } catch {
      /* ignore — a malformed value would only fail on the
       * single property; other properties continue to set. */
    }
  }
}
