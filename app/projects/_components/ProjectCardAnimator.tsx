"use client";

import { motion } from "motion/react";
import type { ReactNode } from "react";

const EASE = [0.22, 1, 0.36, 1] as const;

interface Props {
  delay?: number;
  children: ReactNode;
}

/**
 * Projects-listing card animator.
 * Combines mount-mode fade-up entrance with a subtle whileHover scale.
 * The card's static markup is rendered by the parent Server Component
 * and passed in as children.
 */
export function ProjectCardAnimator({ delay = 0, children }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: EASE, delay }}
      whileHover={{ scale: 1.02 }}
      className="h-full"
    >
      {children}
    </motion.div>
  );
}
