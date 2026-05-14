"use client";

import { motion } from "motion/react";

const EASE = [0.22, 1, 0.36, 1] as const;

/**
 * Phase 1 — Ambient darkness layer.
 * Four restrained sub-layers stacked to build atmospheric depth:
 *   a) Soft radial glow at center (slow scale-in)
 *   b) Subtle dot grid (fades in)
 *   c) Edge vignette (static, focuses the eye centerward)
 *   d) Film grain (static SVG turbulence, mix-blend-overlay)
 */
export default function AmbientBackground() {
  return (
    <>
      {/* a) Soft radial glow */}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(circle at 50% 50%, rgba(222,219,200,0.07) 0%, rgba(222,219,200,0.02) 30%, transparent 60%)",
        }}
        initial={{ opacity: 0, scale: 0.92 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1.4, ease: EASE }}
      />

      {/* b) Dot grid — engineering precision motif */}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage:
            "radial-gradient(circle, rgba(222,219,200,0.05) 1px, transparent 1px)",
          backgroundSize: "32px 32px",
          maskImage:
            "radial-gradient(ellipse at center, rgba(0,0,0,0.85) 0%, transparent 75%)",
          WebkitMaskImage:
            "radial-gradient(ellipse at center, rgba(0,0,0,0.85) 0%, transparent 75%)",
        }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.8 }}
        transition={{ duration: 1.0, ease: EASE }}
      />

      {/* c) Cinematic vignette — static, no animation needed */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ boxShadow: "inset 0 0 280px rgba(0,0,0,0.85)" }}
      />

      {/* d) Film grain */}
      <svg
        className="absolute inset-0 w-full h-full opacity-[0.10] pointer-events-none mix-blend-overlay"
        aria-hidden="true"
      >
        <filter id="intro-grain">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.85"
            numOctaves="3"
            stitchTiles="stitch"
          />
        </filter>
        <rect width="100%" height="100%" filter="url(#intro-grain)" />
      </svg>
    </>
  );
}
