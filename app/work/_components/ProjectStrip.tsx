/* ──────────────────────────────────────────────────────────────
 *  ProjectStrip — V6 Sub-PR 14.1
 *
 *  A horizontal SVG "constellation strip" derived from
 *  `components/home/hero-topology-data.ts`. For each project, we
 *  project the connected subgraph (project → focuses → techs) onto
 *  a 360 × 96 horizontal canvas:
 *
 *    [center node]      [focus]      [tech]
 *                       [focus]      [tech]
 *
 *  Server Component, zero client JS. Build-time pre-rendered SVG.
 *  Reduced-motion safe by construction (no animation). The
 *  "build-time pre-rendered SVG fallback for mobile + reduced-
 *  motion + JS-off" the spec asks for IS this primitive — no
 *  three.js, no canvas, no client cost.
 *
 *  Spec ref: PORTFOLYO_V6_UI_EXECUTION_SYSTEM.md § Sub-PR 14.1
 *            ("each project as a horizontal 'constellation strip' —
 *             a small Three.js-derived line-rendering of the
 *             project's topology").
 * ────────────────────────────────────────────────────────────── */

import {
  HERO_EDGES,
  HERO_NODES,
  RING_STYLE,
} from "@/components/home/hero-topology-data";

const W = 360;
const H = 96;

interface PlacedNode {
  id: string;
  label: string;
  cx: number;
  cy: number;
  r: number;
  ring: "center" | "focus" | "tech";
}

interface StripGeometry {
  placed: PlacedNode[];
  edges: { from: string; to: string }[];
}

function buildGeometry(projectTopologyId: string): StripGeometry {
  const focusEdges = HERO_EDGES.filter((e) => e.from === projectTopologyId);
  const focusIds = focusEdges.map((e) => e.to);
  const techEdges = HERO_EDGES.filter((e) => focusIds.includes(e.from));
  const techIds = Array.from(new Set(techEdges.map((e) => e.to)));

  const labelFor = (id: string) =>
    HERO_NODES.find((n) => n.id === id)?.label ?? id;

  /* Layout: project sits at the left, focus column in the middle,
     tech column at the right. Vertical positions distribute evenly
     within each column so the strip reads as a quick scan. */
  const centerX = 36;
  const focusX = 168;
  const techX = 312;
  const cy = H / 2;

  const center: PlacedNode = {
    id: projectTopologyId,
    label: labelFor(projectTopologyId),
    cx: centerX,
    cy,
    r: 5,
    ring: "center",
  };

  const focusSpread = Math.min(28, 14 * Math.max(focusIds.length - 1, 1));
  const focusStart = cy - focusSpread / 2;
  const focusPlaced: PlacedNode[] = focusIds.map((id, i) => ({
    id,
    label: labelFor(id),
    cx: focusX,
    cy:
      focusIds.length === 1 ? cy : focusStart + (i * focusSpread) / Math.max(focusIds.length - 1, 1),
    r: 3.2,
    ring: "focus",
  }));

  const techSpread = Math.min(60, 12 * Math.max(techIds.length - 1, 1));
  const techStart = cy - techSpread / 2;
  const techPlaced: PlacedNode[] = techIds.map((id, i) => ({
    id,
    label: labelFor(id),
    cx: techX,
    cy:
      techIds.length === 1 ? cy : techStart + (i * techSpread) / Math.max(techIds.length - 1, 1),
    r: 2.2,
    ring: "tech",
  }));

  return {
    placed: [center, ...focusPlaced, ...techPlaced],
    edges: [
      ...focusEdges,
      ...techEdges.filter((e) => techIds.includes(e.to)),
    ],
  };
}

interface Props {
  topologyId: string;
}

export default function ProjectStrip({ topologyId }: Props) {
  const { placed, edges } = buildGeometry(topologyId);
  const byId = new Map(placed.map((p) => [p.id, p]));

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      role="img"
      aria-label={`Architecture topology strip for ${placed[0]?.label ?? topologyId}.`}
      className="w-full h-auto max-w-[420px]"
      preserveAspectRatio="xMinYMid meet"
    >
      {/* Edges — center→focus at brighter opacity, focus→tech faded. */}
      {edges.map((e, i) => {
        const a = byId.get(e.from);
        const b = byId.get(e.to);
        if (!a || !b) return null;
        const opacity = a.ring === "center" ? 0.40 : 0.18;
        return (
          <line
            key={i}
            x1={a.cx}
            y1={a.cy}
            x2={b.cx}
            y2={b.cy}
            stroke={`rgba(0,210,255,${opacity})`}
            strokeWidth={0.6}
          />
        );
      })}

      {/* Nodes — descending opacity / size by ring. */}
      {placed.map((p) => {
        const fill =
          p.ring === "center"
            ? RING_STYLE.center.fill
            : p.ring === "focus"
              ? RING_STYLE.focus.fill
              : RING_STYLE.tech.fill;
        return (
          <g key={p.id}>
            <circle cx={p.cx} cy={p.cy} r={p.r} fill={fill} />
            {/* Tiny inline label — mono, lowercase, only on focus + tech.
                Centre node label sits below at a slightly larger size to
                read as the project anchor without dominating the strip. */}
            {p.ring === "center" ? (
              <text
                x={p.cx}
                y={p.cy + p.r + 10}
                textAnchor="middle"
                fontSize={8.5}
                fontFamily="ui-monospace, SFMono-Regular, monospace"
                letterSpacing={1}
                fill="rgba(255,255,255,0.78)"
              >
                {p.label.toUpperCase()}
              </text>
            ) : p.ring === "focus" ? (
              <text
                x={p.cx + p.r + 6}
                y={p.cy + 2.4}
                fontSize={6.6}
                fontFamily="ui-monospace, SFMono-Regular, monospace"
                letterSpacing={0.6}
                fill="rgba(255,255,255,0.56)"
              >
                {p.label}
              </text>
            ) : (
              <text
                x={p.cx + p.r + 5}
                y={p.cy + 2.2}
                fontSize={6}
                fontFamily="ui-monospace, SFMono-Regular, monospace"
                letterSpacing={0.5}
                fill="rgba(255,255,255,0.40)"
              >
                {p.label}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}
