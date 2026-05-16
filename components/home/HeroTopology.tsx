"use client";

/**
 * HeroTopology — the home hero's right-column constellation.
 *
 * A pan-and-zoom-able concentric-ring graph rooted at "Emre Doğan",
 * orbited by:
 *   Ring 1 — shipped + building + planning projects
 *   Ring 2 — focus areas (Cloud Architecture, FinOps, AI Systems, …)
 *   Ring 3 — tech-stack vocabulary (AWS, Bedrock, Terraform, …)
 *
 * Replaces InfrastructureCore as the right-column anchor. The old
 * component is preserved on disk (referenced by the OG image route)
 * but no longer rendered on /.
 *
 * Cinematic identity respected:
 *   - Cyan #00d2ff only. No new accents.
 *   - Pure SVG + native pointer events. NO three.js (would balloon
 *     the home initial JS past the 250 KB ceiling).
 *   - useReducedMotion silences the ambient outer ring rotation and
 *     centre pulse; pan/zoom still work (they're explicit interactions).
 *
 * Interaction model — matches the CWH topology's posture:
 *   - Pan: pointer-drag anywhere on the canvas translates the viewBox.
 *   - Zoom: wheel (or trackpad pinch) scales the viewBox around the
 *     cursor. Touch pinch is not handled in v1 — the CWH 3D scene
 *     uses Three.js OrbitControls for that; native SVG touch-pinch
 *     would require its own multi-pointer state machine, deferred.
 *   - Hover/tap a node → tooltip with the node's blurb.
 *   - "Reset view" button bottom-right restores the initial viewBox.
 */

import {
  useState,
  useRef,
  useMemo,
  useCallback,
  type PointerEvent as ReactPointerEvent,
  type WheelEvent as ReactWheelEvent,
} from "react";
import { motion, useReducedMotion } from "motion/react";
import { RotateCcw } from "lucide-react";
import {
  CENTER,
  CENTER_NODE,
  EDGE_OPACITY,
  HERO_EDGES,
  HERO_NODES,
  NODE_R,
  RADII,
  RING_STYLE,
  VIEWBOX,
  type HeroEdge,
  type HeroNode,
  type RingId,
} from "./hero-topology-data";

const INITIAL_VB = {
  x: VIEWBOX.x,
  y: VIEWBOX.y,
  w: VIEWBOX.w,
  h: VIEWBOX.h,
} as const;

/* Pan/zoom envelope. The view can pan ±300 viewBox-units from origin
 * (the constellation fills 1000×1000; ±300 lets the eye drift to the
 * outer ring without losing context) and zoom between 0.5× (viewBox
 * scaled to 2000) and 3× (viewBox scaled to 333). */
const PAN_LIMIT = 300;
const MIN_VB = 333; // 3× zoom in
const MAX_VB = 2000; // 0.5× zoom out

interface ViewBox {
  x: number;
  y: number;
  w: number;
  h: number;
}

/* ── Polar projection helper ─────────────────────────────────────── */

interface Point {
  x: number;
  y: number;
}

