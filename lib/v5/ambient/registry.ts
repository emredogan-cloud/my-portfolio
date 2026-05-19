import { isPerceptionEnabled } from "@/lib/v5/perception/consent";
import { isTopologyRenderEnabled } from "@/lib/v5/topology/flags";
import { isAuraEnabled } from "@/lib/v5/aura/flags";
import { isContactAdaptiveEnabled } from "@/lib/v5/contact/flags";
import { isOperatingTwinEnabled } from "@/lib/v5/operating/flags";
import { isJournalEnabled } from "@/lib/v5/journal/flags";
import { getTopologyValidationFailure } from "@/lib/v5/topology/registry";

import { isAmbientEnabled } from "./flags";
import { viewOperating } from "./integrations/operating";
import { viewPerception } from "./integrations/perception";
import { viewTemporal } from "./integrations/temporal";
import { viewTopology } from "./integrations/topology";
import {
  recordAmbientEvent,
} from "./telemetry";
import type {
  AmbientContext,
  EnvironmentalSignal,
  EnvironmentDomainView,
  SystemDomainView,
} from "./schema";

/**
 * V5 Phase 10 Sub-PR 10.1 — ambient context composer.
 *
 * The single canonical entry-point for building an
 * `AmbientContext` snapshot from existing Phase 6-9
 * sources.
 *
 * What this composer IS
 *   - A pure read fan-out: each integration view runs in
 *     parallel via `Promise.all`. The composer doesn't
 *     mutate any source or perform any cross-system write.
 *   - A typed projection: every value the composer returns
 *     is bounded by the schema's allow-lists (ContextDomain,
 *     SignalIntensity) and operator-side declarative
 *     fields.
 *   - Telemetry-instrumented: fires `context_composed` (one
 *     per call) + per-domain `domain_view_resolved` /
 *     `domain_view_missing` events.
 *
 * What this composer is NOT
 *   - Not a side-effecting actor. The composer doesn't
 *     write to any source's KV.
 *   - Not a renderer. Nothing here touches the DOM, emits
 *     CSS, or builds an image.
 *   - Not a consumer of the context. Nothing here branches
 *     on the composed shape. Future ambient consumers
 *     (Sub-PR 10.2+) read the composer's output; the
 *     composer doesn't read its own output back.
 *
 * Flag semantics
 *   - `isAmbientEnabled()` (V5_AMBIENT_ENABLED) controls
 *     telemetry firing + the JSON endpoint's gate. The
 *     composer can still be called when the flag is OFF
 *     (e.g., for dev / testing); the `flag_enabled` field
 *     declares the state honestly so consumers can branch.
 *
 * Privacy posture (inherited from sources + reinforced)
 *   - All integration views project aggregate-only data.
 *   - No per-visitor identifier enters this path.
 *   - No per-session trace.
 *   - The composed shape is what `/api/v5/ambient/context`
 *     returns; any field added here must pass the same
 *     privacy review as the source it projects from.
 *
 * Performance posture
 *   - 4 integration views fan out in parallel via
 *     `Promise.all`. Cold cost dominated by operating
 *     composer (~150-300ms). Other integrations are pure
 *     reads (~1-5ms each).
 *   - Caller responsible for caching (endpoint uses 5min
 *     s-maxage / 1h SWR).
 *
 * Edge-safety: every imported function is edge-safe per its
 * source phase's verification.
 */

/* ── System view (in-registry; reads only flag helpers) ─ */

function buildSystemView(): SystemDomainView {
  return {
    flags: {
      perception: isPerceptionEnabled(),
      topology_render: isTopologyRenderEnabled(),
      aura: isAuraEnabled(),
      contact_adaptive: isContactAdaptiveEnabled(),
      operating_twin: isOperatingTwinEnabled(),
      journal: isJournalEnabled(),
      ambient: isAmbientEnabled(),
    },
    validators: {
      topology: getTopologyValidationFailure(),
    },
  };
}

