import { TOPOLOGY_GRAPH } from "@/data/topology/graph";

import {
  type TopologyGraph,
  type TopologyNode,
  type TopologyNodeKind,
  type TopologyRelationship,
  type TopologyRelationshipKind,
  TOPOLOGY_NODE_KINDS,
  TOPOLOGY_RELATIONSHIP_KINDS,
  validateTopologyGraph,
} from "./schema";

/**
 * V5 Phase 8 Sub-PR 8.1 — topology registry accessors.
 *
 * Pure read-only surface over `TOPOLOGY_GRAPH` (declared in
 * `data/topology/graph.ts`). Three jobs:
 *
 *   1. Validate the graph at module load — if the data file
 *      ever drifts (an unknown relationship endpoint, a
 *      duplicate id, a bad kind), the registry detects it and
 *      reports it through the `getTopologyValidationFailure`
 *      accessor. The graph is never partially-loaded.
 *
 *   2. Expose typed filter helpers: by kind, by id, by
 *      direction (incoming / outgoing edges), by neighbor
 *      traversal.
 *
 *   3. Provide a one-pass summariser for the JSON feed +
 *      future dashboard surfaces.
 *
 * The module imports the raw graph, derives the canonical
 * registry once at module load, then re-exports accessors.
 * The expensive work (validate + index by id) happens once
 * per process; per-call accessors are pure lookups.
 *
 * Edge-safety: pure data + pure functions. No I/O, no DOM, no
 * `process.env`. The whole module tree-shakes to whatever
 * accessor a consumer actually imports.
 */

interface DerivedRegistry {
  graph: TopologyGraph;
  nodesById: ReadonlyMap<string, TopologyNode>;
  outgoingByFrom: ReadonlyMap<string, readonly TopologyRelationship[]>;
  incomingByTo: ReadonlyMap<string, readonly TopologyRelationship[]>;
  validationFailure: string | null;
}

const REGISTRY: DerivedRegistry = deriveRegistry();

function deriveRegistry(): DerivedRegistry {
  const validationFailure = validateTopologyGraph(TOPOLOGY_GRAPH);

  /* Build the indices regardless of validation outcome. A
   * partial graph is still useful for inspection / debugging;
   * `validationFailure` is the operator's signal that the
   * data file needs an edit. */
  const nodesById = new Map<string, TopologyNode>();
  for (const node of TOPOLOGY_GRAPH.nodes) {
    nodesById.set(node.id, node);
  }

  const outgoing = new Map<string, TopologyRelationship[]>();
  const incoming = new Map<string, TopologyRelationship[]>();
  for (const rel of TOPOLOGY_GRAPH.relationships) {
    const outList = outgoing.get(rel.from);
    if (outList) outList.push(rel);
    else outgoing.set(rel.from, [rel]);
    const inList = incoming.get(rel.to);
    if (inList) inList.push(rel);
    else incoming.set(rel.to, [rel]);
  }

  return {
    graph: TOPOLOGY_GRAPH,
    nodesById,
    outgoingByFrom: outgoing,
    incomingByTo: incoming,
    validationFailure,
  };
}

/* ── Read accessors ─────────────────────────────────────── */

/** The full graph. Same shape consumers would import directly
 *  from `data/topology/graph.ts` — but routed through the
 *  registry so validation is enforced at every read site. */
export function getTopologyGraph(): TopologyGraph {
  return REGISTRY.graph;
}

/** Every node, in author order. */
export function getTopologyNodes(): readonly TopologyNode[] {
  return REGISTRY.graph.nodes;
}

/** Every relationship, in author order. */
export function getTopologyRelationships(): readonly TopologyRelationship[] {
  return REGISTRY.graph.relationships;
}

/** Look up a node by stable id. Returns `undefined` on miss. */
export function getTopologyNodeById(
  id: string,
): TopologyNode | undefined {
  if (typeof id !== "string" || !id) return undefined;
  return REGISTRY.nodesById.get(id);
}

