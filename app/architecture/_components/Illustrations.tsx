"use client";

import { motion, useReducedMotion } from "motion/react";

/**
 * Per-milestone SVG illustrations.
 *
 * All eight live in one module so the bundler can ship them as a
 * single chunk alongside ScrollStory rather than fragmenting into
 * tiny per-file imports. Pure SVG + motion/react primitives — no
 * raster assets, no new dependencies, no Three.js for this page.
 *
 * Design rules:
 *   - viewBox 0 0 240 180 (4:3) so each illustration sits cleanly
 *     under the milestone's body text without dominating it.
 *   - Single-color cyan strokes on the dark background, white fills
 *     for emphasis. Same #00d2ff #ffffff palette as the rest of the
 *     site. No new hues.
 *   - Subtle motion/react loops where motion adds clarity (data
 *     populating, recurring cycle, multi-region fan-out). Static
 *     under prefers-reduced-motion.
 */

const STROKE = "#00d2ff";
const STROKE_DIM = "rgba(0, 210, 255, 0.35)";
const FRAME = "rgba(255, 255, 255, 0.12)";
const FRAME_FILL = "rgba(255, 255, 255, 0.02)";
const LABEL = "rgba(255, 255, 255, 0.55)";
const TEXT = "#ffffff";

const EASE = [0.22, 1, 0.36, 1] as const;

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

/* 01 — Cognito signup. Abstract form: title bar, two input rows,
   primary submit, tiny Google badge in the corner. */
export function SignupIllustration({ className }: IllustrationProps) {
  return (
    <SvgWrapper
      className={className}
      ariaLabel="Sign-up form with Google identity provider badge"
    >
      <rect x="40" y="30" width="160" height="120" rx="10" fill={FRAME_FILL} stroke={FRAME} />
      <text x="56" y="56" fontSize="9" fontFamily="monospace" fill={LABEL} letterSpacing="2">CREATE ACCOUNT</text>
      <rect x="56" y="72" width="128" height="14" rx="4" fill="none" stroke={STROKE_DIM} />
      <rect x="56" y="94" width="128" height="14" rx="4" fill="none" stroke={STROKE_DIM} />
      <rect x="56" y="118" width="128" height="20" rx="6" fill={STROKE} />
      <text x="120" y="131" fontSize="9" fontFamily="monospace" fill="#000" textAnchor="middle" letterSpacing="2">SIGN IN</text>
      <circle cx="190" cy="40" r="9" fill={FRAME_FILL} stroke={FRAME} />
      <text x="190" y="44" fontSize="10" textAnchor="middle" fill={TEXT} fontFamily="sans-serif">G</text>
    </SvgWrapper>
  );
}

/* 02 — STS AssumeRole. Two account boxes connected by an arrow with
   an external_id key glyph on top. */
export function AssumeRoleIllustration({ className }: IllustrationProps) {
  return (
    <SvgWrapper
      className={className}
      ariaLabel="STS AssumeRole trust between two AWS accounts"
    >
      <rect x="20" y="60" width="78" height="60" rx="8" fill={FRAME_FILL} stroke={FRAME} />
      <text x="59" y="78" fontSize="8" textAnchor="middle" fill={LABEL} fontFamily="monospace" letterSpacing="2">CUSTOMER</text>
      <text x="59" y="100" fontSize="11" textAnchor="middle" fill={TEXT} fontFamily="monospace">aws</text>
      <rect x="142" y="60" width="78" height="60" rx="8" fill={FRAME_FILL} stroke={FRAME} />
      <text x="181" y="78" fontSize="8" textAnchor="middle" fill={LABEL} fontFamily="monospace" letterSpacing="2">CWH</text>
      <text x="181" y="100" fontSize="11" textAnchor="middle" fill={TEXT} fontFamily="monospace">aws</text>
      <line x1="98" y1="90" x2="142" y2="90" stroke={STROKE} strokeWidth="1.5" />
      <polygon points="142,90 134,86 134,94" fill={STROKE} />
      <text x="120" y="76" fontSize="8" textAnchor="middle" fill={LABEL} fontFamily="monospace" letterSpacing="2">ASSUME ROLE</text>
      <rect x="112" y="103" width="16" height="10" rx="2" fill="none" stroke={STROKE} />
      <circle cx="117" cy="108" r="2" fill={STROKE} />
      <text x="120" y="135" fontSize="7" textAnchor="middle" fill={LABEL} fontFamily="monospace" letterSpacing="1.5">EXTERNAL ID</text>
    </SvgWrapper>
  );
}

/* 03 — Lambda trigger. API Gateway pill feeds a Lambda hexagon with
   a slow pulse — execution heartbeat. */
