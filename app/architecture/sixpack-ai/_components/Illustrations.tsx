"use client";

import { motion, useReducedMotion } from "motion/react";
import type { IllustrationsById } from "../../_components/types";

/**
 * SixPack AI illustrations — four 4:3 SVG vignettes, cyan-only,
 * same visual register as the CWH + VCAI sets.
 */

const STROKE = "#00d2ff";
const STROKE_DIM = "rgba(0, 210, 255, 0.35)";
const FRAME = "rgba(255, 255, 255, 0.12)";
const FRAME_FILL = "rgba(255, 255, 255, 0.02)";
const LABEL = "rgba(255, 255, 255, 0.55)";
const TEXT = "#ffffff";

interface IllustrationProps {
  className?: string;
}

function SvgWrapper({
  className,
  children,
  ariaLabel,
}: {
  className?: string;
  children: React.ReactNode;
  ariaLabel: string;
}) {
  return (
    <svg
      role="img"
      aria-label={ariaLabel}
      viewBox="0 0 240 180"
      className={className ?? "w-full h-auto"}
      xmlns="http://www.w3.org/2000/svg"
    >
      {children}
    </svg>
  );
}

/* 01 — Phone outline with Flutter blue-bird-style icon + workout UI. */
function EdgeClientIllustration({ className }: IllustrationProps) {
  return (
    <SvgWrapper
      className={className}
      ariaLabel="Flutter app running on iOS and Android"
    >
      {/* Phone frame */}
      <rect x="84" y="20" width="72" height="140" rx="10" fill={FRAME_FILL} stroke={FRAME} strokeWidth="1.5" />
      <rect x="92" y="32" width="56" height="112" rx="4" fill="none" stroke={FRAME} />
      {/* Notch */}
      <rect x="108" y="22" width="24" height="4" rx="2" fill={FRAME} />
      {/* App content */}
      <text x="120" y="48" fontSize="6" fontFamily="monospace" textAnchor="middle" fill={LABEL} letterSpacing="1.5">
        WORKOUT 04
      </text>
      <rect x="96" y="56" width="48" height="32" rx="4" fill={STROKE} opacity="0.15" />
      <text x="120" y="76" fontSize="16" fontFamily="sans-serif" textAnchor="middle" fontWeight="600" fill={TEXT}>
        15
      </text>
      <text x="120" y="84" fontSize="5" fontFamily="monospace" textAnchor="middle" fill={LABEL}>
        REPS LEFT
      </text>
      {/* Detail rows */}
      <rect x="96" y="96" width="48" height="6" rx="2" fill={STROKE_DIM} />
      <rect x="96" y="106" width="36" height="6" rx="2" fill={STROKE_DIM} />
      <rect x="96" y="124" width="48" height="14" rx="6" fill={STROKE} />
      <text x="120" y="134" fontSize="6" fontFamily="monospace" textAnchor="middle" fill="#000" letterSpacing="1.5">
        NEXT SET
      </text>
      {/* Platform labels */}
      <text x="44" y="92" fontSize="8" fontFamily="monospace" fill={LABEL} letterSpacing="2">iOS</text>
      <text x="196" y="92" fontSize="8" fontFamily="monospace" fill={LABEL} letterSpacing="2">Android</text>
    </SvgWrapper>
  );
}

/* 02 — Pose detection: a stick figure with landmark dots. */
function NeuralEngineIllustration({ className }: IllustrationProps) {
  const prefersReducedMotion = useReducedMotion();
  // 9 landmark positions on a simplified human skeleton.
  const landmarks = [
    { x: 120, y: 40 },   // head
    { x: 105, y: 70 },   // L shoulder
    { x: 135, y: 70 },   // R shoulder
    { x: 90, y: 100 },   // L elbow
    { x: 150, y: 100 },  // R elbow
    { x: 120, y: 95 },   // chest
    { x: 110, y: 130 },  // L hip
    { x: 130, y: 130 },  // R hip
    { x: 120, y: 70 },   // neck
  ];
  // Skeleton lines connecting landmarks.
  const skeleton: [number, number][] = [
    [0, 8], [8, 1], [8, 2], [1, 3], [2, 4],
    [8, 5], [5, 6], [5, 7],
  ];
  return (
    <SvgWrapper
      className={className}
      ariaLabel="Real-time pose detection with 33 body landmarks"
    >
      {/* Camera viewfinder frame */}
      <rect x="32" y="22" width="176" height="136" rx="8" fill={FRAME_FILL} stroke={FRAME} />
      {/* Viewfinder corner brackets */}
      <path d="M 40,30 L 40,46 M 40,30 L 56,30" stroke={STROKE_DIM} strokeWidth="1.5" fill="none" />
      <path d="M 200,30 L 200,46 M 200,30 L 184,30" stroke={STROKE_DIM} strokeWidth="1.5" fill="none" />
      <path d="M 40,150 L 40,134 M 40,150 L 56,150" stroke={STROKE_DIM} strokeWidth="1.5" fill="none" />
      <path d="M 200,150 L 200,134 M 200,150 L 184,150" stroke={STROKE_DIM} strokeWidth="1.5" fill="none" />

      {/* Skeleton lines */}
      {skeleton.map(([a, b], i) => (
        <line
          key={i}
          x1={landmarks[a].x}
          y1={landmarks[a].y}
          x2={landmarks[b].x}
          y2={landmarks[b].y}
          stroke={STROKE_DIM}
          strokeWidth="1"
        />
      ))}

      {/* Landmark dots with pulse */}
      {landmarks.map((p, i) => (
        <motion.circle
          key={i}
          cx={p.x}
          cy={p.y}
          r="2.5"
          fill={STROKE}
          animate={prefersReducedMotion ? undefined : { opacity: [0.5, 1, 0.5] }}
          transition={{
            duration: 1.8,
            repeat: Infinity,
            delay: i * 0.08,
            ease: "easeInOut",
          }}
        />
      ))}

      <text x="120" y="170" fontSize="7" textAnchor="middle" fill={LABEL} fontFamily="monospace" letterSpacing="2">
        30 FPS · ON-DEVICE
      </text>
    </SvgWrapper>
  );
}

