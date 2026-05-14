"use client";

import { motion } from "motion/react";

/**
 * Phase 3 — Drifting particle field.
 *
 * Twelve deterministically-positioned particles (no Math.random() so SSR
 * and CSR render identical markup — hydration-safe). Each drifts vertically
 * over a 3–5 second window with a brief sustain at peak opacity.
 *
 * Visually: dust motes in a sunbeam. Calm, atmospheric, never decorative.
 */

const PARTICLES = [
  { left: 15, top: 25, size: 2 },
  { left: 82, top: 30, size: 3 },
  { left: 45, top: 18, size: 2 },
  { left: 28, top: 70, size: 2 },
  { left: 70, top: 60, size: 3 },
  { left: 10, top: 80, size: 2 },
  { left: 90, top: 75, size: 2 },
  { left: 60, top: 85, size: 3 },
  { left: 35, top: 55, size: 2 },
  { left: 75, top: 45, size: 2 },
  { left: 20, top: 50, size: 2 },
  { left: 55, top: 35, size: 2 },
] as const;

export default function ParticleField() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {PARTICLES.map((p, i) => (
        <motion.span
          key={i}
          className="absolute rounded-full bg-primary"
          style={{
            left: `${p.left}%`,
            top: `${p.top}%`,
            width: p.size,
            height: p.size,
          }}
          initial={{ opacity: 0, y: -10 }}
          animate={{
            opacity: [0, 0.45, 0.45, 0],
            y: [-10, 0, 18, 32],
          }}
          transition={{
            duration: 3 + (i % 3),
            delay: 1.4 + i * 0.04,
            ease: "linear",
            times: [0, 0.25, 0.75, 1],
          }}
        />
      ))}
    </div>
  );
}
