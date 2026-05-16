"use client";

/**
 * HeroTopology — the home hero's right-column constellation.
 *
 * Dynamic node graph rooted at "Emre Doğan", orbited by three
 * concentric tiers (projects, focus areas, tech stack). Built on
 * @xyflow/react v12 — visitors can drag individual nodes, pan the
 * canvas, zoom with the wheel/pinch, and use the corner minimap
 * for orientation.
 *
 * ── Stack note ───────────────────────────────────────────────────
 * The CWH project-page topology (`AWSTopologyScene.tsx`) is built
 * on three.js + @react-three/fiber + @react-three/drei. Loading
 * that stack on the home hero would add ~150-200 KB gzipped to
 * first-paint JS — blowing through the home initial-JS budget and
 * regressing LCP. CWH's r3f bundle is already lazy-loaded behind
 * a dynamic import for that exact reason on its own route.
 *
 * @xyflow/react (~60 KB gz) is the right substitute for the hero
 * because it's purpose-built for *dynamic* node graphs (draggable
 * nodes, native pan/zoom, minimap, controls) — whereas CWH's
 * three.js scene is actually a set of static spheres with a
 * gentle autorotate, NOT a true dynamic graph. Choosing
 * @xyflow/react here delivers the "dynamic, not concentric
 * circles" spec while keeping the bundle inside the cinematic-
 * identity perf invariants.
 *
 * ── Cinematic identity preserved ─────────────────────────────────
 * - Cyan #00d2ff only. The react-flow default stylesheet ships
 *   with light-mode blues; this file's CSS overrides every relevant
 *   class so the rendered surface is pure black + cyan.
 * - HUD chrome (corner brackets, status strip, legend) sits on top
 *   of the canvas via react-flow's <Panel> primitive — same look
 *   we built in the previous HUD-frame commit.
 * - prefers-reduced-motion silences the node pulse animations and
 *   the edge dash flow; pan/zoom/drag stay because they're
 *   explicit interactions.
 */

import {
  useMemo,
  useState,
  useCallback,
  useEffect,
  type CSSProperties,
} from "react";
import {
  ReactFlow,
  Handle,
  Position,
  useNodesState,
  useEdgesState,
  type Node,
  type Edge,
  type NodeProps,
  type EdgeProps,
  type ReactFlowInstance,
  BaseEdge,
  getStraightPath,
} from "@xyflow/react";
import { motion, useReducedMotion } from "motion/react";
import "@xyflow/react/dist/base.css";
import {
  CENTER,
  CENTER_NODE,
  HERO_EDGES,
  HERO_NODES,
  RADII,
  RING_STYLE,
  type HeroNode as HeroNodeShape,
  type RingId,
} from "./hero-topology-data";

/* ── Polar → cartesian projection ──────────────────────────────────
 *
 * Reuse the polar coordinates already encoded in hero-topology-data.ts.
 * Centre at the data-file's (500, 500) so positions stay consistent
 * with the OG-image preview render that mirrors the same constants. */
function polarToXY(angleDeg: number, radius: number) {
  const a = (angleDeg * Math.PI) / 180;
  return {
    x: CENTER.x + Math.cos(a) * radius,
    y: CENTER.y + Math.sin(a) * radius,
  };
}

function radiusFor(ring: RingId): number {
  if (ring === "center") return 0;
  if (ring === "projects") return RADII.projects;
  if (ring === "focus") return RADII.focus;
  return RADII.tech;
}

/* ── Build react-flow node/edge data from the shared schema ──────── */

interface HeroNodeData extends Record<string, unknown> {
  label: string;
  ring: RingId;
  blurb: string;
}

type HeroNodeType = Node<HeroNodeData, "hero">;
type HeroEdgeType = Edge<Record<string, unknown>, "filament">;

function toFlowNode(node: HeroNodeShape): HeroNodeType {
  const pos =
    node.ring === "center"
      ? { x: CENTER.x, y: CENTER.y }
      : polarToXY(node.angleDeg, radiusFor(node.ring));
  return {
    id: node.id,
    type: "hero",
    position: pos,
    data: {
      label: node.label,
      ring: node.ring,
      blurb: node.blurb ?? "",
    },
    // Centre node should not be draggable — the whole map orbits it.
    // Outer-ring nodes are draggable so visitors can rearrange.
    draggable: node.ring !== "center",
    selectable: true,
  };
}

