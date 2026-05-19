/**
 * V5 Phase 8 Sub-PR 8.1 — topology intelligence schema.
 *
 * Phase 8 turns the ecosystem from a collection of surfaces into
 * a self-aware system that can describe its OWN architecture.
 * Topology is not decoration; it is engineering cognition —
 * relationships, dependencies, evolution, operational context.
 *
 * Sub-PR 8.1 ships ONLY the schema + the registry + the
 * cross-system bindings + the telemetry hash + a render-safe
 * abstraction the future Phase 8.2+ renderers will consume.
 * Zero visual surface area. Zero WebGL. Zero canvas. Zero
 * client rendering. The brain, not the body.
 *
 * Contract:
 *   1. A closed allow-list of NODE KINDS — the 9 axes a topology
 *      entity can sit on. Anything outside this list cannot enter
 *      the registry.
 *   2. A closed allow-list of RELATIONSHIP KINDS — the 7 verbs
 *      the registry permits between nodes.
 *   3. The TopologyNode + TopologyRelationship + TopologyGraph
 *      shapes themselves. Stable kebab-case ids; optional
 *      back-links to the temporal registry (`evolution_event_ids`)
 *      and the perception layer (`perception_categories`).
 *   4. Type guards + runtime validators for both shapes plus
 *      whole-graph integrity checks (relationships reference
 *      known nodes; ids are unique).
 *
 * What this module is NOT
 *   - It is NOT a renderer. UI / WebGL / canvas / SVG layers
 *     ship in Phase 8.2+; this module is render-agnostic.
 *   - It is NOT a fetcher. There is no I/O on this path; the
 *     graph is a typed static array imported at build time from
 *     `data/topology/graph.ts`.
 *   - It is NOT a telemetry hook. KV writes live in
 *     `lib/v5/topology/telemetry.ts`.
 *
 * Edge-safety: pure data + pure functions, no module-scope side
 * effects, no imports beyond TypeScript types. Safe to load
 * from any runtime — edge, node, browser, build-time, test.
 *
 * Phase 8 philosophy enforcement (V5 § 4.3 + user brief)
 *   The schema is deliberately MECHANICAL. No `mood`, no `vibe`,
 *   no `theme`, no aesthetic flags. The 9 + 7 axes are
 *   architectural categories the operator would name in a system
 *   diagram, not narrative ones. The future renderer will decide
 *   visual treatment; the schema does not bias it.
 */

/**
 * The closed allow-list of topology node kinds. Each kind is a
 * single architectural axis the registry indexes on. The list is
 * deliberately small — the user's Phase 8 brief defines exactly
 * these nine.
 *
 *   system        — a top-level platform surface (the portfolio
 *                   itself, /lab, /playground, /evolution).
 *   project       — a production project (cloud-waste-hunter,
 *                   vibing-coder-ai, etc.). Aligns with project
 *                   ids in `data/projects.ts`.
 *   phase         — a development phase (V4 Phase 4, V5 Phase 7,
 *                   etc.). Aligns with the temporal registry's
 *                   `version` slot.
 *   architecture  — a system architecture (the 3D AWS topology
 *                   engine, the ScrollStory engine). Distinct
 *                   from `system` — architectures POWER systems.
 *   tool          — a Lumina tool or lab experiment surface
 *                   (iam-translator, prompt-rescuer,
 *                   readSourceFile).
 *   memory        — memory subsystem (Lumina memory layer, the
 *                   per-session pages index from Phase 6.4).
 *   telemetry     — a telemetry subsystem (perception layer,
 *                   timeline engagement, playback adoption).
 *   lab           — lab experiment node (mirrors `tool` but
 *                   typed distinctly for surface-vs-tool
 *                   queries).
 *   evolution     — pointer to an evolution event in the
 *                   temporal registry. Used when a topology
 *                   relationship needs to terminate at a moment
 *                   in time rather than a system.
 */
export const TOPOLOGY_NODE_KINDS = [
  "system",
  "project",
  "phase",
  "architecture",
  "tool",
  "memory",
  "telemetry",
  "lab",
  "evolution",
] as const;

export type TopologyNodeKind = (typeof TOPOLOGY_NODE_KINDS)[number];

const NODE_KIND_SET: ReadonlySet<string> = new Set(TOPOLOGY_NODE_KINDS);

/** Return true when `value` is a registered node kind. */
export function isTopologyNodeKind(
  value: unknown,
): value is TopologyNodeKind {
  return typeof value === "string" && NODE_KIND_SET.has(value);
}

