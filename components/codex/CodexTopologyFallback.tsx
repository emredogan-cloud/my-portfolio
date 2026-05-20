"use client";

/**
 * 2D SVG fallback for the narrative constellation. Used on:
 *   - viewports < 768px
 *   - prefers-reduced-motion
 *
 * Pure SVG. No three.js bundle. Same polar projection as the 3D
 * scene, with tap-to-reveal caption inline below the diagram —
 * works much better on touch screens than per-node tooltips.
 *
 * Mirrors components/home/HeroTopologyFallback.tsx, generalised to
 * accept any book's nodes + edges so /codex/[slug] can reuse it.
 */

import { useMemo, useState } from "react";
import type { CodexNode, CodexEdge, CodexRing } from "@/data/codex";

const W = 600;
const H = 560;
const CX = W / 2;
const CY = H / 2;

const SVG_RING_RADIUS: Record<CodexRing, number> = {
  center: 0,
  primary: 110,
  secondary: 180,
  tertiary: 250,
};

const SVG_NODE_RADIUS: Record<CodexRing, number> = {
  center: 14,
  primary: 9,
  secondary: 6,
  tertiary: 4,
};

const SVG_LABEL_SIZE: Record<CodexRing, number> = {
  center: 11,
  primary: 9,
  secondary: 8,
  tertiary: 7,
};

const RING_FILL: Record<CodexRing, string> = {
  center: "#ffffff",
  primary: "#00d2ff",
  secondary: "#5db4f5",
  tertiary: "#aee5ff",
};

interface Placed {
  id: string;
  cx: number;
  cy: number;
}

function place(nodes: readonly CodexNode[]): Placed[] {
  return nodes.map((n) => {
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

interface Props {
  nodes: readonly CodexNode[];
  edges: readonly CodexEdge[];
}

export default function CodexTopologyFallback({ nodes, edges }: Props) {
  const placed = useMemo(() => place(nodes), [nodes]);
  const lookup = useMemo(
    () => new Map(placed.map((p) => [p.id, p])),
    [placed],
  );
  const centerId = useMemo(
    () => nodes.find((n) => n.ring === "center")?.id ?? "",
    [nodes],
  );
  const nodeRingById = useMemo(
    () => new Map(nodes.map((n) => [n.id, n.ring])),
    [nodes],
  );
  const [activeId, setActiveId] = useState<string | null>(centerId);
  const activeNode = nodes.find((n) => n.id === activeId);

  return (
    <div className="w-full">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        role="img"
        aria-label="Narrative constellation — central axis orbited by primary, secondary, and tertiary lore"
        className="block w-full h-auto max-h-[520px]"
      >
        {/* Ring guides — subtle, dashed, descending opacity */}
        <circle
          cx={CX}
          cy={CY}
          r={SVG_RING_RADIUS.primary}
          fill="none"
          stroke="rgba(0,210,255,0.10)"
          strokeWidth={1}
          strokeDasharray="2 6"
        />
        <circle
          cx={CX}
          cy={CY}
          r={SVG_RING_RADIUS.secondary}
          fill="none"
          stroke="rgba(0,210,255,0.08)"
          strokeWidth={1}
          strokeDasharray="2 6"
        />
        <circle
          cx={CX}
          cy={CY}
          r={SVG_RING_RADIUS.tertiary}
          fill="none"
          stroke="rgba(0,210,255,0.06)"
          strokeWidth={1}
          strokeDasharray="2 6"
        />

        {/* Edges, tiered opacity matching the 3D scene */}
        {edges.map((e, i) => {
          const a = lookup.get(e.from);
          const b = lookup.get(e.to);
          if (!a || !b) return null;
          const sourceRing = nodeRingById.get(e.from);
          const stroke =
            e.from === centerId
              ? "rgba(0,210,255,0.42)"
              : sourceRing === "primary"
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
        {nodes.map((n) => {
          const p = lookup.get(n.id);
          if (!p) return null;
          const isCenter = n.ring === "center";
          const isActive = activeId === n.id;
          const fill = RING_FILL[n.ring];
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
                    : n.ring === "primary"
                      ? "rgba(255,255,255,0.85)"
                      : n.ring === "secondary"
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

      {activeNode && activeNode.blurb && (
        <div
          className="mt-3 rounded-lg border border-[#00d2ff]/15 bg-white/[0.03] px-3 py-2 text-xs leading-relaxed text-primary"
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