const INITIAL_NODES: HeroNodeType[] = HERO_NODES.map(toFlowNode);

const INITIAL_EDGES: HeroEdgeType[] = HERO_EDGES.map((edge, i) => ({
  id: `${edge.from}->${edge.to}-${i}`,
  source: edge.from,
  target: edge.to,
  type: "filament",
  // Edge "depth tier" derived from source ring — center→project is
  // the brightest, project→focus medium, focus→tech faintest.
  data: {
    tier:
      edge.from === "emre"
        ? "primary"
        : HERO_NODES.find((n) => n.id === edge.from)?.ring === "projects"
          ? "secondary"
          : "tertiary",
  },
}));

const EDGE_TIER_OPACITY: Record<string, number> = {
  primary: 0.5,
  secondary: 0.28,
  tertiary: 0.14,
};

/* ── Custom node ──────────────────────────────────────────────────
 *
 * One component for all four rings — branches on data.ring for size
 * + colour. motion/react gives us the hover pulse and a one-shot
 * entry scale. */

const NODE_SIZE: Record<RingId, number> = {
  center: 110,
  projects: 60,
  focus: 42,
  tech: 28,
};

const NODE_FONT: Record<RingId, string> = {
  center: "15px",
  projects: "13px",
  focus: "11px",
  tech: "9px",
};

function HeroNodeComponent({ data, selected }: NodeProps<HeroNodeType>) {
  const ring = data.ring;
  const size = NODE_SIZE[ring];
  const fontSize = NODE_FONT[ring];
  const style = RING_STYLE[ring];
  const isCenter = ring === "center";
  const prefersReducedMotion = useReducedMotion();

  return (
    <div
      className="relative flex items-center justify-center"
      style={{ width: size, height: size }}
    >
      {/* Invisible handles — react-flow needs at least one source and
          one target handle per node for edge anchoring. They're sized
          to zero and pointer-events-none so they never collide with
          the drag affordance. */}
      <Handle
        type="source"
        position={Position.Top}
        style={INVISIBLE_HANDLE}
        isConnectable={false}
      />
      <Handle
        type="target"
        position={Position.Bottom}
        style={INVISIBLE_HANDLE}
        isConnectable={false}
      />

      {/* Pulsing outer halo — only on the centre node; outer rings
          stay calm so the whole canvas doesn't shimmer. */}
      {isCenter && (
        <motion.span
          aria-hidden="true"
          className="absolute inset-0 rounded-full"
          style={{
            border: "1px solid rgba(0,210,255,0.30)",
          }}
          animate={
            prefersReducedMotion
              ? undefined
              : { opacity: [0.4, 0.85, 0.4], scale: [1, 1.08, 1] }
          }
          transition={{ duration: 3.4, repeat: Infinity, ease: "easeInOut" }}
        />
      )}

      {/* Glow ring — visible always, brighter on selected/hover. */}
      <span
        aria-hidden="true"
        className="absolute rounded-full pointer-events-none"
        style={{
          inset: -6,
          border: `1px solid ${style.glow}`,
          opacity: selected ? 1 : 0.7,
          transition: "opacity 220ms ease",
        }}
      />

      {/* Solid disc — the visible node body. */}
      <span
        aria-hidden="true"
        className="rounded-full"
        style={{
          width: size,
          height: size,
          background: isCenter
            ? `radial-gradient(circle at 35% 30%, rgba(0,210,255,0.55), ${style.fill}66 60%, ${style.fill}22 100%)`
            : style.fill,
          boxShadow: isCenter
            ? "0 0 32px rgba(0,210,255,0.45), inset 0 1px 1px rgba(255,255,255,0.30)"
            : `0 0 14px ${style.glow}`,
          opacity: 0.92,
        }}
      />

      {/* Label sits BELOW the node. position absolute so it doesn't
          push react-flow's bounding box (which would break edge
          anchoring math). */}
      <span
        className="absolute font-mono uppercase whitespace-nowrap pointer-events-none"
        style={{
          top: "100%",
          marginTop: 6,
          fontSize,
          letterSpacing: "0.16em",
          color:
            ring === "center"
              ? "rgba(255,255,255,0.96)"
              : ring === "projects"
                ? "rgba(255,255,255,0.92)"
                : ring === "focus"
                  ? "rgba(255,255,255,0.72)"
                  : "rgba(255,255,255,0.5)",
          textShadow: "0 1px 6px rgba(0,0,0,0.85)",
        }}
      >
        {data.label.toUpperCase()}
      </span>
    </div>
  );
}