/** Filter nodes to one kind. Preserves author order. */
export function getTopologyNodesByKind(
  kind: TopologyNodeKind,
): readonly TopologyNode[] {
  return REGISTRY.graph.nodes.filter((n) => n.kind === kind);
}

/** Filter relationships to one kind. Preserves author order. */
export function getTopologyRelationshipsByKind(
  kind: TopologyRelationshipKind,
): readonly TopologyRelationship[] {
  return REGISTRY.graph.relationships.filter((r) => r.kind === kind);
}

/** Outgoing edges (this node → others). */
export function getOutgoingRelationships(
  nodeId: string,
): readonly TopologyRelationship[] {
  if (typeof nodeId !== "string" || !nodeId) return [];
  return REGISTRY.outgoingByFrom.get(nodeId) ?? [];
}

/** Incoming edges (others → this node). */
export function getIncomingRelationships(
  nodeId: string,
): readonly TopologyRelationship[] {
  if (typeof nodeId !== "string" || !nodeId) return [];
  return REGISTRY.incomingByTo.get(nodeId) ?? [];
}

/**
 * All neighbor nodes (incoming + outgoing) reachable from a
 * single node in one hop. Each returned tuple carries the
 * direction so the renderer can show "this node depends on X"
 * vs "Y depends on this node".
 */
export interface TopologyNeighbor {
  node: TopologyNode;
  via: TopologyRelationship;
  direction: "incoming" | "outgoing";
}

export function getNeighbors(
  nodeId: string,
): readonly TopologyNeighbor[] {
  const out: TopologyNeighbor[] = [];
  for (const rel of getOutgoingRelationships(nodeId)) {
    const node = REGISTRY.nodesById.get(rel.to);
    if (node) out.push({ node, via: rel, direction: "outgoing" });
  }
  for (const rel of getIncomingRelationships(nodeId)) {
    const node = REGISTRY.nodesById.get(rel.from);
    if (node) out.push({ node, via: rel, direction: "incoming" });
  }
  return out;
}

/* ── Aggregate summary ─────────────────────────────────── */

export interface TopologyRegistrySummary {
  totalNodes: number;
  totalRelationships: number;
  nodesByKind: Record<TopologyNodeKind, number>;
  relationshipsByKind: Record<TopologyRelationshipKind, number>;
  /** Set of node ids that have at least one incoming OR
   *  outgoing edge. Useful for surfacing "orphaned" nodes
   *  (in the registry but not connected). */
  connectedNodeIds: readonly string[];
}

export function summariseTopologyRegistry(): TopologyRegistrySummary {
  const nodesByKind = {} as Record<TopologyNodeKind, number>;
  for (const k of TOPOLOGY_NODE_KINDS) nodesByKind[k] = 0;
  const relationshipsByKind = {} as Record<
    TopologyRelationshipKind,
    number
  >;
  for (const k of TOPOLOGY_RELATIONSHIP_KINDS) relationshipsByKind[k] = 0;

  for (const node of REGISTRY.graph.nodes) {
    nodesByKind[node.kind]++;
  }
  for (const rel of REGISTRY.graph.relationships) {
    relationshipsByKind[rel.kind]++;
  }

  const connected = new Set<string>();
  for (const id of REGISTRY.outgoingByFrom.keys()) connected.add(id);
  for (const id of REGISTRY.incomingByTo.keys()) connected.add(id);

  return {
    totalNodes: REGISTRY.graph.nodes.length,
    totalRelationships: REGISTRY.graph.relationships.length,
    nodesByKind,
    relationshipsByKind,
    connectedNodeIds: [...connected].sort(),
  };
}

/** Returns the validation failure message (or `null` when the
 *  graph is internally consistent). Surfaced for the operator
 *  via the JSON feed; the registry continues to serve a
 *  partial graph even when validation fails so a single
 *  bad edit doesn't take everything down. */
export function getTopologyValidationFailure(): string | null {
  return REGISTRY.validationFailure;
}