function polar(angleDeg: number, radius: number): Point {
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

function pointFor(node: HeroNode): Point {
  if (node.ring === "center") return { x: CENTER.x, y: CENTER.y };
  return polar(node.angleDeg, radiusFor(node.ring));
}

/* ── Component ───────────────────────────────────────────────────── */

export default function HeroTopology() {
  const prefersReducedMotion = useReducedMotion();
  const svgRef = useRef<SVGSVGElement>(null);
  const [viewBox, setViewBox] = useState<ViewBox>(INITIAL_VB);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [hasInteracted, setHasInteracted] = useState(false);

  /* Pre-compute node positions once — they don't move while panning,
   * the viewBox does. */
  const positions = useMemo(() => {
    const map = new Map<string, Point>();
    for (const node of HERO_NODES) {
      map.set(node.id, pointFor(node));
    }
    return map;
  }, []);

  const hoveredNode = useMemo(
    () => HERO_NODES.find((n) => n.id === hoveredId) ?? null,
    [hoveredId],
  );

  /* ── Pan state ───────────────────────────────────────────────────
     Drag start captures the pointer position + the current viewBox.
     Subsequent moves translate the viewBox by (delta in pixels) ×
     (viewBox-units-per-pixel). The SVG client width gives us the
     scale conversion. */
  const dragRef = useRef<{
    pointerId: number;
    startClientX: number;
    startClientY: number;
    startVB: ViewBox;
  } | null>(null);

  const handlePointerDown = useCallback(
    (e: ReactPointerEvent<SVGSVGElement>) => {
      if (e.button !== 0 && e.pointerType === "mouse") return;
      const svg = svgRef.current;
      if (!svg) return;
      svg.setPointerCapture(e.pointerId);
      dragRef.current = {
        pointerId: e.pointerId,
        startClientX: e.clientX,
        startClientY: e.clientY,
        startVB: viewBox,
      };
      setHasInteracted(true);
    },
    [viewBox],
  );

  const handlePointerMove = useCallback(
    (e: ReactPointerEvent<SVGSVGElement>) => {
      const drag = dragRef.current;
      if (!drag || drag.pointerId !== e.pointerId) return;
      const svg = svgRef.current;
      if (!svg) return;
      const rect = svg.getBoundingClientRect();
      // viewBox-units per CSS-pixel for the current zoom level
      const unitsPerPx = drag.startVB.w / rect.width;
      const dxPx = e.clientX - drag.startClientX;
      const dyPx = e.clientY - drag.startClientY;
      const nx = clamp(
        drag.startVB.x - dxPx * unitsPerPx,
        -PAN_LIMIT,
        VIEWBOX.w + PAN_LIMIT - drag.startVB.w,
      );
      const ny = clamp(
        drag.startVB.y - dyPx * unitsPerPx,
        -PAN_LIMIT,
        VIEWBOX.h + PAN_LIMIT - drag.startVB.h,
      );
      setViewBox({ ...drag.startVB, x: nx, y: ny });
    },
    [],
  );

  const handlePointerUp = useCallback(
    (e: ReactPointerEvent<SVGSVGElement>) => {
      const drag = dragRef.current;
      if (!drag || drag.pointerId !== e.pointerId) return;
      const svg = svgRef.current;
      if (svg && svg.hasPointerCapture(e.pointerId)) {
        svg.releasePointerCapture(e.pointerId);
      }
      dragRef.current = null;
    },
    [],
  );

  /* ── Wheel zoom ──────────────────────────────────────────────────
     Scales the viewBox around the cursor's position so the point
     under the mouse stays under the mouse — the same UX OrbitControls
     gives in the CWH 3D scene. */
  const handleWheel = useCallback(
    (e: ReactWheelEvent<SVGSVGElement>) => {
      e.preventDefault();
      const svg = svgRef.current;
      if (!svg) return;
      const rect = svg.getBoundingClientRect();
      const cursorVBx =
        viewBox.x + ((e.clientX - rect.left) / rect.width) * viewBox.w;
      const cursorVBy =
        viewBox.y + ((e.clientY - rect.top) / rect.height) * viewBox.h;

      const factor = e.deltaY > 0 ? 1.12 : 1 / 1.12;
      const newW = clamp(viewBox.w * factor, MIN_VB, MAX_VB);
      const newH = clamp(viewBox.h * factor, MIN_VB, MAX_VB);

      // Translate so the cursor's viewBox point stays put after the
      // zoom — the new origin must be cursor - (cursor-relative-frac) × newSize.
      const nx = cursorVBx - ((e.clientX - rect.left) / rect.width) * newW;
      const ny = cursorVBy - ((e.clientY - rect.top) / rect.height) * newH;

      setViewBox({
        x: clamp(nx, -PAN_LIMIT, VIEWBOX.w + PAN_LIMIT - newW),
        y: clamp(ny, -PAN_LIMIT, VIEWBOX.h + PAN_LIMIT - newH),
        w: newW,
        h: newH,
      });
      setHasInteracted(true);
    },
    [viewBox],
  );

  const handleReset = useCallback(() => {
    setViewBox(INITIAL_VB);
  }, []);

  /* Dynamic top-right status — shifts based on interaction state.
   * STANDBY (idle) → INSPECT (hovering a node) → PAN/ZOOM (mid-drag).
   * This is the "console" status indicator that makes the canvas
   * feel like a live system instead of decoration. */
  const statusLabel = dragRef.current
    ? "PAN/ZOOM"
    : hoveredNode
      ? `INSPECT: ${hoveredNode.label.toUpperCase()}`
      : hasInteracted
        ? "STANDBY"
        : "DRAG · SCROLL TO INTERACT";

  return (
    <div
      className="relative w-full max-w-[640px] mx-auto aspect-square min-h-[360px] sm:min-h-[440px]"
      role="region"
      aria-label="Interactive portfolio constellation"
    >
      {/* Outer console frame — radial vignette + hairline border. The
          inset shadow gives the topology a visible edge so pan/zoom
          feels bounded, and the radial glow draws the eye centre-out. */}
      <div
        className="absolute inset-0 rounded-2xl"
        style={{
          background:
            "radial-gradient(circle at 50% 50%, rgba(0,210,255,0.05) 0%, rgba(5,5,5,0.0) 65%)",
          boxShadow:
            "inset 0 0 80px rgba(0,210,255,0.07), inset 0 0 0 1px rgba(255,255,255,0.05)",
        }}
        aria-hidden="true"
      />

      {/* HUD corner brackets — four cyan L-shapes anchor the canvas
          like a heads-up display crosshair. SVG so they hold their
          1-pixel weight at any container size. */}
      <CornerBracket position="top-left" />
      <CornerBracket position="top-right" />
      <CornerBracket position="bottom-left" />
      <CornerBracket position="bottom-right" />

      {/* Top status strip — identity badge (left) + dynamic status
          (right). Sits above the SVG canvas, gives the topology the
          framing of a live engineering console. */}
      <div className="pointer-events-none absolute top-3 left-3 right-3 flex items-center justify-between gap-3 z-10">
        <div className="inline-flex items-center gap-2 rounded-full border border-[#00d2ff]/20 bg-black/60 px-2.5 py-1 backdrop-blur-sm">
          <span
            className="w-1.5 h-1.5 rounded-full bg-[#00d2ff]"
            style={{
              boxShadow: "0 0 6px rgba(0,210,255,0.8)",
            }}
            aria-hidden="true"
          />
          <span className="font-mono uppercase tracking-[0.18em] text-[9px] text-white/65">
            EMRE.CORE :: ADANA
          </span>
        </div>
        <div className="inline-flex items-center gap-2 rounded-full border border-white/[0.08] bg-black/60 px-2.5 py-1 backdrop-blur-sm">
          <span className="font-mono uppercase tracking-[0.18em] text-[9px] text-[#00d2ff]/85 truncate max-w-[180px] sm:max-w-[240px]">
            {statusLabel}
          </span>
        </div>
      </div>

      <svg
        ref={svgRef}
        viewBox={`${viewBox.x} ${viewBox.y} ${viewBox.w} ${viewBox.h}`}
        role="img"
        aria-label="Emre Doğan's portfolio constellation — central identity orbited by projects, focus areas, and tech stack. Drag to pan, scroll to zoom."
        className="relative w-full h-full select-none"
        style={{
          touchAction: "none",
          cursor: dragRef.current ? "grabbing" : "grab",
        }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onWheel={handleWheel}
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Cyan glow filter — applied to nodes for the "alive plasma"
            quality. Single re-usable defs entry; ~negligible cost. */}
        <defs>
          <filter id="hero-node-glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          {/* Animated dash for the outer ring — only used when
              motion is allowed (CSS animation guarded below). */}
          <radialGradient id="hero-core-grad" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#00d2ff" stopOpacity="0.45" />
            <stop offset="60%" stopColor="#00d2ff" stopOpacity="0.12" />
            <stop offset="100%" stopColor="#00d2ff" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Ring guides — three concentric dashed circles. The outer
            one rotates slowly for ambient motion; the inner two stay
            still so the visual centre of mass doesn't drift. */}
        <g aria-hidden="true">
          <circle
            cx={CENTER.x}
            cy={CENTER.y}
            r={RADII.projects}
            fill="none"
            stroke="rgba(0,210,255,0.10)"
            strokeWidth="1"
            strokeDasharray="2 6"
          />
          <circle
            cx={CENTER.x}
            cy={CENTER.y}
            r={RADII.focus}
            fill="none"
            stroke="rgba(0,210,255,0.08)"
            strokeWidth="1"
            strokeDasharray="2 6"
          />
          <motion.circle
            cx={CENTER.x}
            cy={CENTER.y}
            r={RADII.tech}
            fill="none"
            stroke="rgba(0,210,255,0.06)"
            strokeWidth="1"
            strokeDasharray="3 8"
            animate={prefersReducedMotion ? undefined : { rotate: 360 }}
            transition={{
              duration: 140,
              repeat: Infinity,
              ease: "linear",
            }}
            style={{ transformOrigin: `${CENTER.x}px ${CENTER.y}px` }}
          />
        </g>

        {/* Centre glow halo (behind the centre node) — gives the
            constellation a luminous core without per-frame motion. */}
        <circle
          cx={CENTER.x}
          cy={CENTER.y}
          r={NODE_R.center * 2.4}
          fill="url(#hero-core-grad)"
          aria-hidden="true"
        />

        {/* Edges — three depth tiers, each rendered with its own
            opacity so the eye can trace center → project → focus →
            tech. Edges go BEFORE nodes so nodes paint over them. */}
        <g aria-hidden="true">
          {HERO_EDGES.map((edge, i) => (
            <EdgeLine
              key={`${edge.from}->${edge.to}-${i}`}
              edge={edge}
              positions={positions}
            />
          ))}
        </g>

        {/* Nodes (and their labels) per ring — outer to inner so
            inner nodes paint over outer ring labels if they collide. */}
        <g>
          {HERO_NODES.filter((n) => n.ring === "tech").map((n) => (
            <Node
              key={n.id}
              node={n}
              position={positions.get(n.id)!}
              hovered={hoveredId === n.id}
              onHover={setHoveredId}
            />
          ))}
          {HERO_NODES.filter((n) => n.ring === "focus").map((n) => (
            <Node
              key={n.id}
              node={n}
              position={positions.get(n.id)!}
              hovered={hoveredId === n.id}
              onHover={setHoveredId}
            />
          ))}
          {HERO_NODES.filter((n) => n.ring === "projects").map((n) => (
            <Node
              key={n.id}
              node={n}
              position={positions.get(n.id)!}
              hovered={hoveredId === n.id}
              onHover={setHoveredId}
            />
          ))}
          {/* Centre node — rendered last so it sits visually on top. */}
          <CenterNode
            node={CENTER_NODE}
            position={positions.get(CENTER_NODE.id)!}
            hovered={hoveredId === CENTER_NODE.id}
            onHover={setHoveredId}
            prefersReducedMotion={!!prefersReducedMotion}
          />
        </g>
      </svg>

      {/* Hover tooltip — overlays the SVG. Positioned bottom-left so
          it never fights the reset button. */}
      {hoveredNode && (
        <div
          className="pointer-events-none absolute bottom-3 left-3 max-w-[78%] rounded-lg border border-[#00d2ff]/20 bg-black/85 px-3 py-2 text-xs leading-relaxed text-white/80 shadow-[0_8px_24px_rgba(0,0,0,0.45)] backdrop-blur-sm"
          role="status"
          aria-live="polite"
        >
          <div className="font-mono uppercase tracking-[0.18em] text-[10px] text-[#00d2ff] mb-1">
            {hoveredNode.label}
          </div>
          {hoveredNode.blurb}
        </div>
      )}

      {/* Bottom strip — orbit legend (left/centre) + reset button
          (right, only after interaction). The legend is the dashboard's
          map key: three coloured dots match the three ring fills so
          readers can ground "what does an outer-ring node mean". */}
      <div className="pointer-events-none absolute bottom-3 left-3 right-3 flex items-center justify-between gap-3 z-10">
        <div className="inline-flex items-center gap-3 rounded-full border border-white/[0.06] bg-black/55 px-2.5 py-1 backdrop-blur-sm">
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
            <RotateCcw className="w-3 h-3" aria-hidden="true" />
            Reset
          </button>
        )}
      </div>
    </div>
  );
}

