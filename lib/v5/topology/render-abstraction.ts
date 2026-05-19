import { getTopologyGraph } from "./registry";
import type {
  TopologyGraph,
  TopologyNodeKind,
  TopologyRelationshipKind,
} from "./schema";

/**
 * V5 Phase 8 Sub-PR 8.1 — render-safe topology abstraction.
 *
 * The user's Phase 8 brief is explicit:
 *
 *   > SAFE RENDERING LAW
 *   > You MUST create:
 *   > render-safe abstraction ONLY.
 *   > Meaning:
 *   > future renderers
 *   > (WebGL / Canvas / SVG / DOM)
 *   > must be able to consume
 *   > the SAME topology registry.
 *   > But:
 *   > NO renderer implementation now.
 *
 * This module is THE CONTRACT a future Phase 8.2+ renderer
 * implements. Three pieces:
 *
 *   1. `RenderableNode` / `RenderableEdge` / `RenderableTopology`
 *      — the renderer-facing shape. Smaller surface than the
 *      internal `TopologyNode` / `TopologyRelationship` —
 *      drops optional metadata the renderer doesn't strictly
 *      need (source_path, evolution_event_ids, etc.) into a
 *      flat `metadata` map that any renderer can ignore or
 *      surface.
 *   2. `toRenderable(graph)` — the mapper from the internal
 *      shape to the renderer-facing shape. Pure; deterministic.
 *      A consumer can call this once and pass the result to
 *      any renderer.
 *   3. `TopologyRenderer` interface + `RendererHandle` — the
 *      contract a renderer satisfies. `mount(host, graph)`
 *      attaches the renderer to a DOM element; the returned
 *      handle has `destroy()`. No assumption about WebGL /
 *      Canvas / SVG / DOM — each is a valid implementation.
 *
 * What this module is NOT
 *   - It is NOT a renderer. No DOM access, no `document`
 *     references, no canvas creation, no Three.js / xyflow /
 *     d3 imports.
 *   - It does NOT compute layout. Positioning is a renderer
 *     concern; the abstraction passes the topology data
 *     untouched.
 *
 * Phase 8 cognition note
 *   The contract is deliberately minimal. A future renderer
 *   adds visual treatment + interaction behavior + layout
 *   computation; this module only guarantees that whatever
 *   shape the renderer wants to consume, it receives the same
 *   schema-validated content. Two renderers (a 3D WebGL
 *   spectacle for Phase 8.2 + a static SVG fallback for
 *   reduced-motion) can read the SAME RenderableTopology.
 *
 * Edge-safety: pure functions, no DOM, no globals.
 */

/**
 * Renderer-facing node shape. Smaller than `TopologyNode` —
 * the renderer needs the id, kind, and label to render; the
 * description + cross-system bindings live in `metadata` for
 * renderers that want to surface them as tooltips / detail
 * panels.
 */
export interface RenderableNode {
  id: string;
  kind: TopologyNodeKind;
  label: string;
  /** Free-form metadata bag. Keys the renderer may read:
   *    - `description` — one-sentence editorial gloss
   *    - `system` — parent system slug
   *    - `version` — version identifier
   *    - `href` — public URL for the node
   *    - `source_path` — repo-relative source file path
   *    - `evolution_event_ids` — comma-joined event ids
   *    - `perception_categories` — comma-joined categories
   *  A renderer that doesn't care about any given key can
   *  ignore it. All values are strings (or undefined) so the
   *  shape stays JSON-serialisable. */
  metadata: Readonly<Record<string, string | undefined>>;
}

/**
 * Renderer-facing edge shape. Same minimal surface as
 * RenderableNode.
 */
export interface RenderableEdge {
  id: string;
  kind: TopologyRelationshipKind;
  from: string;
  to: string;
  metadata: Readonly<Record<string, string | undefined>>;
}

/**
 * The full renderable shape. Passed to any renderer.
 */
export interface RenderableTopology {
  nodes: readonly RenderableNode[];
  edges: readonly RenderableEdge[];
}

/**
 * Map the internal topology graph to its renderer-facing
 * shape. Pure: no side effects, no I/O, no DOM. The
 * cross-system bindings (`evolution_event_ids`,
 * `perception_categories`) are serialised as comma-joined
 * strings in `metadata` so the renderer-facing shape stays
 * flat — a renderer that wants to enrich them re-imports
 * the link helpers and resolves.
 *
 * Accepts an optional `graph` argument; defaults to the
 * canonical registry. Tests can pass synthetic graphs.
 */
export function toRenderable(graph?: TopologyGraph): RenderableTopology {
  const source = graph ?? getTopologyGraph();
  const nodes: RenderableNode[] = source.nodes.map((node) => ({
    id: node.id,
    kind: node.kind,
    label: node.label,
    metadata: {
      description: node.description,
      system: node.system,
      version: node.version,
      href: node.href,
      source_path: node.source_path,
      evolution_event_ids:
        node.evolution_event_ids && node.evolution_event_ids.length > 0
          ? node.evolution_event_ids.join(",")
          : undefined,
      perception_categories:
        node.perception_categories && node.perception_categories.length > 0
          ? node.perception_categories.join(",")
          : undefined,
    },
  }));
  const edges: RenderableEdge[] = source.relationships.map((rel) => ({
    id: rel.id,
    kind: rel.kind,
    from: rel.from,
    to: rel.to,
    metadata: {
      description: rel.description,
    },
  }));
  return { nodes, edges };
}

/**
 * Renderer lifecycle contract. The future Phase 8.2+
 * renderer(s) satisfy this interface.
 *
 *   kind        — a short identifier the operator uses to
 *                 distinguish implementations ("webgl",
 *                 "three-fiber", "svg", "dom-text").
 *   mount(...)  — attach the renderer to a DOM element.
 *                 Returns a handle the consumer holds for
 *                 cleanup. The implementation owns all of
 *                 its own resource cleanup; `destroy()` is
 *                 the only contract the consumer enforces.
 *
 * Why an interface and not a base class
 *   - Each renderer brings its own dependencies (Three.js,
 *     @xyflow/react, d3, whatever). A base class would
 *     force common imports.
 *   - The interface is the smallest surface a Phase 8.2
 *     renderer needs to satisfy. Phase 8.3+ may extend the
 *     surface (a `setHighlight(id)` method, say) — but the
 *     core `mount` + `destroy` pair stays stable.
 */
export interface TopologyRenderer {
  readonly kind: string;
  mount(host: HTMLElement, graph: RenderableTopology): RendererHandle;
}

/** The handle returned by a renderer's `mount`. Owns the
 *  lifecycle teardown. Must be idempotent — multiple
 *  `destroy()` calls are safe. */
export interface RendererHandle {
  destroy(): void;
}