const INVISIBLE_HANDLE: CSSProperties = {
  width: 1,
  height: 1,
  background: "transparent",
  border: "none",
  pointerEvents: "none",
  opacity: 0,
};

/* ── Custom edge ─────────────────────────────────────────────────
 *
 * Thin straight filament with a flowing cyan dash. The dash speed
 * varies by tier so the eye traces center→project most strongly. */

function FilamentEdge({
  sourceX,
  sourceY,
  targetX,
  targetY,
  data,
  id,
}: EdgeProps<HeroEdgeType>) {
  const prefersReducedMotion = useReducedMotion();
  const [edgePath] = getStraightPath({ sourceX, sourceY, targetX, targetY });
  const tier = (data?.tier as string) ?? "tertiary";
  const opacity = EDGE_TIER_OPACITY[tier] ?? 0.14;

  return (
    <>
      <BaseEdge
        id={id}
        path={edgePath}
        style={{
          stroke: "#00d2ff",
          strokeWidth: 1,
          opacity,
          strokeDasharray: prefersReducedMotion ? undefined : "4 6",
          animation: prefersReducedMotion
            ? undefined
            : `hero-filament-flow ${tier === "primary" ? 14 : tier === "secondary" ? 22 : 30}s linear infinite`,
        }}
      />
    </>
  );
}

const NODE_TYPES = { hero: HeroNodeComponent };
const EDGE_TYPES = { filament: FilamentEdge };

/* ── Component ────────────────────────────────────────────────── */

