import {
  getTopologyValidationFailure,
  summariseTopologyRegistry,
} from "@/lib/v5/topology/registry";

import {
  projectIntensity,
  type EnvironmentalSignal,
  type TopologyDomainView,
} from "../schema";

/**
 * V5 Phase 10 Sub-PR 10.1 — topology → ambient view.
 *
 * Pure projection: reads the build-time topology registry
 * summariser + the validation status. No KV. No fetch.
 * No async I/O.
 *
 * Privacy contract
 *   Build-time deterministic data only. NO visitor signal.
 *
 * Marked async for shape consistency with other integration
 * views.
 *
 * Edge-safety: pure read, edge-safe.
 */

const TOPOLOGY_THRESHOLDS = { low_max: 10, medium_max: 30 } as const;

export async function viewTopology(): Promise<{
  topology: TopologyDomainView;
  signals: readonly EnvironmentalSignal[];
}> {
  const summary = summariseTopologyRegistry();
  const validationFailure = getTopologyValidationFailure();

  /* Top-3 node kinds by count. The list is sorted desc by
   * count, ties broken by lexical kind. */
  const topKinds = Object.entries(summary.nodesByKind)
    .map(([kind, count]) => ({ kind, count: count as number }))
    .filter((entry) => entry.count > 0)
    .sort((a, b) => {
      if (b.count !== a.count) return b.count - a.count;
      return a.kind < b.kind ? -1 : 1;
    })
    .slice(0, 3);

  const topology: TopologyDomainView = {
    node_count: summary.totalNodes,
    relationship_count: summary.totalRelationships,
    validation: validationFailure === null ? "ok" : "failed",
    top_node_kinds: topKinds,
  };

  const intensity =
    projectIntensity(summary.totalNodes, TOPOLOGY_THRESHOLDS) ?? "low";

  const signals: EnvironmentalSignal[] = [
    {
      domain: "topology",
      kind: "graph-size",
      intensity,
      source: "integrations/topology.ts:viewTopology",
    },
  ];

  if (validationFailure !== null) {
    signals.push({
      domain: "topology",
      kind: "graph-validation-failed",
      intensity: "high",
      source: "integrations/topology.ts:viewTopology",
    });
  }

  return { topology, signals };
}