/**
 * The closed allow-list of topology relationship kinds. Seven
 * verbs the registry permits between nodes — exactly the set
 * named in the Phase 8 brief.
 *
 *   depends_on    — strong dependency. A's existence is
 *                   conditional on B's.
 *   evolved_into  — succession. A was replaced or extended by B.
 *                   Both nodes remain in the graph; the verb is
 *                   the historical link.
 *   powers        — composition / enablement. A is part of /
 *                   makes B possible.
 *   observes      — telemetry / read relationship. A consumes
 *                   signal about B.
 *   introduced    — a phase introduced a system. Usually
 *                   from-side is a `phase` node.
 *   influences    — soft / cultural / design-language link.
 *                   Weaker than `depends_on`.
 *   related_to    — weak association. The catch-all when none of
 *                   the other six fits but a connection deserves
 *                   recording.
 */
export const TOPOLOGY_RELATIONSHIP_KINDS = [
  "depends_on",
  "evolved_into",
  "powers",
  "observes",
  "introduced",
  "influences",
  "related_to",
] as const;

export type TopologyRelationshipKind =
  (typeof TOPOLOGY_RELATIONSHIP_KINDS)[number];

const REL_KIND_SET: ReadonlySet<string> = new Set(
  TOPOLOGY_RELATIONSHIP_KINDS,
);

/** Return true when `value` is a registered relationship kind. */
export function isTopologyRelationshipKind(
  value: unknown,
): value is TopologyRelationshipKind {
  return typeof value === "string" && REL_KIND_SET.has(value);
}

/* ── Node + relationship shapes ─────────────────────────── */

/**
 * The canonical topology node shape. Every entry in the
 * registry conforms to this interface.
 *
 * Stability invariants
 *   - `id` is the URL anchor / React key / persistent
 *     identifier. Once external code references an id, it
 *     should not change.
 *   - `kind` is one of the 9 closed values above.
 *   - `label` is the short editorial title; `description` is
 *     one declarative sentence.
 *
 * Optional fields
 *   - `system` — back-reference to the parent system slug
 *     (for projects, tools, subsystems).
 *   - `version` — free-form version identifier (semver,
 *     phase identifier). Aligns with the temporal registry's
 *     `version` field.
 *   - `href` — public URL where this node is observable
 *     (e.g. `/lab/iam-translator`).
 *   - `source_path` — repo-relative path of the implementing
 *     code. Lets the future renderer cross-link to GitHub.
 *   - `evolution_event_ids` — back-links into the Phase 7
 *     temporal registry. A `phase` node's events; an
 *     `architecture` node's introduction event; etc.
 *   - `perception_categories` — back-links into Phase 6's
 *     perception layer. A `telemetry` node's category subset;
 *     an `architecture` node's observed perception buckets.
 *
 * Phase 8 cognition note
 *   The optional cross-system fields are the load-bearing
 *   part of the schema. They turn the topology from a flat
 *   diagram into a graph whose nodes can answer:
 *     "When was I introduced?" → evolution_event_ids
 *     "What observation feeds me?" → perception_categories
 *   The future renderer reads both to compose richer node
 *   detail surfaces.
 */
export interface TopologyNode {
  id: string;
  kind: TopologyNodeKind;
  label: string;
  description: string;
  system?: string;
  version?: string;
  href?: string;
  source_path?: string;
  evolution_event_ids?: readonly string[];
  perception_categories?: readonly string[];
}

/**
 * The canonical topology relationship shape. Each edge is a
 * (kind, from, to) tuple with an optional one-line description.
 *
 *   id     — stable, kebab-case. Derivable from
 *            `<from>--<kind>--<to>` but explicit so renderers
 *            can use it as a React key directly.
 *   kind   — one of the 7 verbs.
 *   from   — node id (the source end of the edge).
 *   to     — node id (the target end).
 *   description — optional editorial gloss; rendered as a
 *            tooltip / inline annotation when the renderer
 *            supports it.
 */
export interface TopologyRelationship {
  id: string;
  kind: TopologyRelationshipKind;
  from: string;
  to: string;
  description?: string;
}

/**
 * The full graph — nodes + relationships. Authored as a single
 * static array in `data/topology/graph.ts`; the registry
 * derives this shape and freezes it at module load.
 */
export interface TopologyGraph {
  nodes: readonly TopologyNode[];
  relationships: readonly TopologyRelationship[];
}

/* ── ID validators ─────────────────────────────────────── */

