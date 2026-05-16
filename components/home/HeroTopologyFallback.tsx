"use client";

/**
 * HeroTopologyFallback — 2D SVG version of the hero constellation,
 * rendered on viewports < 768px (where shipping three.js + r3f +
 * drei would be wasteful and the OrbitControls camera UX doesn't
 * make sense on a small touch screen).
 *
 * Architectural lineage
 * ─────────────────────
 * Mirrors CWH's `TopologyMobileFallback.tsx`: pure SVG, polar
 * projection of the same node positions, no 3D bundle, tap-to-reveal
 * caption inline below the diagram. The only differences vs CWH's
 * fallback are:
 *   - 24 nodes across 3 rings (vs CWH's 12 on 1 ring)
 *   - Per-ring radius + node-radius + label-size tiering
 *   - Edge tier colouring matches the 3D scene's depth hierarchy
 *
 * The HeroTopology wrapper picks this file vs HeroTopologyScene at
 * runtime based on viewport width — same media-query gate CWH uses.
 */

import { useMemo, useState } from "react";
import {
  CENTER_NODE,
  HERO_EDGES,
  HERO_NODES,
  RING_STYLE,
  type RingId,
} from "./hero-topology-data";

const W = 600;
const H = 560;
const CX = W / 2;
const CY = H / 2;

const SVG_RING_RADIUS: Record<RingId, number> = {
  center: 0,
  projects: 110,
  focus: 180,
  tech: 250,
};

const SVG_NODE_RADIUS: Record<RingId, number> = {
  center: 14,
  projects: 9,
  focus: 6,
  tech: 4,
};

const SVG_LABEL_SIZE: Record<RingId, number> = {
  center: 11,
  projects: 9,
  focus: 8,
  tech: 7,
};

interface Placed {
  id: string;
  cx: number;
  cy: number;
}

function place(): Placed[] {
  return HERO_NODES.map((n) => {
    if (n.ring === "center") return { id: n.id, cx: CX, cy: CY };
    const a = (n.angleDeg / 360) * Math.PI * 2;
    const r = SVG_RING_RADIUS[n.ring];
    return {
      id: n.id,
      cx: CX + Math.cos(a) * r,
      cy: CY + Math.sin(a) * r,
    };
  });
}

export default function HeroTopologyFallback() {
  const placed = useMemo(place, []);
  const lookup = useMemo(
    () => new Map(placed.map((p) => [p.id, p])),
    [placed],
  );
  const [activeId, setActiveId] = useState<string | null>(CENTER_NODE.id);
  const activeNode = HERO_NODES.find((n) => n.id === activeId);

  return (
    <div className="w-full">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        role="img"
        aria-label="Portfolio constellation — Emre Doğan orbited by projects, focus areas, and tech stack"
        className="block w-full h-auto max-h-[520px]"
      >
        {/* Ring guides — extremely subtle, no harder than the line
            opacity in the 3D scene's outer ring */}
        <circle
          cx={CX}
          cy={CY}
          r={SVG_RING_RADIUS.projects}
          fill="none"
          stroke="rgba(0,210,255,0.10)"
          strokeWidth={1}
          strokeDasharray="2 6"
        />
        <circle
          cx={CX}
          cy={CY}
          r={SVG_RING_RADIUS.focus}
          fill="none"
          stroke="rgba(0,210,255,0.08)"
          strokeWidth={1}
          strokeDasharray="2 6"
        />
        <circle
          cx={CX}
          cy={CY}
          r={SVG_RING_RADIUS.tech}
          fill="none"
          stroke="rgba(0,210,255,0.06)"
          strokeWidth={1}
          strokeDasharray="2 6"
        />

        {/* Edges — tiered opacity matches the 3D scene's depth
            hierarchy (centre→project brightest, focus→tech faintest) */}
        {HERO_EDGES.map((e, i) => {
          const a = lookup.get(e.from);
          const b = lookup.get(e.to);
          if (!a || !b) return null;
          const sourceRing = HERO_NODES.find((n) => n.id === e.from)?.ring;
          const stroke =
            e.from === "emre"
              ? "rgba(0,210,255,0.42)"
              : sourceRing === "projects"
                ? "rgba(0,210,255,0.22)"
                : "rgba(93,180,245,0.16)";
          return (
            <line
              key={i}
              x1={a.cx}
              y1={a.cy}
              x2={b.cx}
              y2={b.cy}
              stroke={stroke}
              strokeWidth={1}
            />
          );
        })}

        {/* Nodes */}
        {HERO_NODES.map((n) => {
          const p = lookup.get(n.id);
          if (!p) return null;
          const isCenter = n.ring === "center";
          const isActive = activeId === n.id;
          const fill = RING_STYLE[n.ring].fill;
          const nodeR = SVG_NODE_RADIUS[n.ring];
          const fontSize = SVG_LABEL_SIZE[n.ring];
          return (
            <g
              key={n.id}
              onMouseEnter={() => setActiveId(n.id)}
              onFocus={() => setActiveId(n.id)}
              onClick={() => setActiveId(n.id)}
              tabIndex={0}
              role="button"
              aria-label={n.label}
              style={{ cursor: "pointer" }}
            >
              <circle
                cx={p.cx}
                cy={p.cy}
                r={nodeR}
                fill={fill}
                opacity={isActive ? 1 : 0.88}
                stroke={isActive ? "#00d2ff" : "rgba(0,0,0,0.45)"}
                strokeWidth={isActive ? 2 : 1}
              />
              <text
                x={p.cx}
                y={p.cy + nodeR + (isCenter ? 18 : 13)}
                textAnchor="middle"
                fontSize={fontSize}
                fontFamily="ui-monospace, SFMono-Regular, monospace"
                fill={
                  isCenter
                    ? "#ffffff"
                    : n.ring === "projects"
                      ? "rgba(255,255,255,0.85)"
                      : n.ring === "focus"
                        ? "rgba(255,255,255,0.6)"
                        : "rgba(255,255,255,0.42)"
                }
                letterSpacing={1}
                style={{ pointerEvents: "none" }}
              >
                {n.label.toUpperCase()}
              </text>
            </g>
          );
        })}
      </svg>

      {/* Inline caption — same content the 3D tooltip would show.
          Always rendered (defaults to Emre Doğan) so the layout
          doesn't shift when the visitor taps a different node. */}
      {activeNode && activeNode.blurb && (
        <div
          className="mt-3 rounded-lg border border-[#00d2ff]/15 bg-white/[0.03] px-3 py-2 text-xs leading-relaxed text-white/75"
          role="status"
          aria-live="polite"
        >
          <div className="font-mono uppercase tracking-[0.18em] text-[10px] text-[#00d2ff] mb-1">
            {activeNode.label}
          </div>
          {activeNode.blurb}
        </div>
      )}
    </div>
  );
}
