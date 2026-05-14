"use client";

import { motion } from "motion/react";

interface Props {
  /** Tailwind sizing/positioning classes. Default sets a responsive
   *  majestic scale: 96px on mobile, 128px on desktop. */
  className?: string;
  /** Multiplier for glow strength. Default 1 = spec values exactly. */
  glowIntensity?: number;
}

/**
 * Lumina Neural Core — circular avatar with majestic cyan presence.
 *
 * Layers (back to front):
 *   1. Outer breathing pulse — radial gradient on opacity+scale loop.
 *      GPU-compositor only. Cheap to animate indefinitely.
 *   2. Frame — STATIC box-shadow at the spec peak value
 *      `0 0 50px rgba(0,210,255,0.4)`. Painted once on mount, no
 *      per-frame cost. Cyan border per `border-[#00d2ff]/30`.
 *   3. Fallback gradient — applied to the frame's BACKGROUND, not as
 *      a separate absolute child. This lets the image paint naturally
 *      over the gradient without needing z-index gymnastics.
 *   4. Image — sits in normal flow inside the frame, fills it. When
 *      /public/lumina.png is missing, onError sets display:none and
 *      the background gradient becomes the visible content.
 */
export function LuminaAvatar({
  className = "w-24 h-24 sm:w-32 sm:h-32",
  glowIntensity = 1,
}: Props) {
  const g = glowIntensity;

  return (
    <div className={`relative shrink-0 ${className}`} aria-hidden="true">
      {/* Outer breathing pulse — opacity + scale only (compositor) */}
      <motion.div
        className="absolute -inset-4 rounded-full pointer-events-none"
        animate={{
          opacity: [0.30 * g, 0.55 * g, 0.30 * g],
          scale: [1, 1.15, 1],
        }}
        transition={{
          duration: 3.8,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        style={{
          background: `radial-gradient(circle, rgba(0,210,255,${
            0.22 * g
          }) 0%, transparent 65%)`,
        }}
      />

      {/* Frame — static glow, fallback gradient as parent background.
          Image paints over the background naturally (no z-index needed). */}
      <div
        className="relative w-full h-full rounded-full overflow-hidden"
        style={{
          border: `1px solid rgba(0,210,255,${0.30 * g})`,
          boxShadow: `0 0 ${60 * g}px rgba(0,210,255,${
            0.40 * g
          }), inset 0 1px 0 rgba(255,255,255,0.18)`,
          background:
            "radial-gradient(circle at 30% 28%, rgba(0,210,255,0.40), rgba(11,37,81,0.60) 50%, rgba(5,5,5,0.95))",
        }}
      >
        <img
          src="/lumina.png"
          alt="Lumina Core"
          className="w-full h-full object-cover rounded-full pointer-events-none"
          onError={(e) => {
            e.currentTarget.style.display = "none";
          }}
          draggable={false}
        />
      </div>
    </div>
  );
}