export function LambdaTriggerIllustration({ className }: IllustrationProps) {
  const prefersReducedMotion = useReducedMotion();
  return (
    <SvgWrapper
      className={className}
      ariaLabel="API Gateway invoking the Lambda scanner"
    >
      <rect x="20" y="78" width="70" height="24" rx="12" fill={FRAME_FILL} stroke={FRAME} />
      <text x="55" y="93" fontSize="9" textAnchor="middle" fill={TEXT} fontFamily="monospace">API GW</text>
      <line x1="90" y1="90" x2="124" y2="90" stroke={STROKE_DIM} strokeWidth="1.5" />
      <polygon points="124,90 116,86 116,94" fill={STROKE_DIM} />
      <motion.g
        animate={prefersReducedMotion ? undefined : { scale: [1, 1.06, 1], opacity: [0.85, 1, 0.85] }}
        transition={{ duration: 2.6, repeat: Infinity, ease: "easeInOut" }}
        style={{ transformOrigin: "166px 90px", transformBox: "fill-box" }}
      >
        <polygon
          points="166,60 192,75 192,105 166,120 140,105 140,75"
          fill={FRAME_FILL}
          stroke={STROKE}
          strokeWidth="1.5"
        />
        <text x="166" y="94" fontSize="10" textAnchor="middle" fill={TEXT} fontFamily="monospace">λ</text>
      </motion.g>
      <text x="166" y="146" fontSize="8" textAnchor="middle" fill={LABEL} fontFamily="monospace" letterSpacing="2">SCANNER</text>
    </SvgWrapper>
  );
}

/* 04 — Multi-region fan-out. Center Lambda → six region pills. */
export function FanOutIllustration({ className }: IllustrationProps) {
  const prefersReducedMotion = useReducedMotion();
  const regions = ["us-east-1", "us-west-2", "eu-west-1", "eu-north-1", "ap-south-1", "ap-east-1"];
  const cx = 120;
  const cy = 90;
  return (
    <SvgWrapper
      className={className}
      ariaLabel="Lambda fanning out scans across six AWS regions"
    >
      <circle cx={cx} cy={cy} r="16" fill={FRAME_FILL} stroke={STROKE} strokeWidth="1.5" />
      <text x={cx} y={cy + 4} fontSize="11" textAnchor="middle" fill={TEXT} fontFamily="monospace">λ</text>
      {regions.map((r, i) => {
        const angle = (i / regions.length) * Math.PI * 2 - Math.PI / 2;
        const targetX = cx + Math.cos(angle) * 70;
        const targetY = cy + Math.sin(angle) * 55;
        const startX = cx + Math.cos(angle) * 18;
        const startY = cy + Math.sin(angle) * 18;
        return (
          <g key={r}>
            <motion.line
              x1={startX}
              y1={startY}
              x2={targetX}
              y2={targetY}
              stroke={STROKE}
              strokeWidth="1"
              strokeOpacity={0.7}
              initial={prefersReducedMotion ? undefined : { pathLength: 0 }}
              animate={prefersReducedMotion ? undefined : { pathLength: [0, 1, 1] }}
              transition={{
                duration: 2,
                repeat: Infinity,
                repeatDelay: 1.5,
                delay: i * 0.12,
                ease: "easeOut",
              }}
            />
            <circle cx={targetX} cy={targetY} r="3" fill={STROKE} />
            <text
              x={targetX}
              y={targetY + (Math.sin(angle) > 0 ? 14 : -8)}
              fontSize="7"
              textAnchor="middle"
              fill={LABEL}
              fontFamily="monospace"
            >
              {r}
            </text>
          </g>
        );
      })}
    </SvgWrapper>
  );
}

/* 05 — DynamoDB. A table populates row by row in a slow loop. */
export function DynamoIllustration({ className }: IllustrationProps) {
  const prefersReducedMotion = useReducedMotion();
  const rows = 6;
  return (
    <SvgWrapper
      className={className}
      ariaLabel="DynamoDB table populating with scan findings"
    >
      <rect x="36" y="22" width="168" height="136" rx="8" fill={FRAME_FILL} stroke={FRAME} />
      <text x="48" y="42" fontSize="8" fontFamily="monospace" fill={LABEL} letterSpacing="2">FINDINGS</text>
      <line x1="48" y1="50" x2="192" y2="50" stroke={FRAME} />
      {Array.from({ length: rows }).map((_, i) => (
        <motion.g
          key={i}
          initial={prefersReducedMotion ? undefined : { opacity: 0.15 }}
          animate={prefersReducedMotion ? undefined : { opacity: [0.15, 1, 1, 0.15] }}
          transition={{
            duration: 4,
            repeat: Infinity,
            repeatDelay: 0.5,
            delay: i * 0.35,
            ease: "easeInOut",
          }}
        >
          <rect x="48" y={62 + i * 14} width="12" height="8" rx="2" fill={STROKE} opacity={prefersReducedMotion ? 0.45 : undefined} />
          <rect x="66" y={62 + i * 14} width="80" height="8" rx="2" fill={STROKE_DIM} />
          <rect x="152" y={62 + i * 14} width="40" height="8" rx="2" fill={STROKE_DIM} />
        </motion.g>
      ))}
    </SvgWrapper>
  );
}

/* 06 — Bedrock remediation. Card with three streaming lines of
   "code" appearing one after another. */
