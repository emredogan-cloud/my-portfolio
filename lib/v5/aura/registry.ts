import {
  type AuraParameters,
  NEUTRAL_AURA,
  coerceAuraParameters,
} from "./schema";

/**
 * V5 Phase 8 Sub-PR 8.4 — per-page aura registry.
 *
 * V5 future § 9.1 lists the explicit page feelings the aura
 * system encodes. The list below decomposes each feeling
 * into the schema's 4-parameter shape:
 *
 *   /about → calm + warm        → pace low, temperature high
 *   /architecture → focused + precise → clarity high, intensity moderate
 *   /lab → curious + amber      → pace moderate, temperature high
 *   /lumina/brain → analytical + clear → clarity high, pace low
 *   /v5/topology → cinematic + spatial → intensity high, clarity high
 *   ...
 *
 * Why route prefixes, not exact matches
 *   Routes like `/architecture/<slug>` should inherit the
 *   `/architecture` aura. The resolver matches the LONGEST
 *   registered prefix — `/architecture/cloud-waste-hunter`
 *   resolves to the `/architecture` aura unless a more
 *   specific entry exists.
 *
 * Why a static map, not a derived computation
 *   Aura is an EDITORIAL declaration about each surface's
 *   identity. The values are author-chosen, not algorithmic.
 *   Maintaining a static map keeps the registry inspectable
 *   + version-controlled; future changes ship as code review,
 *   not runtime drift.
 *
 * Append-only by convention
 *   New routes default to NEUTRAL_AURA. Adding an explicit
 *   entry is a deliberate editorial pass — the operator
 *   decides the surface deserves a non-neutral feeling.
 *
 * Edge-safety: pure data + pure functions. No DOM, no I/O.
 *
 * Phase 8 cognition note
 *   The page entries below define each surface's *resting*
 *   identity. Time-of-day + cognition-signal modulations
 *   (lib/v5/aura/modulation.ts) shift the resting values
 *   by small additive deltas. The visitor's perceived aura
 *   is base + modulations clamped to [0, 1]. Identity stays
 *   stable because the deltas are small (typically ±0.05 to
 *   ±0.15) and the base values carry the dominant signal.
 */

/** One registry entry — the route prefix + the base aura
 *  the resolver returns when the pathname matches. */
export interface AuraRegistryEntry {
  prefix: string;
  aura: AuraParameters;
  /** Editorial label naming the feeling. Surfaced via the
   *  resolver result; future debug surfaces can display it. */
  label: string;
}

/** Author-curated page aura registry. Order matters only
 *  insofar as the resolver picks the LONGEST matching
 *  prefix — declaring a more specific entry first or last
 *  is irrelevant. */