/* ── HUD corner bracket ─────────────────────────────────────────── */

interface CornerBracketProps {
  position: "top-left" | "top-right" | "bottom-left" | "bottom-right";
}

/* Pure-CSS L-shape via two 1px borders. Cheaper than SVG, and the
 * 18px arm length sits comfortably inside the 12px container padding
 * without colliding with the corner-radius arc. */
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
      className="absolute w-5 h-5 pointer-events-none z-0"
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

/* ── Edge ────────────────────────────────────────────────────────── */

interface EdgeLineProps {
  edge: HeroEdge;
  positions: Map<string, Point>;
}

function EdgeLine({ edge, positions }: EdgeLineProps) {
  const a = positions.get(edge.from);
  const b = positions.get(edge.to);
  if (!a || !b) return null;
  const opacity =
    edge.from === "emre"
      ? EDGE_OPACITY.centerToProject
      : edge.to === "claude" ||
          edge.to === "bedrock" ||
          edge.to === "aws" ||
          edge.to === "terraform" ||
          edge.to === "nextjs" ||
          edge.to === "typescript" ||
          edge.to === "dynamodb" ||
          edge.to === "lambda" ||
          edge.to === "vercel" ||
          edge.to === "flutter" ||
          edge.to === "supabase"
        ? EDGE_OPACITY.focusToTech
        : EDGE_OPACITY.projectToFocus;
  return (
    <line
      x1={a.x}
      y1={a.y}
      x2={b.x}
      y2={b.y}
      stroke={`rgba(0,210,255,${opacity})`}
      strokeWidth="1"
    />
  );
}

