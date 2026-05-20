"use client";

import { motion } from "motion/react";

const EASE = [0.22, 1, 0.36, 1] as const;

/**
 * Phase 2 — Identity reveal.
 *
 * Three staggered elements:
 *   1. Name        — blur-to-sharpen, opacity 0→1, y 14→0  (delay 0.6s)
 *   2. Tagline     — opacity 0→1, y 6→0                     (delay 1.0s)
 *   3. Accent line — scaleX 0→1 from center                 (delay 1.3s)
 *
 * The blur transition on the name uses CSS `filter: blur()` which is GPU-
 * composited on modern browsers. Applied to a single element for a brief
 * window only — performance impact is negligible.
 */
export default function IdentityReveal() {
  return (
    <div className="relative z-10 flex flex-col items-center text-center px-6">
      {/* Name — pure opacity + y entrance. Phase 2.6 perf fix: removed
          `filter: blur` which was forcing a full repaint every frame on
          the largest text on the page during initial load. Now uses only
          GPU-compositor properties (opacity + transform). */}
      <motion.h1
        className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-medium tracking-[-0.04em] text-primary will-change-transform"
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.9, delay: 0.6, ease: EASE }}
      >
        Emre Doğan
      </motion.h1>

      {/* Tagline — letter-spaced multi-discipline positioning */}
      <motion.p
        className="mt-5 text-[10px] sm:text-xs tracking-[0.32em] uppercase text-tertiary"
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 1.0, ease: EASE }}
      >
        Cloud · SaaS · Mobile
      </motion.p>

      {/* Accent line — draws outward from the center */}
      <motion.div
        className="mt-7 h-px bg-primary/30 origin-center"
        style={{ width: 64 }}
        initial={{ scaleX: 0, opacity: 0 }}
        animate={{ scaleX: 1, opacity: 1 }}
        transition={{ duration: 0.7, delay: 1.3, ease: EASE }}
      />
    </div>
  );
}