export const PAGE_AURAS: readonly AuraRegistryEntry[] = [
  /* The home page — cinematic + spatial. */
  {
    prefix: "/",
    aura: { temperature: 0.5, intensity: 0.7, pace: 0.55, clarity: 0.7 },
    label: "cinematic / spatial",
  },
  /* /about — calm + warm (operator monologue). */
  {
    prefix: "/about",
    aura: { temperature: 0.7, intensity: 0.4, pace: 0.3, clarity: 0.55 },
    label: "calm / warm",
  },
  /* Architecture hub + project scroll-throughs — focused +
   * precise (engineering case studies). */
  {
    prefix: "/architecture",
    aura: { temperature: 0.4, intensity: 0.55, pace: 0.45, clarity: 0.85 },
    label: "focused / precise",
  },
  /* Public lab experiments — curious + warm. */
  {
    prefix: "/lab",
    aura: { temperature: 0.65, intensity: 0.6, pace: 0.6, clarity: 0.6 },
    label: "curious / amber",
  },
  /* Lumina transparency surfaces — analytical + clear. */
  {
    prefix: "/lumina/brain",
    aura: { temperature: 0.45, intensity: 0.5, pace: 0.3, clarity: 0.9 },
    label: "analytical / clear",
  },
  {
    prefix: "/lumina/failures",
    aura: { temperature: 0.4, intensity: 0.45, pace: 0.25, clarity: 0.75 },
    label: "honest / restrained",
  },
  /* Public perception layer — calm + cool (privacy contract
   * voice). */
  {
    prefix: "/v5/perception",
    aura: { temperature: 0.35, intensity: 0.45, pace: 0.3, clarity: 0.7 },
    label: "calm / cool",
  },
  /* Engineering memory archive — archival + still. */
  {
    prefix: "/evolution",
    aura: { temperature: 0.5, intensity: 0.4, pace: 0.25, clarity: 0.7 },
    label: "archival / still",
  },
  /* Cinematic topology surface — cinematic + spatial. */
  {
    prefix: "/v5/topology",
    aura: { temperature: 0.5, intensity: 0.75, pace: 0.55, clarity: 0.9 },
    label: "cinematic / spatial",
  },
  /* Telemetry dashboard — analytical + cool. */
  {
    prefix: "/telemetry",
    aura: { temperature: 0.35, intensity: 0.5, pace: 0.4, clarity: 0.85 },
    label: "analytical / cool",
  },
  /* Public changelog — chronicled + restrained. */
  {
    prefix: "/changelog",
    aura: { temperature: 0.5, intensity: 0.4, pace: 0.3, clarity: 0.7 },
    label: "chronicled / restrained",
  },
  /* Project hub + detail pages — focused + warm. */
  {
    prefix: "/projects",
    aura: { temperature: 0.55, intensity: 0.55, pace: 0.45, clarity: 0.75 },
    label: "focused / warm",
  },
  /* Notes — calm + warm (long-form reading). */
  {
    prefix: "/notes",
    aura: { temperature: 0.65, intensity: 0.4, pace: 0.25, clarity: 0.65 },
    label: "calm / warm",
  },
  /* Codex (the hidden archive) — archival + warm. */
  {
    prefix: "/codex",
    aura: { temperature: 0.6, intensity: 0.4, pace: 0.2, clarity: 0.7 },
    label: "archival / warm",
  },
  /* Stack page — analytical + cool. */
  {
    prefix: "/stack",
    aura: { temperature: 0.4, intensity: 0.5, pace: 0.4, clarity: 0.8 },
    label: "analytical / cool",
  },
  /* Contact page — direct + warm (the call-to-action surface). */
  {
    prefix: "/contact",
    aura: { temperature: 0.6, intensity: 0.6, pace: 0.5, clarity: 0.8 },
    label: "direct / warm",
  },
  /* Playground — experimental + curious. */
  {
    prefix: "/playground",
    aura: { temperature: 0.55, intensity: 0.5, pace: 0.5, clarity: 0.7 },
    label: "experimental / curious",
  },
];

/** Resolution result — the matched entry's aura + label +
 *  prefix, OR a neutral fallback when no entry matches. */
export interface AuraResolution {
  aura: AuraParameters;
  label: string;
  matchedPrefix: string;
  isFallback: boolean;
}

/**
 * Resolve a pathname to its base aura. The resolver picks
 * the LONGEST registered prefix that the pathname starts
 * with. Pure function; no I/O.
 *
 *   pathname           → matched prefix
 *   /architecture      → "/architecture"
 *   /architecture/cwh  → "/architecture"
 *   /unknown           → "/" (the home page entry)
 *   "" / null          → NEUTRAL_AURA fallback
 *
 * The fallback case (unknown route) returns the home page's
 * aura. Combined with the home prefix being `/`, every
 * pathname matches at least one entry — making the
 * `isFallback` flag rare in practice. The flag is reserved
 * for future routes that should explicitly NOT inherit the
 * home aura (callers can pass a different default).
 */
export function resolveAuraForPath(
  pathname: string | null | undefined,
): AuraResolution {
  if (typeof pathname !== "string" || !pathname) {
    return {
      aura: NEUTRAL_AURA,
      label: "neutral",
      matchedPrefix: "",
      isFallback: true,
    };
  }
  let best: AuraRegistryEntry | null = null;
  let bestLen = -1;
  for (const entry of PAGE_AURAS) {
    if (!startsWithPrefix(pathname, entry.prefix)) continue;
    if (entry.prefix.length > bestLen) {
      best = entry;
      bestLen = entry.prefix.length;
    }
  }
  if (!best) {
    return {
      aura: NEUTRAL_AURA,
      label: "neutral",
      matchedPrefix: "",
      isFallback: true,
    };
  }
  return {
    aura: coerceAuraParameters(best.aura),
    label: best.label,
    matchedPrefix: best.prefix,
    isFallback: false,
  };
}

/** Helper: pathname starts with prefix, treating `/` as a
 *  catch-all + matching either exact equality or a
 *  prefix-followed-by-slash boundary (so `/architectured`
 *  does NOT match `/architecture`). */
function startsWithPrefix(pathname: string, prefix: string): boolean {
  if (prefix === "/") return true;
  if (pathname === prefix) return true;
  return pathname.startsWith(prefix + "/");
}

/** The set of registered prefixes. Surfaced for the
 *  operator-facing audit list (future surface). */
export function getRegisteredAuraPrefixes(): readonly string[] {
  return PAGE_AURAS.map((e) => e.prefix);
}
