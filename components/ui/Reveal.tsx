"use client";

import { motion } from "motion/react";
import type { ReactNode } from "react";

const EASE = [0.22, 1, 0.36, 1] as const;

/**
 * Generic fade-up reveal wrapper — the single client boundary for
 * non-interactive entrance animations across the portfolio.
 *
 * Server Components render their content as children; this wrapper
 * only adds the motion layer. Result: a single client island per
 * animated block, no page-level "use client" pollution.
 *
 * Modes:
 *  - "mount": fires immediately on mount (initial → animate).
 *  - "view":  fires when the element enters the viewport (whileInView).
 */

interface RevealProps {
  children: ReactNode;
  className?: string;
  mode?: "mount" | "view";
  delay?: number;
  duration?: number;
  /** Initial y-translate in pixels. Defaults to 20. */
  y?: number;
  /** Viewport trigger margin (only applies to mode="view"). */
  margin?: string;
}

export function Reveal({
  children,
  className,
  mode = "view",
  delay = 0,
  duration = 0.7,
  y = 20,
  margin = "-100px",
}: RevealProps) {
  const initial = { opacity: 0, y };
  const target = { opacity: 1, y: 0 };
  const transition = { duration, ease: EASE, delay };

  if (mode === "mount") {
    return (
      <motion.div
        className={className}
        initial={initial}
        animate={target}
        transition={transition}
      >
        {children}
      </motion.div>
    );
  }

  return (
    <motion.div
      className={className}
      initial={initial}
      whileInView={target}
      viewport={{ once: true, margin }}
      transition={transition}
    >
      {children}
    </motion.div>
  );
}
