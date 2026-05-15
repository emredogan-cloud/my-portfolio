"use client";

/**
 * 2D fallback rendering of the same Cloud Waste Hunter topology
 * graph. Used when:
 *   - viewport width < 768px (mobile), or
 *   - the visitor has prefers-reduced-motion enabled
 *
 * Pure SVG. No three.js bundle. Same node ids + same edges as the
 * 3D scene, so a visitor switching devices reads the same architecture.
 *
 * Layout is the polar projection of `angleDeg` onto an SVG ring; the
 * center node sits in the middle. Hovering or tapping a node surfaces
 * the blurb in a single inline caption — no per-node tooltip overlay,
 * which works much better on touch screens.
 */

import { useMemo, useState } from "react";
import {
  NODE_COLOR,
  TOPOLOGY_EDGES,
  TOPOLOGY_NODES,
} from "./topology-data";

const W = 360;
const H = 360;
const CX = W / 2;
const CY = H / 2;
const R = 140;

interface Placed {
  id: string;
  cx: number;
  cy: number;
}

function place(): Placed[] {
  return TOPOLOGY_NODES.map((n) => {
    if (n.id === "cwh") return { id: n.id, cx: CX, cy: CY };
    const a = (n.angleDeg / 360) * Math.PI * 2;
    return { id: n.id, cx: CX + Math.cos(a) * R, cy: CY + Math.sin(a) * R };
  });
}

export default function TopologyMobileFallback() {
  const placed = useMemo(place, []);
  const lookup = useMemo(
    () => new Map(placed.map((p) => [p.id, p])),
    [placed],
  );
  const [activeId, setActiveId] = useState<string | null>("cwh");

  const activeNode = TOPOLOGY_NODES.find((n) => n.id === activeId);

  return (
    <div className="w-full">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        role="img"
        aria-label="Cloud Waste Hunter AWS topology"
        className="block w-full h-auto max-h-[480px]"
      >
        {/* Ring guide — extremely subtle */}
        <circle
          cx={CX}
          cy={CY}
          r={R}
          fill="none"
          stroke="rgba(0,210,255,0.08)"
          strokeWidth={1}
        />

        {/* Edges */}
        {TOPOLOGY_EDGES.map((e, i) => {
          const a = lookup.get(e.from);
          const b = lookup.get(e.to);
          if (!a || !b) return null;
          return (
            <line
              key={i}
              x1={a.cx}
              y1={a.cy}
              x2={b.cx}
              y2={b.cy}
              stroke="rgba(0,210,255,0.32)"
              strokeWidth={1}
            />
          );
        })}

        {/* Nodes */}
        {TOPOLOGY_NODES.map((n) => {
          const p = lookup.get(n.id);
          if (!p) return null;
          const isCenter = n.id === "cwh";
          const isActive = activeId === n.id;
          const fill = NODE_COLOR[n.category];
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
                r={isCenter ? 12 : 8}
                fill={fill}
                opacity={isActive ? 1 : 0.85}
                stroke={isActive ? "#00d2ff" : "rgba(0,0,0,0.4)"}
                strokeWidth={isActive ? 2 : 1}
              />
              <text
                x={p.cx}
                y={p.cy + (isCenter ? 24 : 18)}
                textAnchor="middle"
                fontSize={isCenter ? 9 : 8}
                fontFamily="ui-monospace, SFMono-Regular, monospace"
                fill={isCenter ? "#ffffff" : "rgba(255,255,255,0.65)"}
                letterSpacing={1}
                style={{ pointerEvents: "none" }}
              >
                {n.label.toUpperCase()}
              </text>
            </g>
          );
        })}
      </svg>

      {/* Inline caption — same content the 3D tooltip would show. Always
          rendered (defaults to CWH) so the layout doesn't shift when
          the visitor taps a node. */}
      {activeNode && (
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
