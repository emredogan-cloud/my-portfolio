import { layoutTopology, type LayoutPosition } from "../layout";
import type { RenderableTopology } from "../render-abstraction";
import type {
  TopologyNodeKind,
  TopologyRelationshipKind,
} from "../schema";

/**
 * V5 Phase 8 Sub-PR 8.2 — SVG topology renderer.
 *
 * The always-functional fallback. Pure JSX SVG; server-
 * renderable; static (no animation, no client JS, no
 * Three.js bundle). The renderer the selector returns when:
 *   - The OS reduced-motion preference is set.
 *   - The viewport is below the mobile breakpoint.
 *   - The Three.js / WebGPU path is otherwise unavailable.
 *
 * Phase 8 cognition note
 *   This is the renderer crawlers see. A search engine
 *   indexing the future `/v5/topology/<slug>` page sees the
 *   full graph as semantic SVG with `<title>` elements per
 *   node — every architectural identity is crawlable text.
 *   The Three.js path enhances post-hydration; the SVG path
 *   is the canonical content.
 *
 * Visual treatment
 *   - Black background (inherits from parent container).
 *   - #00d2ff accent on nodes + edges. Verb-based muted
 *     variations (depends_on / powers slightly brighter;
 *     influences / related_to softer).
 *   - White Geist-family text on labels.
 *   - Static positions from the deterministic layout.
 *   - No animation, no transition, no hover-driven motion.
 *
 * What this renderer is NOT
 *   - It is NOT interactive in 8.2. No click handlers, no
 *     hover state, no zoom/pan. Future Phase 8.x may add
 *     interaction at the same module without breaking the
 *     SSR contract.
 *
 * Edge-safety: pure JSX, no `useEffect`, no DOM access.
 * Renders identically on server + client.
 */

/* The viewBox is anchored at (0, 0) → (1000, 600) for a
 * cinematic 5:3 aspect. Layout coordinates are normalised
 * radii; we scale by `LAYOUT_SCALE` and translate to centre. */
const VIEWBOX_W = 1000;
const VIEWBOX_H = 600;
const LAYOUT_SCALE = 100;
const CENTRE_X = VIEWBOX_W / 2;
const CENTRE_Y = VIEWBOX_H / 2;

/* Node radius varies by ring (ring 0 = centre = largest). */
const NODE_RADIUS_BY_RING: readonly number[] = [14, 10, 8, 6];
const LABEL_OFFSET_BY_RING: readonly number[] = [22, 18, 14, 12];

/* Verb-based edge colours (cinematic restraint — all in the
 * cyan family, varying alpha + lightness only). */
const EDGE_STROKE_BY_KIND: Record<TopologyRelationshipKind, string> = {
  depends_on: "rgba(0, 210, 255, 0.55)",
  evolved_into: "rgba(0, 210, 255, 0.65)",
  powers: "rgba(0, 210, 255, 0.45)",
  observes: "rgba(0, 210, 255, 0.30)",
  introduced: "rgba(0, 210, 255, 0.50)",
  influences: "rgba(0, 210, 255, 0.22)",
  related_to: "rgba(0, 210, 255, 0.18)",
};

/* Node fill by kind. Same cyan family; we vary saturation +
 * lightness to give each ring a subtly different feel without
 * introducing a second hue. */
const NODE_FILL_BY_KIND: Record<TopologyNodeKind, string> = {
  system: "#00d2ff",
  phase: "rgba(0, 210, 255, 0.85)",
  architecture: "rgba(0, 210, 255, 0.75)",
  project: "rgba(0, 210, 255, 0.65)",
  lab: "rgba(0, 210, 255, 0.55)",
  tool: "rgba(0, 210, 255, 0.50)",
  memory: "rgba(0, 210, 255, 0.45)",
  telemetry: "rgba(0, 210, 255, 0.40)",
  evolution: "rgba(0, 210, 255, 0.35)",
};

interface SVGRendererProps {
  graph: RenderableTopology;
  /** Optional accessible label for the entire SVG. Renderer
   *  consumers should provide this so screen-reader users
   *  know what the graphic is. */
  ariaLabel?: string;
}

