import type { ContextDomain } from "./schema";

/**
 * V5 Phase 10 Sub-PR 10.1 — context domain primitive
 * registry.
 *
 * The schema's `CONTEXT_DOMAINS` allow-list defines WHICH
 * domains exist. This module defines WHAT each domain
 * means, structurally, for any future consumer.
 *
 * Why a separate module
 *   schema.ts defines TYPES. This module defines
 *   STRUCTURAL METADATA per domain — the human-readable
 *   description, the upstream source paths, the privacy
 *   notes. Keeping this separate from the types lets:
 *
 *   - The /v5/ambient transparency page (future sub-PR)
 *     render this metadata directly without re-deriving it.
 *   - The eval / audit scripts read the upstream sources
 *     without re-importing schema types.
 *   - Future ambient consumers can declare which domains
 *     they read and prove the privacy claim at review time.
 *
 * Privacy contract per domain
 *   Every entry includes `privacy_posture` — the load-
 *   bearing privacy claim. Reviewers can verify by reading
 *   `upstream_sources` against the actual integration in
 *   `integrations/<domain>.ts`.
 *
 * Edge-safety: pure data, no I/O.
 */

export interface ContextDomainDescriptor {
  /** The domain identifier (closed allow-list from schema). */
  domain: ContextDomain;
  /** One-sentence human-readable description. */
  description: string;
  /** Files this domain reads from. Grep-anchor for review. */
  upstream_sources: readonly string[];
  /** Privacy claim — what the domain DOES and DOES NOT
   *  expose. Reviewers verify against the integration. */
  privacy_posture: string;
  /** Future ambient consumers may read this domain when… */
  consumer_guidance: string;
}

export const CONTEXT_DOMAIN_REGISTRY: Readonly<
  Record<ContextDomain, ContextDomainDescriptor>
> = {
  navigation: {
    domain: "navigation",
    description:
      "Aggregate visitor navigation flow signal. Reports ordinal intensity + which perception categories have any signal.",
    upstream_sources: [
      "lib/v5/perception/telemetry.ts:readPerceptionSnapshot",
    ],
    privacy_posture:
      "Aggregate counts only. NO per-visitor flow path. The active_categories field is a SET, not an ordered sequence, so flow paths cannot be reconstructed.",
    consumer_guidance:
      "Use to detect 'is anyone navigating the ecosystem right now' in ordinal terms. Do NOT use to derive flow paths.",
  },
  attention: {
    domain: "attention",
    description:
      "Aggregate visitor attention signal — dwell + scroll velocity ordinals.",
    upstream_sources: [
      "lib/v5/perception/telemetry.ts:readPerceptionCategory",
    ],
    privacy_posture:
      "Aggregate counts only. Ordinal intensities (low/medium/high), not numerical values. NO per-session dwell trace, NO per-visitor scroll velocity.",
    consumer_guidance:
      "Use to color future ambient surfaces' calm vs alert tone. Do NOT use to surface 'we noticed you spent X minutes' messaging.",
  },
  system: {
    domain: "system",
    description:
      "V5 subsystem health snapshot — which flags are ON, which validators pass.",
    upstream_sources: [
      "lib/v5/perception/consent.ts:isPerceptionEnabled",
      "lib/v5/topology/flags.ts:isTopologyRenderEnabled",
      "lib/v5/aura/flags.ts:isAuraEnabled",
      "lib/v5/contact/flags.ts:isContactAdaptiveEnabled",
      "lib/v5/operating/flags.ts:isOperatingTwinEnabled",
      "lib/v5/journal/flags.ts:isJournalEnabled",
      "lib/v5/ambient/flags.ts:isAmbientEnabled",
      "lib/v5/topology/registry.ts:getTopologyValidationFailure",
    ],
    privacy_posture:
      "Operator-side data only — flag states + validator outcomes. No visitor signal.",
    consumer_guidance:
      "Use to detect which V5 surfaces are active. A future ambient consumer might branch on operating_twin being ON to decide whether to surface operational vocabulary in tooltips.",
  },
  temporal: {
    domain: "temporal",
    description:
      "Ecosystem time signals — current ISO week, day-of-week, evolution registry recency.",
    upstream_sources: [
      "lib/v5/journal/schema.ts:currentIsoWeek",
      "lib/v5/temporal/registry.ts:summariseEvolutionRegistry",
    ],
    privacy_posture:
      "Wall-clock time only. NO visitor-specific timestamps. NO session age.",
    consumer_guidance:
      "Use to detect ecosystem-wide time context. A future surface might surface 'this is the week of <iso_week>' as ambient text, never 'you visited at <time>'.",
  },
  topology: {
    domain: "topology",
    description:
      "Topology graph summary — node + relationship counts + validation status + top node kinds.",
    upstream_sources: [
      "lib/v5/topology/registry.ts:summariseTopologyRegistry",
      "lib/v5/topology/registry.ts:getTopologyValidationFailure",
    ],
    privacy_posture:
      "Build-time deterministic data only. No visitor signal.",
    consumer_guidance:
      "Use to detect ecosystem topology shape. Consumers should treat this as a context-providing snapshot, not a data source for visualisation (the dedicated topology renderer handles that).",
  },
  operational: {
    domain: "operational",
    description:
      "Operational snapshot summary — weekly commit ordinal, active infrastructure count, planned-state counts, optional latest journal narrative.",
    upstream_sources: [
      "lib/v5/operating/snapshot.ts:composeOperationalSnapshot",
      "lib/v5/journal/storage.ts:listRecentJournalEntries",
    ],
    privacy_posture:
      "Operator-side data only. The latest_narrative is the templated weekly summary (Phase 9.3 Anti-Generic-AI Law compliant — no LLM). No visitor signal.",
    consumer_guidance:
      "Use to detect operator's recent engineering velocity in ordinal terms. A future ambient consumer might color the page background subtly when the ecosystem is in a 'high' commit-week without ever stating the number.",
  },
  environment: {
    domain: "environment",
    description:
      "Runtime environment — NODE_ENV, deploy region, build SHA, runtime flavour.",
    upstream_sources: ["process.env"],
    privacy_posture:
      "Public deployment metadata only. No secrets. No visitor signal.",
    consumer_guidance:
      "Use to detect runtime context. A future surface might surface 'deployed from <build_sha>' as ambient footer text.",
  },
};

/**
 * The closed list of domains, ordered for stable iteration.
 */
export function listContextDomains(): readonly ContextDomain[] {
  return Object.keys(CONTEXT_DOMAIN_REGISTRY) as ContextDomain[];
}

/**
 * Look up a single domain descriptor. Returns null for an
 * unknown domain (closed allow-list).
 */
export function getContextDomain(
  domain: ContextDomain,
): ContextDomainDescriptor {
  return CONTEXT_DOMAIN_REGISTRY[domain];
}