/** True when `value` is a syntactically-valid kebab-case id.
 *  Mirrors the temporal schema's id pattern so the two
 *  registries can cross-reference without normalisation. */
const ID_PATTERN = /^[a-z0-9][a-z0-9-]{1,79}$/;

export function isValidTopologyId(value: unknown): value is string {
  return typeof value === "string" && ID_PATTERN.test(value);
}

/* ── Runtime validators ────────────────────────────────── */

/**
 * Validate a single topology node. Returns the failed field
 * name on first violation, `null` when well-formed. Used by
 * the graph derive pass + by the JSON-feed endpoint as a
 * defence-in-depth gate.
 */
export function validateTopologyNode(node: unknown): string | null {
  if (node === null || typeof node !== "object") return "node";
  const n = node as Partial<TopologyNode>;
  if (!isValidTopologyId(n.id)) return "id";
  if (!isTopologyNodeKind(n.kind)) return "kind";
  if (typeof n.label !== "string" || !n.label) return "label";
  if (typeof n.description !== "string" || !n.description) {
    return "description";
  }
  if (n.system !== undefined && (typeof n.system !== "string" || !n.system)) {
    return "system";
  }
  if (n.version !== undefined && (typeof n.version !== "string" || !n.version)) {
    return "version";
  }
  if (n.href !== undefined && (typeof n.href !== "string" || !n.href)) {
    return "href";
  }
  if (
    n.source_path !== undefined &&
    (typeof n.source_path !== "string" || !n.source_path)
  ) {
    return "source_path";
  }
  if (n.evolution_event_ids !== undefined) {
    if (!Array.isArray(n.evolution_event_ids)) return "evolution_event_ids";
    for (const id of n.evolution_event_ids) {
      if (typeof id !== "string" || !id) return "evolution_event_ids";
    }
  }
  if (n.perception_categories !== undefined) {
    if (!Array.isArray(n.perception_categories)) {
      return "perception_categories";
    }
    for (const cat of n.perception_categories) {
      if (typeof cat !== "string" || !cat) return "perception_categories";
    }
  }
  return null;
}

/**
 * Validate a single topology relationship. Returns the failed
 * field name on first violation, `null` when well-formed.
 * Does NOT verify that `from` / `to` reference known nodes —
 * that integrity check lives in `validateTopologyGraph` below
 * where the node set is available.
 */
export function validateTopologyRelationship(rel: unknown): string | null {
  if (rel === null || typeof rel !== "object") return "relationship";
  const r = rel as Partial<TopologyRelationship>;
  if (!isValidTopologyId(r.id)) return "id";
  if (!isTopologyRelationshipKind(r.kind)) return "kind";
  if (!isValidTopologyId(r.from)) return "from";
  if (!isValidTopologyId(r.to)) return "to";
  if (r.from === r.to) return "from-to-self-loop";
  if (
    r.description !== undefined &&
    (typeof r.description !== "string" || !r.description)
  ) {
    return "description";
  }
  return null;
}

/**
 * Whole-graph integrity check. Verifies node-shape, relationship-
 * shape, uniqueness of ids, and that every relationship endpoint
 * references a known node. Returns the failure description on
 * first violation, `null` when the graph is internally
 * consistent.
 */
export function validateTopologyGraph(graph: unknown): string | null {
  if (graph === null || typeof graph !== "object") return "graph";
  const g = graph as Partial<TopologyGraph>;
  if (!Array.isArray(g.nodes)) return "nodes";
  if (!Array.isArray(g.relationships)) return "relationships";

  const seenNodeIds = new Set<string>();
  for (const node of g.nodes) {
    const fail = validateTopologyNode(node);
    if (fail !== null) return `nodes.${fail}`;
    const id = (node as TopologyNode).id;
    if (seenNodeIds.has(id)) return `nodes.duplicate:${id}`;
    seenNodeIds.add(id);
  }

  const seenRelIds = new Set<string>();
  for (const rel of g.relationships) {
    const fail = validateTopologyRelationship(rel);
    if (fail !== null) return `relationships.${fail}`;
    const r = rel as TopologyRelationship;
    if (seenRelIds.has(r.id)) return `relationships.duplicate:${r.id}`;
    if (!seenNodeIds.has(r.from)) {
      return `relationships.from-unknown:${r.id}`;
    }
    if (!seenNodeIds.has(r.to)) {
      return `relationships.to-unknown:${r.id}`;
    }
    seenRelIds.add(r.id);
  }

  return null;
}