export function BedrockIllustration({ className }: IllustrationProps) {
  const prefersReducedMotion = useReducedMotion();
  const lines = [
    "// delete unattached volume",
    "aws ec2 delete-volume \\",
    "  --volume-id vol-0a1b2c3d",
  ];
  return (
    <SvgWrapper
      className={className}
      ariaLabel="Claude streaming remediation snippet"
    >
      <rect x="20" y="24" width="200" height="132" rx="8" fill={FRAME_FILL} stroke={FRAME} />
      <text x="36" y="44" fontSize="8" fontFamily="monospace" fill={LABEL} letterSpacing="2">claude · bedrock</text>
      <line x1="36" y1="52" x2="204" y2="52" stroke={FRAME} />
      {lines.map((l, i) => (
        <motion.text
          key={i}
          x="36"
          y={74 + i * 18}
          fontSize="9"
          fontFamily="monospace"
          fill={i === 0 ? LABEL : STROKE}
          initial={prefersReducedMotion ? undefined : { opacity: 0 }}
          animate={prefersReducedMotion ? undefined : { opacity: [0, 1, 1, 1] }}
          transition={{
            duration: 3.5,
            repeat: Infinity,
            repeatDelay: 1.5,
            delay: i * 0.7,
            ease: "linear",
          }}
        >
          {l}
        </motion.text>
      ))}
      <motion.rect
        x={36}
        y={74 + (lines.length - 1) * 18 + 4}
        width="2"
        height="11"
        fill={STROKE}
        animate={prefersReducedMotion ? undefined : { opacity: [1, 0, 1] }}
        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
      />
    </SvgWrapper>
  );
}

/* 07 — Dashboard mockup. A compact stat card with the headline
   number + a fix button. */
export function DashboardIllustration({ className }: IllustrationProps) {
  return (
    <SvgWrapper
      className={className}
      ariaLabel="Customer dashboard showing quantified waste savings"
    >
      <rect x="22" y="24" width="196" height="132" rx="10" fill={FRAME_FILL} stroke={FRAME} />
      <text x="38" y="44" fontSize="8" fontFamily="monospace" fill={LABEL} letterSpacing="2">MONTHLY WASTE IDENTIFIED</text>
      <text x="38" y="80" fontSize="26" fontFamily="sans-serif" fontWeight="600" fill={TEXT}>$42,500</text>
      <text x="38" y="100" fontSize="9" fontFamily="monospace" fill={LABEL}>across 14 accounts · 6 regions</text>
      <rect x="38" y="116" width="60" height="22" rx="11" fill={STROKE} />
      <text x="68" y="130" fontSize="9" fontFamily="monospace" textAnchor="middle" fill="#000" letterSpacing="2">FIX ALL</text>
      <rect x="106" y="116" width="76" height="22" rx="11" fill="none" stroke={FRAME} />
      <text x="144" y="130" fontSize="9" fontFamily="monospace" textAnchor="middle" fill={LABEL} letterSpacing="2">REVIEW</text>
    </SvgWrapper>
  );
}

/* 08 — EventBridge cycle. Four nodes around a slowly rotating
   cyan ring. */
export function EventBridgeIllustration({ className }: IllustrationProps) {
  const prefersReducedMotion = useReducedMotion();
  const steps = ["scan", "store", "remediate", "schedule"];
  const cx = 120;
  const cy = 90;
  const r = 50;
  return (
    <SvgWrapper
      className={className}
      ariaLabel="EventBridge scheduling recurring scans in a loop"
    >
      <motion.circle
        cx={cx}
        cy={cy}
        r={r}
        fill="none"
        stroke={STROKE_DIM}
        strokeWidth="1"
        strokeDasharray="3 4"
        animate={prefersReducedMotion ? undefined : { rotate: 360 }}
        transition={{ duration: 22, repeat: Infinity, ease: "linear" }}
        style={{ transformOrigin: `${cx}px ${cy}px` }}
      />
      {steps.map((s, i) => {
        const angle = (i / steps.length) * Math.PI * 2 - Math.PI / 2;
        const x = cx + Math.cos(angle) * r;
        const y = cy + Math.sin(angle) * r;
        return (
          <g key={s}>
            <circle cx={x} cy={y} r="6" fill={STROKE} />
            <text
              x={x}
              y={y + (Math.sin(angle) > 0 ? 18 : -12)}
              fontSize="8"
              textAnchor="middle"
              fill={LABEL}
              fontFamily="monospace"
              letterSpacing="1.5"
            >
              {s.toUpperCase()}
            </text>
          </g>
        );
      })}
      <text x={cx} y={cy + 4} fontSize="9" textAnchor="middle" fill={TEXT} fontFamily="monospace" letterSpacing="1.5">EVENTBRIDGE</text>
    </SvgWrapper>
  );
}

/* ── Dispatch ────────────────────────────────────────────────────── */

export const ILLUSTRATION_BY_ID: Record<
  string,
  (p: IllustrationProps) => React.ReactNode
> = {
  signup: SignupIllustration,
  "assume-role": AssumeRoleIllustration,
  "lambda-trigger": LambdaTriggerIllustration,
  fanout: FanOutIllustration,
  dynamodb: DynamoIllustration,
  bedrock: BedrockIllustration,
  dashboard: DashboardIllustration,
  eventbridge: EventBridgeIllustration,
};

void EASE; // re-exported for downstream Step 3 if needed
