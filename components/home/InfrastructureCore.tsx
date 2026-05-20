"use client";

import { motion, useReducedMotion } from "motion/react";

/**
 * InfrastructureCore — the home hero's right-column anchor.
 *
 * Visual metaphor: a central "core" surrounded by five domain
 * nodes representing the disciplines Emre actually works in —
 * Cloud, AI, Data, Mobile, Edge. Thin cyan filaments connect
 * the core to each node; a slow dashed perimeter rotates around
 * the whole thing. Each node pulses on a staggered cycle so the
 * piece feels alive without any single big rotation that would
 * compete with the hero's text-reveal animation on the left.
 *
 * Cinematic identity respected:
 *   - Cyan #00d2ff only. No new accents.
 *   - Pure SVG + motion/react. No three.js on the home route.
 *   - useReducedMotion freezes every loop; the piece reads
 *     fine as a static diagram.
 */

const NODES = [
  { id: "cloud", label: "Cloud", angle: -90 },
  { id: "ai", label: "AI", angle: -18 },
  { id: "data", label: "Data", angle: 54 },
  { id: "mobile", label: "Mobile", angle: 126 },
  { id: "edge", label: "Edge", angle: -162 },
];

const CENTER = 200;
const NODE_RADIUS = 140;
const LABEL_RADIUS = 175;

interface PolarPoint {
  x: number;
  y: number;
}

function polar(angleDeg: number, radius: number): PolarPoint {
  const a = (angleDeg * Math.PI) / 180;
  return {
    x: CENTER + Math.cos(a) * radius,
    y: CENTER + Math.sin(a) * radius,
  };
}

export default function InfrastructureCore() {
  const prefersReducedMotion = useReducedMotion();

  return (
    <div className="relative w-full max-w-[480px] mx-auto aspect-square">
      <svg
        viewBox="0 0 400 400"
        role="img"
        aria-label="Cloud & AI infrastructure constellation — five domain nodes orbiting a central compute core"
        className="w-full h-full"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Outer dashed ring — slow rotation gives ambient motion
            without dragging the eye away from the labels. */}
        <motion.circle
          cx={CENTER}
          cy={CENTER}
          r={NODE_RADIUS + 18}
          fill="none"
          stroke="rgba(0,210,255,0.12)"
          strokeWidth="1"
          strokeDasharray="2 6"
          animate={
            prefersReducedMotion ? undefined : { rotate: 360 }
          }
          transition={{
            duration: 80,
            repeat: Infinity,
            ease: "linear",
          }}
          style={{ transformOrigin: `${CENTER}px ${CENTER}px` }}
        />

        {/* Faint inner ring guides depth without competing with the
            node ring above. */}
        <circle
          cx={CENTER}
          cy={CENTER}
          r={70}
          fill="none"
          stroke="rgba(0,210,255,0.06)"
        />

        {/* Filament + node + label per domain. Filaments fade
            slightly so the central core stays dominant. */}
        {NODES.map((n, i) => {
          const node = polar(n.angle, NODE_RADIUS);
          const label = polar(n.angle, LABEL_RADIUS);
          return (
            <g key={n.id}>
              {/* Filament */}
              <line
                x1={CENTER}
                y1={CENTER}
                x2={node.x}
                y2={node.y}
                stroke="rgba(0,210,255,0.22)"
                strokeWidth="1"
              />

              {/* Node — pulsing ring + solid dot */}
              <motion.circle
                cx={node.x}
                cy={node.y}
                r="14"
                fill="none"
                stroke="rgba(0,210,255,0.55)"
                strokeWidth="1"
                animate={
                  prefersReducedMotion
                    ? undefined
                    : {
                        opacity: [0.6, 0, 0.6],
                        scale: [1, 1.6, 1],
                      }
                }
                transition={{
                  duration: 3.2,
                  repeat: Infinity,
                  delay: i * 0.5,
                  ease: "easeInOut",
                }}
                style={{ transformOrigin: `${node.x}px ${node.y}px` }}
              />
              <circle cx={node.x} cy={node.y} r="6" fill="#00d2ff" />

              {/* Label */}
              <text
                x={label.x}
                y={label.y + 4}
                fontSize="11"
                textAnchor="middle"
                fill="rgba(255,255,255,0.55)"
                fontFamily="ui-monospace, SFMono-Regular, monospace"
                letterSpacing="2"
              >
                {n.label.toUpperCase()}
              </text>
            </g>
          );
        })}

        {/* Central core: pulsing white-rimmed cyan disc. */}
        <motion.circle
          cx={CENTER}
          cy={CENTER}
          r="36"
          fill="rgba(0,210,255,0.18)"
          animate={
            prefersReducedMotion
              ? undefined
              : { scale: [1, 1.08, 1], opacity: [0.8, 1, 0.8] }
          }
          transition={{ duration: 2.8, repeat: Infinity, ease: "easeInOut" }}
          style={{ transformOrigin: `${CENTER}px ${CENTER}px` }}
        />
        <circle
          cx={CENTER}
          cy={CENTER}
          r="22"
          fill="#00d2ff"
        />
        <circle
          cx={CENTER}
          cy={CENTER}
          r="22"
          fill="none"
          stroke="rgba(255,255,255,0.35)"
          strokeWidth="1"
        />
        <text
          x={CENTER}
          y={CENTER + 4}
          fontSize="9"
          textAnchor="middle"
          fill="#0a0a0a"
          fontFamily="ui-monospace, SFMono-Regular, monospace"
          fontWeight="700"
          letterSpacing="1.5"
        >
          CORE
        </text>
      </svg>

      {/* Static caption underneath — anchors the visual semantically
          for visitors who don't read the labels and helps SEO. */}
      <p
        className="absolute bottom-0 left-0 right-0 text-center text-[10px] font-mono uppercase tracking-[0.22em] text-tertiary"
        aria-hidden="true"
      >
        Cloud · AI · Production
      </p>
    </div>
  );
}