export default function HeroTopology() {
  const [nodes, , onNodesChange] = useNodesState<HeroNodeType>(INITIAL_NODES);
  const [edges, , onEdgesChange] = useEdgesState<HeroEdgeType>(INITIAL_EDGES);
  const [hoveredNode, setHoveredNode] = useState<HeroNodeType | null>(null);
  const [hasInteracted, setHasInteracted] = useState(false);
  const [flow, setFlow] = useState<ReactFlowInstance<
    HeroNodeType,
    HeroEdgeType
  > | null>(null);

  /* Fit the constellation into the viewport once the instance mounts.
   * react-flow's `fitView` runs after layout; we wait for the next
   * frame so the container has its final size before zoom math runs. */
  useEffect(() => {
    if (!flow) return;
    const id = requestAnimationFrame(() => {
      flow.fitView({ padding: 0.18, duration: 0 });
    });
    return () => cancelAnimationFrame(id);
  }, [flow]);

  /* Touch the "has interacted" flag on any drag/wheel/pan event so
   * the affordance chip can fade out. */
  const markInteracted = useCallback(() => {
    setHasInteracted(true);
  }, []);

  const statusLabel = hoveredNode
    ? `INSPECT: ${hoveredNode.data.label.toUpperCase()}`
    : hasInteracted
      ? "STANDBY"
      : "DRAG · PAN · ZOOM";

  return (
    /* Outer perspective volume.
     *
     * `perspective` here is what gives the inner canvas an actual 3D
     * vanishing point instead of the flat orthographic projection
     * react-flow uses by default. perspectiveOrigin sits slightly
     * above centre so the system reads as "camera looking down" — the
     * spatial posture borrowed from the CWH scene's [0, 4, 9] camera
     * position. The outer wrapper has NO border, NO rounded corners,
     * NO background — the constellation has to feel atmospheric, not
     * boxed inside a panel.
     *
     * Sized to fill the column rather than the previous capped
     * max-w-[640px] aspect-square widget shape. min-h grows on lg
     * so the constellation occupies real vertical territory next to
     * the hero text. Negative margins on the parent column let it
     * bleed slightly past the visible column boundary. */
    <div
      className="relative w-full h-full min-h-[440px] sm:min-h-[520px] lg:min-h-[640px]"
      role="region"
      aria-label="Portfolio constellation — drag nodes, pan, zoom"
      style={{
        perspective: "1600px",
        perspectiveOrigin: "50% 30%",
      }}
    >
      {/* Atmospheric volumetric haze — radial cyan glow with NO
       *  visible edge. Replaces the previous bordered/rounded
       *  vignette frame so the canvas reads as open space rather
       *  than a card. Two stacked radials: a tight bright core that
       *  haloes the centre node, and a wider faint tint that
       *  suggests volumetric depth into the page. */}
      <div
        aria-hidden="true"
        className="absolute inset-0 pointer-events-none -z-10"
        style={{
          background:
            "radial-gradient(ellipse 60% 50% at 50% 50%, rgba(0,210,255,0.12) 0%, rgba(11,37,81,0.06) 35%, transparent 75%), " +
            "radial-gradient(ellipse 90% 70% at 50% 70%, rgba(0,210,255,0.04) 0%, transparent 100%)",
        }}
      />

      {/* The react-flow plane lives on its own 3D layer.
       *
       *  - rotateX(8deg) tilts it down — the visitor reads "looking
       *    slightly from above", matching CWH's camera elevation.
       *  - Two `--hero-tilt-*` CSS variables drive a slow ambient
       *    oscillation defined in HERO_FLOW_CSS — equivalent to
       *    CWH's autorotate, in the X/Y rotation domain instead of
       *    Y axis, since we live in CSS-3D.
       *  - mask-image: radial fade-to-transparent so the canvas has
       *    NO hard rectangular edge — nodes near the rim dissolve
       *    into the page atmosphere. THIS is the "free-floating"
       *    feeling — no card boundary anywhere.
       *  - transform-style: preserve-3d so nested transforms keep
       *    their depth on Safari, which otherwise flattens. */}
      <div
        className="absolute inset-0 hero-flow-canvas"
        style={{
          transformStyle: "preserve-3d",
          WebkitMaskImage:
            "radial-gradient(ellipse 92% 88% at 50% 52%, black 50%, transparent 96%)",
          maskImage:
            "radial-gradient(ellipse 92% 88% at 50% 52%, black 50%, transparent 96%)",
        }}
      >
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={(changes) => {
            onNodesChange(changes);
            if (changes.some((c) => c.type === "position")) markInteracted();
          }}
          onEdgesChange={onEdgesChange}
          nodeTypes={NODE_TYPES}
          edgeTypes={EDGE_TYPES}
          onInit={setFlow}
          onMove={markInteracted}
          onNodeMouseEnter={(_, node) => setHoveredNode(node)}
          onNodeMouseLeave={() => setHoveredNode(null)}
          onPaneClick={() => setHoveredNode(null)}
          fitView
          fitViewOptions={{ padding: 0.28 }}
          minZoom={0.35}
          maxZoom={2.4}
          proOptions={{ hideAttribution: true }}
          nodesConnectable={false}
          nodesFocusable
          panOnDrag
          panOnScroll={false}
          zoomOnScroll
          zoomOnPinch
          selectionOnDrag={false}
          deleteKeyCode={null}
          multiSelectionKeyCode={null}
          style={{ background: "transparent" }}
        >
          {/* No <Background>, no <MiniMap>, no <Controls>, no <Panel>
              chrome. The whole point of this commit is to let the
              constellation breathe in open space. Wheel-zoom and pan
              are native to react-flow; drag stays on individual nodes. */}
        </ReactFlow>
      </div>

      {/* Hover tooltip — sole UI affordance that remains, because
       *  visitors need to read what each node IS. Sits inside the
       *  tilted plane's bounding box but on its own 2D layer (the
       *  outer wrapper is the perspective volume, not the inner
       *  canvas) so it stays legible regardless of camera tilt. */}
      {hoveredNode && hoveredNode.data.blurb && (
        <div
          className="pointer-events-none absolute bottom-4 left-4 max-w-[78%] rounded-lg border border-[#00d2ff]/15 bg-black/70 px-3 py-2 text-xs leading-relaxed text-white/85 shadow-[0_8px_24px_rgba(0,0,0,0.45)] backdrop-blur-sm z-20"
          role="status"
          aria-live="polite"
        >
          <div className="font-mono uppercase tracking-[0.18em] text-[10px] text-[#00d2ff] mb-1">
            {hoveredNode.data.label}
          </div>
          {hoveredNode.data.blurb}
        </div>
      )}

      {/* Single ambient signal line — anchored at the top-right edge,
       *  whisper-quiet. Replaces the previous trio of HUD chips
       *  (identity badge + status pill + legend) which collectively
       *  read as "dashboard widget". This is just one line, no
       *  border, no chip — a hint, not a frame. */}
      <div
        className="pointer-events-none absolute top-3 right-3 font-mono uppercase tracking-[0.20em] text-[9px] text-white/30 z-10"
        aria-hidden="true"
      >
        {statusLabel}
      </div>

      {/* Inline stylesheet — owns the CSS-3D ambient camera
       *  oscillation, the filament-flow keyframe, and the minimal
       *  react-flow palette overrides we still need (transparent
       *  pane, no focus outlines). All scoped via .hero-flow-canvas. */}
      <style>{HERO_FLOW_CSS}</style>

      {/* Reference kept reachable from CENTER_NODE so a future
       *  visualisation can pin it without re-importing the data file. */}
      <span hidden>{CENTER_NODE.id}</span>
    </div>
  );
}

