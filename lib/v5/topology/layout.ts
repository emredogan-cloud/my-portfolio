import type { TopologyNodeKind } from "./schema";
import type { RenderableNode, RenderableTopology } from "./render-abstraction";

/**
 * V5 Phase 8 Sub-PR 8.2 — deterministic topology layout.
 *
 * The user's Phase 8 brief forbids graph engines:
 *
 *   > NO:
 *   > * d3
 *   > * graph engines
 *   > * force simulations
 *   > * WebGL libraries
 *   > * heavyweight dependencies
 *
 * This module ships a pure-function deterministic layout that
 * arranges the 22-node topology by KIND, in concentric rings.
 * No force simulation, no Fruchterman-Reingold, no random
 * jitter, no animation. Same input always produces identical
 * positions.
 *
 * Layout principle: by KIND, not by graph topology
 *   The 9 node kinds have a natural hierarchy: `system` at the
 *   center (the umbrella), `phase` and `architecture` on the
 *   first ring (the time + structure axes), `project` and
 *   `lab` on the second ring (the surfaces), `tool` /
 *   `memory` / `telemetry` / `evolution` on the third ring
 *   (the subsystems). Each ring is divided evenly among the
 *   nodes of its kind.
 *
 * Why kind-based layout instead of force-directed
 *   - Force-directed layouts are emergent — the same graph
 *     can produce different layouts on different runs without
 *     a fixed seed. Phase 8's renderer must be deterministic
 *     so the same visitor sees the same arrangement every
 *     mount; force-directed defeats this.
 *   - Force-directed layouts cost CPU. The user's brief
 *     forbids "runtime-heavy computation". Kind-based layout
 *     is O(n) per render and O(1) per call.
 *   - The 9-kind axis is THE editorial hierarchy of the
 *     ecosystem. Forcing the graph to express it is honest;
 *     letting forces emerge is decorative.
 *
 * Edge-safety: pure math + pure data, no DOM, no I/O.
 */

/** A 3D position in the layout's coordinate space.
 *  - x / z extend in the ground plane (renderer's horizontal).
 *  - y is "elevation" — used by 3D renderers as the vertical
 *    axis. 2D / SVG renderers project to (x, z) and ignore y.
 *  Coordinates are normalised: the unit ring is radius 1.0;
 *  outer rings extend to radius ~3. The renderer applies its
 *  own scale factor. */
export interface LayoutPosition {
  x: number;
  y: number;
  z: number;
}

/** A node + its computed position. The renderer reads this
 *  list directly. */
export interface LayoutNode {
  node: RenderableNode;
  position: LayoutPosition;
  /** The ring index this node was placed on. Renderers can
   *  use the ring to vary visual treatment (label size /
   *  sphere radius / edge thickness). */
  ring: number;
}

/** An edge expressed in terms of its from/to layout
 *  positions AND the node ids it connects. Renderers can use
 *  either coordinate-based lookup (for 2D static drawing) or
 *  id-based lookup (for interactive 3D where node positions
 *  are projected to a different world space). */
export interface LayoutEdge {
  id: string;
  fromId: string;
  toId: string;
  from: LayoutPosition;
  to: LayoutPosition;
  /** Same kind as the source `TopologyRelationship.kind`,
   *  re-exposed so renderers can colour by verb. */
  kind: string;
}

export interface LayoutResult {
  nodes: readonly LayoutNode[];
  edges: readonly LayoutEdge[];
}

/* Ring assignment table — each node kind maps to a single
 * ring index (0 = centre). The user's 9 kinds + an implicit
 * "evolution" outer cohort. */
const KIND_TO_RING: Record<TopologyNodeKind, number> = {
  system: 0,
  phase: 1,
  architecture: 1,
  project: 2,
  lab: 2,
  tool: 3,
  memory: 3,
  telemetry: 3,
  evolution: 3,
};

/* Ring radii (in normalised units). Ring 0 is the centre cluster;
 * subsequent rings expand outward. Wide enough that label collisions
 * are rare at the seed registry's size; the renderer applies its
 * own scale factor. */
