/**
 * V5 Phase 10 Sub-PR 10.1 — ambient context schema.
 *
 * The ambient layer is the FOUNDATIONAL nervous system for
 * Phase 10. It composes a typed read-only snapshot of "what
 * is true about the ecosystem right now" from existing
 * Phase 6-9 sources, into a single aggregate structure
 * future ambient consumers may optionally read.
 *
 * V5 § 4.5 + Phase 10 brief framing
 *   Ambient intelligence is NOT personalization, NOT
 *   surveillance, NOT recommendation, NOT visible
 *   adaptation. It IS quiet environmental awareness — a
 *   typed view into the ecosystem that improves UNDERSTANDING
 *   without making the visitor feel observed.
 *
 *   This module defines the typed contract. Future ambient
 *   surfaces (10.2+) may consume it; nothing consumes it in
 *   10.1 by design.
 *
 * Privacy contract (load-bearing)
 *   The schema NEVER carries per-visitor signals. Every
 *   field projects an AGGREGATE count, an ordinal signal
 *   intensity, or an operator-side declarative value.
 *   Quantitative perception metrics stay in their source
 *   hashes; the ambient layer reads ORDINALS only.
 *
 *   No visitor identifier enters this shape. No per-session
 *   trace. No reconstructible behavior path. Future
 *   consumers reading the schema can never derive
 *   personalisation primitives from it.
 *
 * Closed allow-lists
 *   `CONTEXT_DOMAINS` + `SIGNAL_INTENSITIES` are closed
 *   enumerations. Adding a new domain or intensity level
 *   requires a new sub-PR + Phase 10 review. This prevents
 *   the foundation from accidentally growing past its
 *   discipline.
 *
 * Edge-safety: pure data + pure functions, no I/O, no DOM.
 * Safe to import from any runtime.
 */

import type {
  PerceptionCategory,
} from "@/lib/v5/perception/buckets";

/* ── Context domain primitives ────────────────────────── */

/**
 * The closed allow-list of context domains. The ambient
 * registry exposes one typed view per domain. Adding a new
 * domain requires a Phase 10+ sub-PR.
 *
 * Domain meanings (load-bearing — keep editorial honest):
 *
 *   navigation   — aggregate visitor navigation flow signal
 *                   (from perception navigation-flow counters).
 *                   Ordinal intensity ONLY; no per-visitor
 *                   trace.
 *
 *   attention    — aggregate attention signal (from perception
 *                   dwell + scroll-velocity counters). Same
 *                   ordinal-only posture.
 *
 *   system       — V5 subsystem health snapshot: which flags
 *                   are ON, which surfaces are publicly
 *                   reachable, validator status.
 *                   Operator-side data only.
 *
 *   temporal     — ecosystem time signals: current ISO week,
 *                   day-of-week, evolution-registry recency.
 *                   Pure time + build-time data.
 *
 *   topology     — topology graph summary: node + relationship
 *                   counts + validation status.
 *                   Build-time deterministic.
 *
 *   operational  — operational snapshot summary: this-week
 *                   commit count, active infra count, planned
 *                   state. From Phase 9.1's composer.
 *                   Operator-side data.
 *
 *   environment  — runtime environment: NODE_ENV, deploy
 *                   region, build SHA, runtime flavour.
 *                   Pure environment read.
 */
export const CONTEXT_DOMAINS = [
  "navigation",
  "attention",
  "system",
  "temporal",
  "topology",
  "operational",
  "environment",
] as const;

export type ContextDomain = (typeof CONTEXT_DOMAINS)[number];

const KNOWN_DOMAINS: ReadonlySet<ContextDomain> = new Set(
  CONTEXT_DOMAINS,
);

export function isContextDomain(value: unknown): value is ContextDomain {
  return (
    typeof value === "string" &&
    KNOWN_DOMAINS.has(value as ContextDomain)
  );
}

/* ── Signal intensity ─────────────────────────────────── */

/**
 * Ordinal signal intensity. Closed allow-list.
 *
 * The ambient layer projects quantitative source data to
 * `low | medium | high` ordinals. This is load-bearing
 * privacy discipline: ordinals carry RELATIVE direction
 * without exposing the underlying numerical distribution.
 *
 * Examples (for future consumer authors):
 *   - perception navigation-flow event count > 50/day  → "high"
 *   - same > 5/day                                     → "medium"
 *   - same > 0                                         → "low"
 *   - 0                                                → null signal
 *     (the domain returns null instead; absent signal is
 *      not a "low" reading)
 */