/* ── Cinematic theme + spatial camera for @xyflow/react ──────────
 *
 * Two responsibilities:
 *
 * 1. Minimal palette overrides so react-flow's default white panel /
 *    blue selection chrome doesn't leak through. Scoped via
 *    .hero-flow-canvas so any future react-flow usage elsewhere in
 *    the codebase keeps the library defaults.
 *
 * 2. The ambient camera oscillation that gives the constellation its
 *    CWH-style spatial feeling. Two keyframes:
 *      - hero-filament-flow: the existing edge dash flow (kept).
 *      - hero-spatial-tilt:  slow rotateX/rotateY oscillation on the
 *        canvas plane. The visitor reads it as a camera that very
 *        slowly drifts between "slightly more from above" and
 *        "slightly more from the side" — equivalent to CWH's
 *        autorotate in the CSS-3D domain.
 *
 *    The tilt amplitudes are deliberately tiny (6°↔11° on X,
 *    -1.2°↔1.2° on Y) so dragging individual nodes inside react-flow
 *    still feels accurate. At these angles the cursor-delta vs
 *    graph-space-delta drift is sub-pixel for typical viewports.
 *
 *    On mobile (max-width 767px) the perspective tilt drops to a flat
 *    state — small touch targets + CSS-3D perspective interactions
 *    can fight each other on iOS Safari, so we trade away spatial
 *    feel for predictable tap behaviour where it matters most.
 *
 *    prefers-reduced-motion freezes the oscillation at its base
 *    posture; the static tilt remains because perspective itself
 *    isn't motion. */
const HERO_FLOW_CSS = `
@keyframes hero-filament-flow {
  to { stroke-dashoffset: -200; }
}
@keyframes hero-spatial-tilt {
  0%   { transform: rotateX(6deg)  rotateY(-1.2deg); }
  50%  { transform: rotateX(11deg) rotateY(1.2deg);  }
  100% { transform: rotateX(6deg)  rotateY(-1.2deg); }
}
.hero-flow-canvas {
  transform-origin: 50% 75%;
  animation: hero-spatial-tilt 36s ease-in-out infinite;
  will-change: transform;
}
.hero-flow-canvas .react-flow__renderer,
.hero-flow-canvas .react-flow__pane,
.hero-flow-canvas .react-flow__viewport {
  background: transparent;
}
.hero-flow-canvas .react-flow__node {
  outline: none;
}
.hero-flow-canvas .react-flow__node.selected,
.hero-flow-canvas .react-flow__node:focus {
  outline: none;
  box-shadow: none;
}
.hero-flow-canvas .react-flow__edge-path {
  stroke-linecap: round;
}
.hero-flow-canvas .react-flow__attribution {
  display: none;
}
@media (prefers-reduced-motion: reduce) {
  .hero-flow-canvas {
    animation: none;
    transform: rotateX(6deg);
  }
}
@media (max-width: 767px) {
  .hero-flow-canvas {
    animation: none;
    transform: none;
    transform-style: flat;
  }
}
`;
