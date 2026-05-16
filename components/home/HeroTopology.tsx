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
  Background,
  BackgroundVariant,
  MiniMap,
  Controls,
  Panel,
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

  const handleReset = useCallback(() => {
    if (!flow) return;
    flow.fitView({ padding: 0.18, duration: 450 });
  }, [flow]);

  return (
    <div
      className="relative w-full max-w-[640px] mx-auto aspect-square min-h-[360px] sm:min-h-[440px]"
      role="region"
      aria-label="Interactive portfolio constellation — drag nodes, pan the canvas, zoom with scroll"
    >
      {/* Console frame — radial vignette + hairline border. Pure CSS,
          sits below react-flow so the canvas paints on top. */}
      <div
        className="absolute inset-0 rounded-2xl pointer-events-none z-0"
        style={{
          background:
            "radial-gradient(circle at 50% 50%, rgba(0,210,255,0.05) 0%, rgba(5,5,5,0.0) 65%)",
          boxShadow:
            "inset 0 0 80px rgba(0,210,255,0.07), inset 0 0 0 1px rgba(255,255,255,0.05)",
        }}
        aria-hidden="true"
      />

      {/* HUD corner brackets (carried over from the previous frame). */}
      <CornerBracket position="top-left" />
      <CornerBracket position="top-right" />
      <CornerBracket position="bottom-left" />
      <CornerBracket position="bottom-right" />

      {/* The react-flow canvas. Fills the wrapper. Style overrides at
          the bottom of this file flip its default palette to cyan/black. */}
      <div className="absolute inset-0 rounded-2xl overflow-hidden hero-flow-canvas">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={(changes) => {
            onNodesChange(changes);
            // Drag start emits "position" change of type "dragging".
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
          fitViewOptions={{ padding: 0.18 }}
          minZoom={0.4}
          maxZoom={2.2}
          // Disable React Flow's default UI controls (we render our
          // own HUD via <Panel> below for cinematic consistency).
          proOptions={{ hideAttribution: true }}
          nodesConnectable={false}
          nodesFocusable={true}
          panOnDrag={true}
          panOnScroll={false}
          zoomOnScroll={true}
          zoomOnPinch={true}
          // Don't let dragging the centre node behave like panning the
          // canvas — react-flow handles that distinction automatically
          // when individual nodes have draggable:false but we want to
          // make sure pan-from-canvas works everywhere else.
          selectionOnDrag={false}
          deleteKeyCode={null}
          multiSelectionKeyCode={null}
          style={{ background: "transparent" }}
        >
          {/* Faint cyan dot grid background — gives the canvas the
              "engineering surface" texture without competing with
              the constellation. */}
          <Background
            variant={BackgroundVariant.Dots}
            gap={28}
            size={1.1}
            color="rgba(0,210,255,0.10)"
          />

          {/* Minimap — cyan-themed, sits bottom-right. */}
          <MiniMap
            pannable
            zoomable
            ariaLabel="Constellation minimap"
            position="bottom-right"
            style={{
              background: "rgba(5,5,5,0.85)",
              border: "1px solid rgba(0,210,255,0.20)",
              borderRadius: 8,
              width: 100,
              height: 70,
            }}
            nodeColor={(n) => {
              const ring = (n.data as HeroNodeData | undefined)?.ring;
              if (!ring) return "#00d2ff";
              return RING_STYLE[ring].fill;
            }}
            nodeStrokeColor="transparent"
            maskColor="rgba(0,0,0,0.55)"
          />

          {/* Built-in zoom controls (custom-styled below). */}
          <Controls
            position="bottom-left"
            showInteractive={false}
            onZoomIn={markInteracted}
            onZoomOut={markInteracted}
            onFitView={markInteracted}
          />

          {/* HUD panels — render on top of the canvas. */}
          <Panel position="top-left">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#00d2ff]/20 bg-black/65 px-2.5 py-1 backdrop-blur-sm pointer-events-none">
              <span
                className="w-1.5 h-1.5 rounded-full bg-[#00d2ff]"
                style={{ boxShadow: "0 0 6px rgba(0,210,255,0.8)" }}
                aria-hidden="true"
              />
              <span className="font-mono uppercase tracking-[0.18em] text-[9px] text-white/65">
                EMRE.CORE :: ADANA
              </span>
            </div>
          </Panel>
          <Panel position="top-right">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/[0.08] bg-black/65 px-2.5 py-1 backdrop-blur-sm pointer-events-none">
              <span className="font-mono uppercase tracking-[0.18em] text-[9px] text-[#00d2ff]/85 truncate max-w-[180px] sm:max-w-[240px]">
                {statusLabel}
              </span>
            </div>
          </Panel>
        </ReactFlow>
      </div>

      {/* Hover tooltip — overlays react-flow when a node is focused. */}
      {hoveredNode && hoveredNode.data.blurb && (
        <div
          className="pointer-events-none absolute bottom-14 left-3 max-w-[70%] rounded-lg border border-[#00d2ff]/20 bg-black/85 px-3 py-2 text-xs leading-relaxed text-white/85 shadow-[0_8px_24px_rgba(0,0,0,0.45)] backdrop-blur-sm z-20"
          role="status"
          aria-live="polite"
        >
          <div className="font-mono uppercase tracking-[0.18em] text-[10px] text-[#00d2ff] mb-1">
            {hoveredNode.data.label}
          </div>
          {hoveredNode.data.blurb}
        </div>
      )}

      {/* Bottom legend + reset — anchored above the controls so they
          don't overlap. */}
      <div className="pointer-events-none absolute bottom-3 left-3 right-3 flex items-end justify-between gap-3 z-20">
        <div className="inline-flex items-center gap-3 rounded-full border border-white/[0.06] bg-black/55 px-2.5 py-1 backdrop-blur-sm ml-auto">
          <LegendDot color={RING_STYLE.projects.fill} label="PROJECTS" />
          <span className="text-white/15" aria-hidden="true">·</span>
          <LegendDot color={RING_STYLE.focus.fill} label="FOCUS" />
          <span className="text-white/15" aria-hidden="true">·</span>
          <LegendDot color={RING_STYLE.tech.fill} label="STACK" />
        </div>
        {hasInteracted && (
          <button
            type="button"
            onClick={handleReset}
            aria-label="Reset constellation view"
            className="pointer-events-auto inline-flex items-center gap-1.5 rounded-full border border-white/[0.10] bg-black/75 px-2.5 py-1 text-[9px] font-mono uppercase tracking-[0.18em] text-white/60 hover:text-white/95 hover:border-[#00d2ff]/40 transition-colors backdrop-blur-sm"
          >
            FIT VIEW
          </button>
        )}
      </div>

      {/* Inline stylesheet — overrides the @xyflow/react default
          palette (light blues + white) with the cinematic cyan + black
          identity. Scoped via .hero-flow-canvas so any future react-
          flow usage elsewhere in the codebase stays untouched. Also
          owns the flowing-dash keyframe used by the custom edge. */}
      <style>{HERO_FLOW_CSS}</style>

      {/* Reference variables kept reachable from CENTER_NODE so a
          future visualisation can pin it visually distinct without
          re-importing the data file. */}
      <span hidden>{CENTER_NODE.id}</span>
    </div>
  );
}

/* ── HUD corner bracket ─────────────────────────────────────────── */

interface CornerBracketProps {
  position: "top-left" | "top-right" | "bottom-left" | "bottom-right";
}

function CornerBracket({ position }: CornerBracketProps) {
  const corner = {
    "top-left": { top: 0, left: 0, borderTop: 1, borderLeft: 1, borderRadius: "8px 0 0 0" },
    "top-right": { top: 0, right: 0, borderTop: 1, borderRight: 1, borderRadius: "0 8px 0 0" },
    "bottom-left": { bottom: 0, left: 0, borderBottom: 1, borderLeft: 1, borderRadius: "0 0 0 8px" },
    "bottom-right": { bottom: 0, right: 0, borderBottom: 1, borderRight: 1, borderRadius: "0 0 8px 0" },
  }[position];

  return (
    <span
      aria-hidden="true"
      className="absolute w-5 h-5 pointer-events-none z-20"
      style={{
        top: corner.top !== undefined ? "8px" : undefined,
        bottom: corner.bottom !== undefined ? "8px" : undefined,
        left: corner.left !== undefined ? "8px" : undefined,
        right: corner.right !== undefined ? "8px" : undefined,
        borderTopWidth: corner.borderTop ? "1px" : 0,
        borderRightWidth: corner.borderRight ? "1px" : 0,
        borderBottomWidth: corner.borderBottom ? "1px" : 0,
        borderLeftWidth: corner.borderLeft ? "1px" : 0,
        borderStyle: "solid",
        borderColor: "rgba(0,210,255,0.45)",
        borderRadius: corner.borderRadius,
        boxShadow: "0 0 8px rgba(0,210,255,0.18)",
      }}
    />
  );
}

/* ── Legend dot ─────────────────────────────────────────────────── */

interface LegendDotProps {
  color: string;
  label: string;
}

function LegendDot({ color, label }: LegendDotProps) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span
        className="w-1.5 h-1.5 rounded-full"
        style={{
          backgroundColor: color,
          boxShadow: `0 0 4px ${color}aa`,
        }}
        aria-hidden="true"
      />
      <span className="font-mono uppercase tracking-[0.18em] text-[9px] text-white/55">
        {label}
      </span>
    </span>
  );
}