export const SIGNAL_INTENSITIES = ["low", "medium", "high"] as const;

export type SignalIntensity = (typeof SIGNAL_INTENSITIES)[number];

const KNOWN_INTENSITIES: ReadonlySet<SignalIntensity> = new Set(
  SIGNAL_INTENSITIES,
);

export function isSignalIntensity(
  value: unknown,
): value is SignalIntensity {
  return (
    typeof value === "string" &&
    KNOWN_INTENSITIES.has(value as SignalIntensity)
  );
}

/* ── Environmental signal ─────────────────────────────── */

/**
 * One environmental signal — a single typed observation
 * about the ecosystem state.
 *
 *   domain    — closed enum (CONTEXT_DOMAINS).
 *   kind      — string identifier; consumers should treat as
 *                opaque. Each integration defines its own
 *                kind vocabulary (e.g., "perception-active",
 *                "operating-flag-on"). The kind is the
 *                grep-anchor.
 *   intensity — ordinal signal strength.
 *   source    — file:export grep-anchor for provenance
 *                (e.g., "integrations/perception.ts:viewPerception").
 *                Lets a debugging operator trace any signal
 *                back to its origin.
 */
export interface EnvironmentalSignal {
  domain: ContextDomain;
  kind: string;
  intensity: SignalIntensity;
  source: string;
}

/* ── Per-domain view shapes ──────────────────────────── */

/**
 * Aggregate navigation flow view. Reads `perception.navigation-flow`
 * counters; reports ONLY the ordinal intensity + the set
 * of perception categories that have any signal.
 *
 * Critical invariant: this shape carries NO per-visitor
 * trace. The `top_categories` is a SET (not an ordered
 * sequence) so consumers can't derive flow paths.
 */
export interface NavigationDomainView {
  intensity: SignalIntensity;
  active_categories: readonly PerceptionCategory[];
  /** Total aggregate event count over the perception
   *  navigation-flow hash. Useful only for operator audit;
   *  consumers should branch on `intensity` instead. */
  total_events: number;
}

/**
 * Aggregate attention view. Reads `perception.dwell-time` +
 * `perception.scroll-velocity` counters; reports ordinal
 * intensities per direction.
 */
export interface AttentionDomainView {
  dwell_intensity: SignalIntensity;
  scroll_intensity: SignalIntensity;
  /** Whether perception observers fired ANY events in the
   *  aggregate hash. False = perception flag is off or no
   *  visitors granted consent yet. */
  has_signal: boolean;
}

/**
 * V5 subsystem health snapshot. Pure flag + module state
 * read; no KV access.
 */
export interface SystemDomainView {
  flags: {
    perception: boolean;
    topology_render: boolean;
    aura: boolean;
    contact_adaptive: boolean;
    operating_twin: boolean;
    journal: boolean;
    ambient: boolean;
  };
  /** Whether each module's build-time validator passed.
   *  null = validator not yet run / not applicable. */
  validators: {
    topology: string | null;
  };
}

/**
 * Ecosystem time view. Pure read (no KV, no I/O beyond
 * `Date.now()` capture).
 */
export interface TemporalDomainView {
  iso_week: string;
  day_of_week: string;
  iso_date: string;
  /** Count of evolution events recorded in the registry.
   *  Build-time deterministic. */
  evolution_events_total: number;
  /** Date of the most recent evolution event. */
  evolution_latest: string | null;
}

/**
 * Topology graph summary view. Pure read (build-time data).
 */
export interface TopologyDomainView {
  node_count: number;
  relationship_count: number;
  validation: "ok" | "failed";
  /** Top-3 node kinds by count. Read-only metadata. */
  top_node_kinds: readonly { kind: string; count: number }[];
}

/**
 * Operational snapshot view. Reads the Phase 9.1 composer +
 * (optionally) the Phase 9.3 latest journal narrative.
 *
 * Null when `V5_OPERATING_TWIN_ENABLED` is OFF — the ambient
 * layer doesn't force the operational composer to run when
 * its own flag is off; absence is honest.
 */
