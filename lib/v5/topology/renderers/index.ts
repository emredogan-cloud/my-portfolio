/**
 * V5 Phase 8 Sub-PR 8.2 — topology renderer barrel.
 *
 * Re-exports the public surface of the renderer foundation:
 *   - The selector + kind type (`./select`)
 *   - The renderer kind constants (`SVG_RENDERER_KIND`,
 *     `THREE_RENDERER_KIND`)
 *
 * Note: this barrel does NOT re-export the renderer components
 * themselves. Consumers should import them via `next/dynamic`
 * to keep three.js + the SVG renderer's chunk out of the
 * default bundle:
 *
 *   const SVGRenderer = dynamic(
 *     () => import("@/lib/v5/topology/renderers/svg-renderer"),
 *     { ssr: true },
 *   );
 *
 *   const ThreeRenderer = dynamic(
 *     () => import("@/lib/v5/topology/renderers/three-renderer"),
 *     { ssr: false },
 *   );
 *
 * The route-quarantine pattern keeps Phase 8.2's foundation
 * tree-shaken from every existing route. The Three.js renderer
 * is a `"use client"` module; it can't render on the server.
 * The SVG renderer is server-renderable and is the canonical
 * SSR path.
 */

export {
  TOPOLOGY_RENDERER_KINDS,
  SHIPPED_RENDERER_KINDS,
  selectTopologyRendererKind,
  resolveShippedRendererKind,
  type TopologyRendererKind,
} from "./select";

/* Note: the renderer-module exports (SVGTopologyRenderer,
 * ThreeTopologyRenderer) are intentionally NOT re-exported
 * here. Re-exporting them would pull the renderer chunks
 * into any consumer of this barrel. Import the renderer
 * components directly + lazily via `next/dynamic`:
 *
 *   import dynamic from "next/dynamic";
 *
 *   const SVGRenderer = dynamic(
 *     () => import("@/lib/v5/topology/renderers/svg-renderer"),
 *     { ssr: true },
 *   );
 *
 *   const ThreeRenderer = dynamic(
 *     () => import("@/lib/v5/topology/renderers/three-renderer"),
 *     { ssr: false },
 *   );
 */