const RING_RADII: readonly number[] = [0.0, 1.2, 2.4, 3.5];

/* Ring elevation offsets (the y-axis component). The centre
 * sits at y = 0; outer rings dip slightly below to create a
 * subtle "ground plane" effect for the 3D renderer. The SVG
 * renderer ignores y. */
const RING_ELEVATIONS: readonly number[] = [0.0, -0.1, -0.2, -0.3];

/**
 * Layout the topology graph deterministically.
 *
 * Algorithm:
 *   1. Group nodes by their kind's ring assignment.
 *   2. Within each ring, sort nodes lexicographically by id.
 *      Determinism: same input always yields same ordering.
 *   3. Place each ring's nodes evenly around a circle of the
 *      ring's radius. The first node of each ring starts at
 *      angle 0 (pointing along +x).
 *   4. For each edge, look up the from/to positions and emit
 *      a LayoutEdge.
 *
 * Returns a fresh LayoutResult; safe to call repeatedly. The
 * computation cost is O(n + e) — well below any meaningful
 * frame budget at 22 nodes + 28 edges.
 */
export function layoutTopology(
  renderable: RenderableTopology,
): LayoutResult {
  /* Step 1 + 2: bucket nodes by ring, then sort within each
   * bucket by id. */
  const ringBuckets: RenderableNode[][] = [[], [], [], []];
  for (const node of renderable.nodes) {
    const ring = KIND_TO_RING[node.kind] ?? 3;
    ringBuckets[ring].push(node);
  }
  for (const bucket of ringBuckets) {
    bucket.sort((a, b) =>
      a.id < b.id ? -1 : a.id > b.id ? 1 : 0,
    );
  }

  /* Step 3: place each node on its ring's circle. */
  const layoutNodes: LayoutNode[] = [];
  const positionById = new Map<string, LayoutPosition>();
  for (let ring = 0; ring < ringBuckets.length; ring++) {
    const bucket = ringBuckets[ring];
    const radius = RING_RADII[ring] ?? RING_RADII[RING_RADII.length - 1];
    const elevation =
      RING_ELEVATIONS[ring] ??
      RING_ELEVATIONS[RING_ELEVATIONS.length - 1];

    if (bucket.length === 0) continue;

    /* Special case: ring 0 (centre) collapses to (0, 0, 0)
     * when there's exactly one node. Multiple centre nodes
     * (if the operator ever adds them) tightly cluster. */
    if (ring === 0 && bucket.length === 1) {
      const node = bucket[0];
      const pos: LayoutPosition = { x: 0, y: elevation, z: 0 };
      layoutNodes.push({ node, position: pos, ring });
      positionById.set(node.id, pos);
      continue;
    }

    const angleStep = (2 * Math.PI) / bucket.length;
    /* Stagger every other ring by half a step so the radial
     * lines from centre don't visually align across rings —
     * gives a more "diagram" feel and reduces label collision
     * at small viewports. */
    const angleOffset = ring % 2 === 0 ? 0 : angleStep / 2;
    for (let i = 0; i < bucket.length; i++) {
      const angle = angleOffset + i * angleStep;
      const node = bucket[i];
      const pos: LayoutPosition = {
        x: Math.cos(angle) * radius,
        y: elevation,
        z: Math.sin(angle) * radius,
      };
      layoutNodes.push({ node, position: pos, ring });
      positionById.set(node.id, pos);
    }
  }

  /* Step 4: edges. Drop any whose endpoint isn't placed
   * (defensive — the registry validator should have caught
   * unknown endpoints already). */
  const layoutEdges: LayoutEdge[] = [];
  for (const edge of renderable.edges) {
    const from = positionById.get(edge.from);
    const to = positionById.get(edge.to);
    if (!from || !to) continue;
    layoutEdges.push({
      id: edge.id,
      fromId: edge.from,
      toId: edge.to,
      from,
      to,
      kind: edge.kind,
    });
  }

  return { nodes: layoutNodes, edges: layoutEdges };
}