export interface OperationalDomainView {
  weekly_commits: SignalIntensity;
  /** Total commit count in the current week. Provided as
   *  a primitive for operator audit; consumers should branch
   *  on `weekly_commits` ordinal. */
  weekly_commit_count: number;
  active_infrastructure_count: number;
  experiments_running: number;
  planned_in_motion: number;
  /** ISO timestamp of the snapshot's generation. */
  snapshot_at: string;
  /** The latest journal entry's templated narrative (one
   *  sentence). Optional; may be null when no journal entry
   *  exists yet. */
  latest_narrative: string | null;
}

/**
 * Runtime environment view. Pure environment read.
 *
 * No secret values; only declarative metadata.
 */
export interface EnvironmentDomainView {
  node_env: string;
  /** Vercel deployment region if set, else null. */
  region: string | null;
  /** Vercel git commit SHA if set, else null. */
  build_sha: string | null;
  /** Runtime flavour: "edge" / "nodejs" / "build" / null
   *  when not derivable. */
  runtime: "edge" | "nodejs" | "build" | null;
}

/* ── AmbientContext (the composed snapshot) ──────────── */

/**
 * The aggregate snapshot consumers read.
 *
 * Every per-domain field is INDEPENDENTLY NULLABLE — when a
 * source is unavailable (flag off, KV down, consent missing),
 * the field returns null instead of mocking data. Consumers
 * branch on null = "no signal" semantically.
 *
 * `flag_enabled` is the master switch state. When false, the
 * context may still be composed (the registry is pure), but
 * consumers should treat it as "informational only — the
 * ambient layer is not active for adoption telemetry".
 *
 * `generated_at` is the only field that varies per
 * composition; everything else is deterministic from sources
 * + clock at compose time.
 */
export interface AmbientContext {
  generated_at: string;
  flag_enabled: boolean;
  domains: {
    navigation: NavigationDomainView | null;
    attention: AttentionDomainView | null;
    system: SystemDomainView;
    temporal: TemporalDomainView;
    topology: TopologyDomainView;
    operational: OperationalDomainView | null;
    environment: EnvironmentDomainView;
  };
  signals: readonly EnvironmentalSignal[];
}

/* ── Validators ───────────────────────────────────────── */

/**
 * Runtime validator for ingested AmbientContext shapes. Used
 * by future consumers that load the context from JSON +
 * want to defend against shape drift.
 *
 * Returns null on valid; returns an error string on
 * failure. Doesn't throw.
 */
export function validateAmbientContext(value: unknown): string | null {
  if (!value || typeof value !== "object") {
    return "context is not an object";
  }
  const ctx = value as Partial<AmbientContext>;
  if (typeof ctx.generated_at !== "string") {
    return "generated_at must be a string";
  }
  if (typeof ctx.flag_enabled !== "boolean") {
    return "flag_enabled must be a boolean";
  }
  if (!ctx.domains || typeof ctx.domains !== "object") {
    return "domains must be an object";
  }
  if (!Array.isArray(ctx.signals)) {
    return "signals must be an array";
  }
  for (const signal of ctx.signals) {
    if (!signal || typeof signal !== "object") {
      return "signal entry must be an object";
    }
    if (!isContextDomain(signal.domain)) {
      return `signal.domain unknown: ${String(signal.domain)}`;
    }
    if (!isSignalIntensity(signal.intensity)) {
      return `signal.intensity invalid: ${String(signal.intensity)}`;
    }
    if (typeof signal.kind !== "string" || signal.kind.length === 0) {
      return "signal.kind must be a non-empty string";
    }
    if (typeof signal.source !== "string" || signal.source.length === 0) {
      return "signal.source must be a non-empty string";
    }
  }
  return null;
}

/* ── Helpers ──────────────────────────────────────────── */

/**
 * Project a numeric count to an ordinal intensity. Used by
 * integration views to keep quantitative source data out of
 * the ambient shape.
 *
 *   count <= 0            → returns null (no signal)
 *   count <= low_max      → "low"
 *   count <= medium_max   → "medium"
 *   count > medium_max    → "high"
 *
 * Thresholds are caller-supplied; integrations encode their
 * own domain-appropriate thresholds. This keeps the
 * intensity mapping grep-auditable per integration.
 */
export function projectIntensity(
  count: number,
  thresholds: { low_max: number; medium_max: number },
): SignalIntensity | null {
  if (!Number.isFinite(count) || count <= 0) return null;
  if (count <= thresholds.low_max) return "low";
  if (count <= thresholds.medium_max) return "medium";
  return "high";
}