/* ── Generic ring node ──────────────────────────────────────────── */

interface NodeProps {
  node: HeroNode;
  position: Point;
  hovered: boolean;
  onHover: (id: string | null) => void;
}

function Node({ node, position, hovered, onHover }: NodeProps) {
  const r = NODE_R[node.ring];
  const style = RING_STYLE[node.ring];
  const labelOffset = r + 14;
  const fontSize =
    node.ring === "projects" ? 13 : node.ring === "focus" ? 11 : 9;
  const labelOpacity =
    node.ring === "projects" ? 0.92 : node.ring === "focus" ? 0.72 : 0.5;

  return (
    <g
      onPointerEnter={() => onHover(node.id)}
      onPointerLeave={() => onHover(null)}
      onFocus={() => onHover(node.id)}
      onBlur={() => onHover(null)}
      tabIndex={0}
      role="button"
      aria-label={node.label}
      style={{ cursor: "pointer", outline: "none" }}
    >
      {/* Outer ring — pulses on hover. */}
      <circle
        cx={position.x}
        cy={position.y}
        r={r + (hovered ? 6 : 3)}
        fill="none"
        stroke={style.glow}
        strokeWidth="1"
        style={{ transition: "r 220ms ease, stroke-width 220ms ease" }}
      />
      {/* Solid node — slight glow filter for the "alive" feel. */}
      <circle
        cx={position.x}
        cy={position.y}
        r={r}
        fill={style.fill}
        opacity={hovered ? 1 : 0.85}
        filter="url(#hero-node-glow)"
        style={{ transition: "opacity 200ms ease" }}
      />
      {/* Label — uppercase mono, sits below the node. */}
      <text
        x={position.x}
        y={position.y + labelOffset}
        textAnchor="middle"
        fontSize={fontSize}
        fontFamily="ui-monospace, SFMono-Regular, monospace"
        letterSpacing="1.5"
        fill={`rgba(255,255,255,${hovered ? 1 : labelOpacity})`}
        style={{ pointerEvents: "none", transition: "fill 200ms ease" }}
      >
        {node.label.toUpperCase()}
      </text>
    </g>
  );
}

