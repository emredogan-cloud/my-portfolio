"use client";

import { motion, useReducedMotion } from "motion/react";

/**
 * Bento "Reverse Engineering" overlay — the flagship CWH card's
 * hover/tap interaction.
 *
 * Idle the overlay is invisible (scale 0, opacity 0) so the card
 * reads exactly like the other bento cells. On hover (desktop) or
 * tap (mobile), five service nodes — Lambda, API Gateway, Bedrock,
 * DynamoDB, S3 — fly outward from the card centre to scattered
 * positions, hold for ~2 seconds, then reassemble. The whole
 * sequence is one shot per trigger; subsequent hovers within the
 * 3.5s window are ignored by the parent so the animation can't
 * stutter.
 *
 * Performance posture:
 *   - Pure SVG / motion/react. No three.js (would balloon home
 *     initial JS past the 250 KB hard limit).
 *   - When isActive=false and the motion target equals the rest
 *     state, motion/react stops the RAF loop entirely → 0% idle
 *     CPU. The "<5% idle" budget is effectively zero in practice.
 *   - useReducedMotion → return null. The card stays purely
 *     static for visitors who opted out of animation.
 *
 * Accessibility:
 *   - aria-hidden — the nodes are decorative; the card's actual
 *     content (title + checklist + view link) carries the meaning.
 */

interface DecomposeNode {
  id: string;
  glyph: string;
  label: string;
  /** Position relative to the card centre, expressed as percentages
   *  of half the card's bounding box. Negative x = left, negative y
   *  = up. Range roughly [-90, 90] keeps every node inside the
   *  rounded card frame. */
  offset: { x: number; y: number };
}

const NODES: readonly DecomposeNode[] = [
  { id: "lambda",  glyph: "λ",   label: "Lambda",      offset: { x: -65, y: -55 } },
  { id: "bedrock", glyph: "C",   label: "Bedrock",     offset: { x:  10, y: -75 } },
  { id: "dynamo",  glyph: "DDB", label: "DynamoDB",    offset: { x:  70, y: -45 } },
  { id: "apigw",   glyph: "API", label: "API Gateway", offset: { x: -70, y:  45 } },
  { id: "s3",      glyph: "S3",  label: "S3",          offset: { x:  60, y:  60 } },
] as const;

const EASE = [0.22, 1, 0.36, 1] as const;

interface Props {
  isActive: boolean;
}

export default function BentoDecomposeOverlay({ isActive }: Props) {
  const prefersReducedMotion = useReducedMotion();
  if (prefersReducedMotion) return null;

  return (
    <div
      className="absolute inset-0 pointer-events-none overflow-hidden rounded-2xl"
      aria-hidden="true"
    >
      {/* Subtle dim layer when active — gives the nodes contrast
          against the card's background image without nuking it. */}
      <motion.div
        className="absolute inset-0 bg-black"
        initial={{ opacity: 0 }}
        animate={{ opacity: isActive ? 0.45 : 0 }}
        transition={{ duration: 0.4, ease: EASE }}
      />

      {NODES.map((node, i) => (
        <motion.div
          key={node.id}
          className="absolute top-1/2 left-1/2"
          /* All five start at card centre, invisible. The transform
             keeps them centred relative to their own bounding box. */
          initial={{
            x: "-50%",
            y: "-50%",
            scale: 0,
            opacity: 0,
          }}
          animate={{
            x: isActive ? `calc(-50% + ${node.offset.x}%)` : "-50%",
            y: isActive ? `calc(-50% + ${node.offset.y}%)` : "-50%",
            scale: isActive ? 1 : 0,
            opacity: isActive ? 1 : 0,
          }}
          transition={{
            duration: isActive ? 0.7 : 0.4,
            delay: isActive ? i * 0.06 : 0,
            ease: EASE,
          }}
        >
          <div
            className="inline-flex items-center gap-2 rounded-full border border-[#00d2ff]/35 bg-black/70 px-3 py-1.5 backdrop-blur-sm"
            style={{
              boxShadow:
                "0 0 24px rgba(0, 210, 255, 0.18), inset 0 1px 1px rgba(255, 255, 255, 0.05)",
            }}
          >
            <span
              className="inline-flex w-5 h-5 items-center justify-center rounded-full bg-[#00d2ff]/15 font-mono text-[10px] font-semibold text-[#00d2ff]"
              aria-hidden="true"
            >
              {node.glyph}
            </span>
            <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-white/85 whitespace-nowrap">
              {node.label}
            </span>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
