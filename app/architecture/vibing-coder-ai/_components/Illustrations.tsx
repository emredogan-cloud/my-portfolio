"use client";

import { motion, useReducedMotion } from "motion/react";
import type { IllustrationsById } from "../../_components/types";

/**
 * VibingCoderAI illustrations — four 4:3 SVG vignettes, cyan-only
 * palette, matching the visual language of the CWH set.
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

/* 01 — Browser frame containing the prompt-translation UI. */
function InterfaceIllustration({ className }: IllustrationProps) {
  return (
    <SvgWrapper
      className={className}
      ariaLabel="Next.js prompt translation interface"
    >
      <rect x="20" y="22" width="200" height="136" rx="8" fill={FRAME_FILL} stroke={FRAME} />
      {/* Window chrome */}
      <circle cx="32" cy="34" r="2.5" fill={STROKE_DIM} />
      <circle cx="42" cy="34" r="2.5" fill={STROKE_DIM} />
      <circle cx="52" cy="34" r="2.5" fill={STROKE_DIM} />
      <rect x="64" y="30" width="140" height="9" rx="3" fill="none" stroke={FRAME} />
      <text x="74" y="36.5" fontSize="6" fontFamily="monospace" fill={LABEL}>
        vibingcoder.ai
      </text>
      {/* Input area */}
      <text x="36" y="62" fontSize="8" fontFamily="monospace" fill={LABEL} letterSpacing="2">
        IDEA
      </text>
      <rect x="36" y="68" width="168" height="34" rx="6" fill={FRAME_FILL} stroke={STROKE_DIM} />
      <text x="44" y="83" fontSize="7" fontFamily="monospace" fill={TEXT}>
        &quot;build a snake game with score tracking&quot;
      </text>
      {/* Arrow */}
      <line x1="120" y1="108" x2="120" y2="120" stroke={STROKE} strokeWidth="1.5" />
      <polygon points="120,120 116,114 124,114" fill={STROKE} />
      {/* Output area */}
      <rect x="36" y="124" width="168" height="22" rx="6" fill={STROKE} />
      <text x="120" y="139" fontSize="8" fontFamily="monospace" textAnchor="middle" fill="#000" letterSpacing="2">
        SENIOR-GRADE PROMPT
      </text>
    </SvgWrapper>
  );
}

/* 02 — Lambda hexagon paired with a Claude "C" mark, animated
   dotted "thinking" arc between them. */
function BrainIllustration({ className }: IllustrationProps) {
  const prefersReducedMotion = useReducedMotion();
  return (
    <SvgWrapper
      className={className}
      ariaLabel="Lambda calling Claude via the Anthropic SDK"
    >
      {/* Lambda hexagon */}
      <polygon
        points="50,60 76,75 76,105 50,120 24,105 24,75"
        fill={FRAME_FILL}
        stroke={STROKE}
        strokeWidth="1.5"
      />
      <text x="50" y="94" fontSize="11" textAnchor="middle" fill={TEXT} fontFamily="monospace">
        λ
      </text>
      <text x="50" y="138" fontSize="7" textAnchor="middle" fill={LABEL} fontFamily="monospace" letterSpacing="2">
        LAMBDA
      </text>

      {/* Animated dotted thinking line */}
      <motion.line
        x1="78"
        y1="90"
        x2="162"
        y2="90"
        stroke={STROKE_DIM}
        strokeWidth="1.5"
        strokeDasharray="3 4"
        animate={prefersReducedMotion ? undefined : { strokeDashoffset: [0, -14] }}
        transition={{ duration: 1.6, repeat: Infinity, ease: "linear" }}
      />
      <polygon points="162,90 154,86 154,94" fill={STROKE_DIM} />

      {/* Claude C-mark */}
      <circle cx="190" cy="90" r="26" fill={FRAME_FILL} stroke={STROKE} strokeWidth="1.5" />
      <path
        d="M 200,75 A 18,18 0 1,0 200,105"
        fill="none"
        stroke={STROKE}
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <text x="190" y="138" fontSize="7" textAnchor="middle" fill={LABEL} fontFamily="monospace" letterSpacing="2">
        CLAUDE
      </text>
    </SvgWrapper>
  );
}

/* 03 — Terraform monorepo tree. */
function InfrastructureIllustration({ className }: IllustrationProps) {
  return (
    <SvgWrapper
      className={className}
      ariaLabel="Decoupled monorepo with Terraform-provisioned infrastructure"
    >
      <rect x="32" y="24" width="176" height="132" rx="8" fill={FRAME_FILL} stroke={FRAME} />
      <text x="44" y="42" fontSize="8" fontFamily="monospace" fill={LABEL} letterSpacing="2">
        REPO
      </text>
      <line x1="44" y1="50" x2="196" y2="50" stroke={FRAME} />

      {/* Tree nodes */}
      <g fontFamily="monospace" fontSize="8">
        <text x="48" y="68" fill={TEXT}>📁 apps/</text>
        <text x="62" y="82" fill={LABEL}>├─ web/   <tspan fill={STROKE_DIM}>(Next.js · Vercel)</tspan></text>
        <text x="62" y="96" fill={LABEL}>└─ lambda/   <tspan fill={STROKE_DIM}>(ECR + Lambda)</tspan></text>
        <text x="48" y="114" fill={TEXT}>📁 infrastructure/</text>
        <text x="62" y="128" fill={LABEL}>├─ ecr.tf</text>
        <text x="62" y="142" fill={LABEL}>├─ lambda.tf</text>
      </g>

      {/* Terraform mark */}
      <rect x="156" y="64" width="40" height="14" rx="3" fill={STROKE} />
      <text x="176" y="74" fontSize="8" textAnchor="middle" fill="#000" fontFamily="monospace" letterSpacing="1.5">
        terraform
      </text>
    </SvgWrapper>
  );
}

/* 04 — DynamoDB table view, simpler than CWH's (4 rows, no
   per-row loop animation). */
function DataIllustration({ className }: IllustrationProps) {
  return (
    <SvgWrapper
      className={className}
      ariaLabel="DynamoDB table holding prompt history"
    >
      <rect x="32" y="28" width="176" height="124" rx="8" fill={FRAME_FILL} stroke={FRAME} />
      <text x="44" y="48" fontSize="8" fontFamily="monospace" fill={LABEL} letterSpacing="2">
        prompt_history
      </text>
      <line x1="44" y1="56" x2="196" y2="56" stroke={FRAME} />
      <text x="44" y="70" fontSize="7" fontFamily="monospace" fill={LABEL} letterSpacing="1.5">
        PK         SK              KIND
      </text>
      {[0, 1, 2, 3].map((i) => (
        <g key={i}>
          <rect x="44" y={80 + i * 16} width="14" height="8" rx="2" fill={STROKE} />
          <rect x="64" y={80 + i * 16} width="64" height="8" rx="2" fill={STROKE_DIM} />
          <rect x="134" y={80 + i * 16} width="58" height="8" rx="2" fill={STROKE_DIM} />
        </g>
      ))}
      <text x="120" y="146" fontSize="7" fontFamily="monospace" textAnchor="middle" fill={LABEL} letterSpacing="2">
        ON-DEMAND BILLING
      </text>
    </SvgWrapper>
  );
}

export const ILLUSTRATION_BY_ID: IllustrationsById = {
  interface: InterfaceIllustration,
  brain: BrainIllustration,
  infrastructure: InfrastructureIllustration,
  data: DataIllustration,
};
