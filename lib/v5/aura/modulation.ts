import type { CognitionSignalBucket } from "@/lib/v5/navigation/cognition";

import {
  type AuraModulation,
  type AuraParameters,
  clampUnit,
  NEUTRAL_AURA,
} from "./schema";

/**
 * V5 Phase 8 Sub-PR 8.4 — aura modulation helpers.
 *
 * V5 future § 9.2 specifies time-of-day as one of the
 * modulation axes. The user's Phase 8 brief carries cognition
 * signal + topology context as additional axes the aura
 * system "should already understand", even when no UI
 * consumes them yet.
 *
 * This module ships:
 *
 *   1. `timeOfDayModulation(hour)` — pure function. Maps an
 *      hour-of-day to a small temperature + pace delta.
 *   2. `cognitionModulation(signal)` — pure function. Maps
 *      the Phase 6.2 cognition signal (arrival / exploring /
 *      engaged) to clarity + pace deltas.
 *   3. `topologyContextModulation(context)` — pure function.
 *      Maps a topology page context (which surface the
 *      visitor is on) to intensity + clarity deltas.
 *   4. `composeAura(base, ...modulations)` — additive composer
 *      that sums all deltas onto the base, clamping each axis
 *      to [0, 1].
 *
 * All modulations are SMALL (≤ ±0.15 per axis). Identity stays
 * stable because the page's resting aura is the dominant
 * signal; modulations are the subtle drift.
 *
 * Edge-safety: pure functions; no I/O, no DOM, no clock reads
 * (the timeOfDay function accepts the hour as an argument so
 * callers can pass `new Date().getHours()` or a fixed value
 * for tests).
 */

/**
 * Time-of-day modulation. Maps an hour-of-day [0, 24) to
 * temperature + pace deltas. Per V5 future § 9.2:
 *
 *   Morning (06-12):    cooler tones, slightly faster pacing
 *   Afternoon (12-18):  neutral
 *   Evening (18-24):    warmer accents, slightly slower
 *                       transitions
 *   Night (00-06):      warmest, slowest
 *
 * Deltas are small — ±0.05 to ±0.10 typically. The intent is
 * a subtle drift the visitor feels rather than sees.
 *
 * Hours outside [0, 24) silently fall back to neutral (zero
 * delta).
 */
export function timeOfDayModulation(
  hour: number,
): AuraModulation {
  if (!Number.isFinite(hour) || hour < 0 || hour >= 24) {
    return {};
  }
  const h = Math.floor(hour);

  /* Morning: 06-11 → -0.06 temperature, +0.05 pace */
  if (h >= 6 && h < 12) {
    return { temperature: -0.06, pace: 0.05 };
  }
  /* Afternoon: 12-17 → neutral. No delta. */
  if (h >= 12 && h < 18) {
    return {};
  }
  /* Evening: 18-23 → +0.08 temperature, -0.06 pace */
  if (h >= 18 && h < 24) {
    return { temperature: 0.08, pace: -0.06 };
  }
  /* Night: 00-05 → +0.05 temperature, -0.10 pace */
  return { temperature: 0.05, pace: -0.1 };
}

/**
 * Cognition-signal modulation. Maps the Phase 6.2 signal
 * (arrival / exploring / engaged) to clarity + pace deltas.
 *
 *   arrival:   the visitor just landed. Soft clarity (less
 *              precise affordances), neutral pace.
 *   exploring: actively navigating. Higher clarity (sharper
 *              UI), slight pace increase.
 *   engaged:   deep visitor. Highest clarity, calmer pace.
 *
 * Unknown signals → no modulation.
 */
export function cognitionModulation(
  signal: CognitionSignalBucket | null | undefined,
): AuraModulation {
  if (signal === "arrival") {
    return { clarity: -0.05 };
  }
  if (signal === "exploring") {
    return { clarity: 0.05, pace: 0.04 };
  }
  if (signal === "engaged") {
    return { clarity: 0.1, pace: -0.04 };
  }
  return {};
}

/**
 * Topology-context modulation. Used when the visitor is on a
 * topology surface (e.g. `/v5/topology/<slug>`) — the
 * presence of a rendered topology shifts the page's aura
 * toward `cinematic + spatial` slightly.
 *
 * `context` is a string identifier the consumer passes; the
 * function maps known contexts to deltas. Unknown contexts
 * → no modulation.
 */
export function topologyContextModulation(
  context: string | null | undefined,
): AuraModulation {
  if (typeof context !== "string" || !context) return {};
  /* The renderer-bearing topology surface gets a small
   * intensity + clarity bump — the visual presence of a
   * rendered graph elevates the perceived ambient layer. */
  if (context === "topology-mounted") {
    return { intensity: 0.07, clarity: 0.05 };
  }
  return {};
}

/**
 * Apply a list of modulations to a base aura. Each modulation
 * is summed onto the base; the final value clamps to [0, 1]
 * per axis.
 *
 * Order doesn't matter — addition is commutative — but the
 * convention is to pass the most-deterministic modulation
 * first (time-of-day) and the most-contextual last
 * (cognition, topology).
 *
 * `composeAura()` always returns a fully-populated
 * AuraParameters; missing modulation axes contribute zero.
 */
export function composeAura(
  base: AuraParameters,
  ...modulations: readonly AuraModulation[]
): AuraParameters {
  let temperature = base.temperature;
  let intensity = base.intensity;
  let pace = base.pace;
  let clarity = base.clarity;

  for (const mod of modulations) {
    if (typeof mod.temperature === "number" && Number.isFinite(mod.temperature)) {
      temperature += mod.temperature;
    }
    if (typeof mod.intensity === "number" && Number.isFinite(mod.intensity)) {
      intensity += mod.intensity;
    }
    if (typeof mod.pace === "number" && Number.isFinite(mod.pace)) {
      pace += mod.pace;
    }
    if (typeof mod.clarity === "number" && Number.isFinite(mod.clarity)) {
      clarity += mod.clarity;
    }
  }

  return {
    temperature: clampUnit(temperature, NEUTRAL_AURA.temperature),
    intensity: clampUnit(intensity, NEUTRAL_AURA.intensity),
    pace: clampUnit(pace, NEUTRAL_AURA.pace),
    clarity: clampUnit(clarity, NEUTRAL_AURA.clarity),
  };
}

/**
 * Convenience: compute the aura for the current page using
 * the typical modulation set (time-of-day + cognition +
 * optional topology context). Callers that want different
 * modulations should use `composeAura()` directly.
 */
export interface ComposeForPageInputs {
  /** The base aura from `resolveAuraForPath`. */
  base: AuraParameters;
  /** The current hour of day (0-23). */
  hour: number;
  /** Optional cognition signal from the Phase 6 layer. */
  cognition?: CognitionSignalBucket | null;
  /** Optional topology context identifier. */
  topologyContext?: string | null;
}

export function composeAuraForPage({
  base,
  hour,
  cognition = null,
  topologyContext = null,
}: ComposeForPageInputs): AuraParameters {
  return composeAura(
    base,
    timeOfDayModulation(hour),
    cognitionModulation(cognition),
    topologyContextModulation(topologyContext),
  );
}