/* ── Centre node ─────────────────────────────────────────────────── */

interface CenterNodeProps extends NodeProps {
  prefersReducedMotion: boolean;
}

function CenterNode({
  node,
  position,
  hovered,
  onHover,
  prefersReducedMotion,
}: CenterNodeProps) {
  const r = NODE_R.center;
  return (
    <g
      onPointerEnter={() => onHover(node.id)}
      onPointerLeave={() => onHover(null)}
      onFocus={() => onHover(node.id)}
      onBlur={() => onHover(null)}
      tabIndex={0}
      role="button"
      aria-label={node.label}
      style={{ cursor: "pointer", outline: "none" }}
    >
      {/* Pulsing outer halo — only when motion allowed. */}
      <motion.circle
        cx={position.x}
        cy={position.y}
        r={r + 12}
        fill="none"
        stroke="rgba(0,210,255,0.30)"
        strokeWidth="1"
        animate={
          prefersReducedMotion
            ? undefined
            : {
                opacity: [0.4, 0.85, 0.4],
                scale: [1, 1.06, 1],
              }
        }
        transition={{ duration: 3.4, repeat: Infinity, ease: "easeInOut" }}
        style={{ transformOrigin: `${position.x}px ${position.y}px` }}
      />
      {/* Solid centre disc */}
      <circle
        cx={position.x}
        cy={position.y}
        r={r}
        fill="rgba(0,210,255,0.18)"
        stroke="rgba(255,255,255,0.35)"
        strokeWidth="1"
      />
      <circle
        cx={position.x}
        cy={position.y}
        r={r - 14}
        fill="#00d2ff"
        opacity={hovered ? 1 : 0.92}
      />
      {/* Identity label — sits below the disc */}
      <text
        x={position.x}
        y={position.y + r + 22}
        textAnchor="middle"
        fontSize="15"
        fontFamily="ui-monospace, SFMono-Regular, monospace"
        letterSpacing="2.2"
        fill="rgba(255,255,255,0.96)"
        style={{ pointerEvents: "none" }}
      >
        EMRE DOĞAN
      </text>
    </g>
  );
}

/* ── Utility ─────────────────────────────────────────────────────── */

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}