/* ── Cinematic theme overrides for @xyflow/react ─────────────────
 *
 * The library's default stylesheet ships with white backgrounds and
 * blue selection borders. Scoped via .hero-flow-canvas so only the
 * hero topology gets re-themed; any future react-flow usage elsewhere
 * keeps the library defaults.
 *
 * Also defines the flowing-dash keyframe used by the custom edge. */
const HERO_FLOW_CSS = `
@keyframes hero-filament-flow {
  to { stroke-dashoffset: -200; }
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
.hero-flow-canvas .react-flow__minimap {
  background: rgba(5,5,5,0.85) !important;
}
.hero-flow-canvas .react-flow__minimap-mask {
  fill: rgba(0,0,0,0.55);
}
.hero-flow-canvas .react-flow__controls {
  background: transparent;
  box-shadow: none;
  display: flex;
  flex-direction: row;
  gap: 4px;
}
.hero-flow-canvas .react-flow__controls-button {
  background: rgba(5,5,5,0.85);
  border: 1px solid rgba(0,210,255,0.20);
  color: rgba(255,255,255,0.65);
  border-radius: 6px;
  width: 26px;
  height: 26px;
  padding: 4px;
  transition: border-color 200ms ease, color 200ms ease;
}
.hero-flow-canvas .react-flow__controls-button:hover {
  border-color: rgba(0,210,255,0.55);
  color: rgba(255,255,255,0.95);
  background: rgba(5,5,5,0.95);
}
.hero-flow-canvas .react-flow__controls-button svg {
  fill: currentColor;
  max-width: 14px;
  max-height: 14px;
}
.hero-flow-canvas .react-flow__attribution {
  display: none;
}
`;