/* 03 — Cloud + bidirectional sync arrows. */
function SyncIllustration({ className }: IllustrationProps) {
  const prefersReducedMotion = useReducedMotion();
  return (
    <SvgWrapper
      className={className}
      ariaLabel="Supabase real-time sync between client and Postgres"
    >
      {/* Phone left */}
      <rect x="28" y="64" width="44" height="60" rx="6" fill={FRAME_FILL} stroke={FRAME} />
      <rect x="34" y="72" width="32" height="44" rx="2" fill="none" stroke={FRAME} />
      <text x="50" y="138" fontSize="7" textAnchor="middle" fill={LABEL} fontFamily="monospace" letterSpacing="1.5">
        CLIENT
      </text>

      {/* Sync arrows */}
      <motion.path
        d="M 76,82 L 120,82 L 120,72 L 132,87 L 120,102 L 120,92 L 76,92 Z"
        fill={STROKE}
        opacity="0.85"
        animate={prefersReducedMotion ? undefined : { opacity: [0.6, 1, 0.6] }}
        transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.path
        d="M 164,98 L 120,98 L 120,108 L 108,93 L 120,78 L 120,88 L 164,88 Z"
        fill={STROKE}
        opacity="0.5"
        animate={prefersReducedMotion ? undefined : { opacity: [0.3, 0.7, 0.3] }}
        transition={{ duration: 1.8, repeat: Infinity, delay: 0.9, ease: "easeInOut" }}
      />

      {/* Cloud right (database stack) */}
      <rect x="156" y="60" width="58" height="14" rx="5" fill={STROKE} />
      <rect x="156" y="80" width="58" height="36" rx="6" fill={FRAME_FILL} stroke={STROKE} strokeWidth="1.5" />
      <rect x="156" y="122" width="58" height="6" rx="3" fill={STROKE_DIM} />
      <text x="185" y="71" fontSize="7" textAnchor="middle" fill="#000" fontFamily="monospace" letterSpacing="1.5">
        SUPABASE
      </text>
      <text x="185" y="103" fontSize="9" textAnchor="middle" fill={TEXT} fontFamily="monospace">
        postgres
      </text>
      <text x="185" y="146" fontSize="7" textAnchor="middle" fill={LABEL} fontFamily="monospace" letterSpacing="1.5">
        REAL-TIME
      </text>
    </SvgWrapper>
  );
}

/* 04 — Subscription card. */
function MonetizationIllustration({ className }: IllustrationProps) {
  return (
    <SvgWrapper
      className={className}
      ariaLabel="RevenueCat unified subscription paywall"
    >
      <rect x="32" y="28" width="176" height="124" rx="10" fill={FRAME_FILL} stroke={FRAME} />
      <text x="44" y="48" fontSize="8" fontFamily="monospace" fill={LABEL} letterSpacing="2">
        SIXPACK AI · PRO
      </text>
      <line x1="44" y1="56" x2="196" y2="56" stroke={FRAME} />

      <text x="44" y="80" fontSize="22" fontFamily="sans-serif" fontWeight="600" fill={TEXT}>
        $9.99
      </text>
      <text x="118" y="80" fontSize="10" fontFamily="monospace" fill={LABEL}>
        / month
      </text>

      <g fontFamily="monospace" fontSize="7" fill={LABEL}>
        <text x="44" y="100">
          <tspan fill={STROKE}>✓</tspan>  Unlimited workout programmes
        </text>
        <text x="44" y="114">
          <tspan fill={STROKE}>✓</tspan>  Real-time form correction
        </text>
        <text x="44" y="128">
          <tspan fill={STROKE}>✓</tspan>  Nutrition + macro tracking
        </text>
      </g>

      {/* RevenueCat unified badge */}
      <rect x="142" y="124" width="58" height="18" rx="9" fill={STROKE} />
      <text x="171" y="135" fontSize="7" fontFamily="monospace" textAnchor="middle" fill="#000" letterSpacing="1.5">
        REVENUECAT
      </text>
    </SvgWrapper>
  );
}

export const ILLUSTRATION_BY_ID: IllustrationsById = {
  "edge-client": EdgeClientIllustration,
  "neural-engine": NeuralEngineIllustration,
  sync: SyncIllustration,
  monetization: MonetizationIllustration,
};