function projectXY(p: LayoutPosition): { cx: number; cy: number } {
  /* Project the layout's (x, z) ground plane into the SVG's
   * (x, y) viewBox. The y-axis (elevation) is dropped — SVG
   * is 2D. */
  return {
    cx: CENTRE_X + p.x * LAYOUT_SCALE,
    cy: CENTRE_Y + p.z * LAYOUT_SCALE,
  };
}

export default function SVGTopologyRenderer({
  graph,
  ariaLabel = "Engineering topology diagram",
}: SVGRendererProps) {
  const layout = layoutTopology(graph);

  return (
    <svg
      viewBox={`0 0 ${VIEWBOX_W} ${VIEWBOX_H}`}
      role="img"
      aria-label={ariaLabel}
      xmlns="http://www.w3.org/2000/svg"
      className="w-full h-auto select-none"
      preserveAspectRatio="xMidYMid meet"
    >
      {/* Background — pure black, matches the cinematic
          identity. Hosted in a <rect> rather than a CSS
          background so the SVG is self-contained when
          downloaded / printed. */}
      <rect
        width={VIEWBOX_W}
        height={VIEWBOX_H}
        fill="#000000"
      />

      {/* Subtle radial gradient at the centre — same
          atmospheric treatment as /lumina/brain and
          /v5/perception. */}
      <defs>
        <radialGradient
          id="topology-ambient-cyan"
          cx="50%"
          cy="50%"
          r="50%"
        >
          <stop offset="0%" stopColor="rgba(0, 210, 255, 0.08)" />
          <stop offset="70%" stopColor="rgba(0, 210, 255, 0.02)" />
          <stop offset="100%" stopColor="rgba(0, 210, 255, 0)" />
        </radialGradient>
      </defs>
      <rect
        width={VIEWBOX_W}
        height={VIEWBOX_H}
        fill="url(#topology-ambient-cyan)"
      />

      {/* EDGES — rendered first so nodes sit on top. */}
      <g aria-hidden="true">
        {layout.edges.map((edge) => {
          const fromXY = projectXY(edge.from);
          const toXY = projectXY(edge.to);
          const stroke =
            EDGE_STROKE_BY_KIND[
              edge.kind as TopologyRelationshipKind
            ] ?? "rgba(255, 255, 255, 0.1)";
          return (
            <line
              key={edge.id}
              x1={fromXY.cx}
              y1={fromXY.cy}
              x2={toXY.cx}
              y2={toXY.cy}
              stroke={stroke}
              strokeWidth={1}
            />
          );
        })}
      </g>

      {/* NODES — circles + labels. Each <g> carries a
          <title> child so hover (in browsers that surface it
          on SVG) reveals the description; screen readers
          enumerate it too. */}
      <g>
        {layout.nodes.map(({ node, position, ring }) => {
          const { cx, cy } = projectXY(position);
          const radius =
            NODE_RADIUS_BY_RING[ring] ??
            NODE_RADIUS_BY_RING[NODE_RADIUS_BY_RING.length - 1];
          const labelOffset =
            LABEL_OFFSET_BY_RING[ring] ??
            LABEL_OFFSET_BY_RING[LABEL_OFFSET_BY_RING.length - 1];
          const fill =
            NODE_FILL_BY_KIND[node.kind] ?? "rgba(255, 255, 255, 0.5)";
          return (
            <g key={node.id}>
              <title>{`${node.label} — ${node.kind}`}</title>
              <circle
                cx={cx}
                cy={cy}
                r={radius}
                fill={fill}
                stroke="#000000"
                strokeWidth={1.5}
              />
              <text
                x={cx}
                y={cy + radius + labelOffset}
                textAnchor="middle"
                fill="rgba(255, 255, 255, 0.75)"
                fontSize={10}
                fontFamily="var(--font-geist-sans), ui-sans-serif, system-ui"
                letterSpacing="0.04em"
              >
                {node.label}
              </text>
            </g>
          );
        })}
      </g>
    </svg>
  );
}

/** The renderer's kind identifier. Surfaced for consumers
 *  that want to log / instrument which path mounted. */
export const SVG_RENDERER_KIND = "svg" as const;