/* ── Environment view ───────────────────────────────── */

function detectRuntime(): EnvironmentDomainView["runtime"] {
  /* `NEXT_RUNTIME` is the cross-runtime canonical signal —
   * Next.js sets it to "edge" / "nodejs" at request-handling
   * time. At build time it's unset; we report "build" so
   * the composer is honest about its context.
   *
   * Edge-safe: only reads `process.env` (allowed in edge);
   * no `process.versions` / no other Node-only API. The
   * `EdgeRuntime` globalThis check serves as a fallback for
   * runtimes that don't surface `NEXT_RUNTIME`. */
  const r = process.env.NEXT_RUNTIME;
  if (r === "edge" || r === "nodejs") return r;
  if (typeof EdgeRuntime !== "undefined") return "edge";
  return "build";
}

function buildEnvironmentView(): EnvironmentDomainView {
  return {
    node_env: process.env.NODE_ENV ?? "unknown",
    region: process.env.VERCEL_REGION ?? null,
    build_sha: process.env.VERCEL_GIT_COMMIT_SHA ?? null,
    runtime: detectRuntime(),
  };
}

/* ── Composer ────────────────────────────────────────── */

/**
 * Compose the full `AmbientContext` snapshot. Fires
 * adoption telemetry as a side-effect (guarded by
 * `V5_AMBIENT_ENABLED` per `recordAmbientEvent`).
 *
 * Returns a typed `AmbientContext`. Never throws — sources
 * that throw are caught at the integration boundary and
 * surface as null views.
 */
export async function composeAmbientContext(): Promise<AmbientContext> {
  const now = Date.now();
  const flagEnabled = isAmbientEnabled();

  /* Fan out the four async integration views in parallel.
   * Each integration is individually graceful. */
  const [perception, temporal, topology, operating] = await Promise.all(
    [viewPerception(), viewTemporal(), viewTopology(), viewOperating()],
  );

  const system = buildSystemView();
  const environment = buildEnvironmentView();

  const signals: EnvironmentalSignal[] = [
    ...perception.signals,
    ...temporal.signals,
    ...topology.signals,
    ...operating.signals,
    /* System + environment domains always emit one structural
     * signal each — keeps the signal stream complete. */
    {
      domain: "system",
      kind: "subsystem-flags-snapshot",
      intensity: "low",
      source: "registry.ts:buildSystemView",
    },
    {
      domain: "environment",
      kind: "runtime-metadata-snapshot",
      intensity: "low",
      source: "registry.ts:buildEnvironmentView",
    },
  ];

  /* Telemetry fan-out. All gated by flag inside the helper. */
  void recordAmbientEvent("context_composed");
  void recordAmbientEvent(
    perception.navigation ? "domain_view_resolved" : "domain_view_missing",
  );
  void recordAmbientEvent(
    perception.attention ? "domain_view_resolved" : "domain_view_missing",
  );
  /* Temporal + topology + system + environment always
   * resolve (they're pure reads); operational is the only
   * other gated source. */
  void recordAmbientEvent("domain_view_resolved");
  void recordAmbientEvent("domain_view_resolved");
  void recordAmbientEvent(
    operating.operational
      ? "domain_view_resolved"
      : "domain_view_missing",
  );
  void recordAmbientEvent("domain_view_resolved");
  void recordAmbientEvent("domain_view_resolved");

  return {
    generated_at: new Date(now).toISOString(),
    flag_enabled: flagEnabled,
    domains: {
      navigation: perception.navigation,
      attention: perception.attention,
      system,
      temporal: temporal.temporal,
      topology: topology.topology,
      operational: operating.operational,
      environment,
    },
    signals,
  };
}

/* `EdgeRuntime` is injected by Next.js at edge build time —
 * declare its TS-visible existence so the runtime detection
 * branch type-checks under both runtimes. */
declare const EdgeRuntime: unknown;
