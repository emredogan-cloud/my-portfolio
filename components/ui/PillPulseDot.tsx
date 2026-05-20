"use client";

import { motion, useReducedMotion } from "motion/react";

/**
 * Cyan dot with the canonical breathing pulse — same motion grammar
 * the hero availability indicator and the certification target pill
 * have used since V1. Lives as a small client island so the broader
 * `<Pill>` primitive can stay a Server Component.
 *
 * Reduced-motion safe by construction: `useReducedMotion()` returns
 * true under `prefers-reduced-motion: reduce` and the dot falls back
 * to a static cyan circle with no animation surface.
 *
 * Reused by V6 Sub-PR 11.2 from:
 *   - HeroSection availability dot (retoned cyan from emerald)
 *   - CertificationRadar target pill
 *   - Any future `<Pill kind="state-live" pulse>` callsite.
 */
export interface PillPulseDotProps {
  /** Pulse phase delay in seconds — used to stagger multiple co-rendered
      pulses so they don't beat in unison. */
  delay?: number;
  /** Tailwind size class. Default w-1.5 h-1.5 — matches the historical
      Hero availability dot. */
  className?: string;
}

export default function PillPulseDot({
  delay = 0,
  className = "w-1.5 h-1.5",
}: PillPulseDotProps) {
  const reduced = useReducedMotion();

  if (reduced) {
    return (
      <span
        className={`${className} rounded-full bg-[#00d2ff] shrink-0`}
        aria-hidden="true"
      />
    );
  }

  return (
    <motion.span
      className={`${className} rounded-full bg-[#00d2ff] shrink-0`}
      animate={{ opacity: [1, 0.4, 1], scale: [1, 1.3, 1] }}
      transition={{
        duration: 2.6,
        repeat: Infinity,
        ease: "easeInOut",
        delay,
      }}
      aria-hidden="true"
    />
  );
}
