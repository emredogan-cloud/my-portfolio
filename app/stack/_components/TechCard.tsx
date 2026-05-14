"use client";

import { motion } from "motion/react";
import { ArrowUpRight } from "lucide-react";

const EASE = [0.22, 1, 0.36, 1] as const;

interface Tech {
  name: string;
  role: string;
}

interface Props {
  tech: Tech;
  delay?: number;
}

/**
 * Premium tech card with Linear/Stripe-grade hover treatment.
 *
 * Idle state: subtle border, minimal background, muted accent arrow.
 * Hover state: brighter border (`white/20`), gentle scale (1.04),
 *   inner glow via inset box-shadow, arrow lifts up-right.
 *
 * Motion's `whileHover` handles the scale on the compositor; the
 * border, background, and glow are CSS transitions. No layout
 * shifts; the card grows from its own center.
 */
export function TechCard({ tech, delay = 0 }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.5, ease: EASE, delay }}
      whileHover={{ scale: 1.04 }}
      className="
        group relative rounded-xl p-4 cursor-default overflow-hidden
        border border-white/[0.06] bg-white/[0.02]
        hover:bg-white/[0.05] hover:border-white/20
        transition-colors duration-300
      "
    >
      {/* Inner glow on hover — pure CSS, GPU-compositor friendly */}
      <div
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none rounded-xl"
        style={{
          boxShadow:
            "inset 0 0 28px rgba(255,255,255,0.06), inset 0 1px 0 rgba(255,255,255,0.08)",
        }}
      />

      <div className="relative flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="text-primary font-medium text-sm leading-tight">
            {tech.name}
          </p>
          <p className="text-tertiary text-xs mt-1 leading-snug">
            {tech.role}
          </p>
        </div>
        <ArrowUpRight
          className="w-3.5 h-3.5 text-quiet group-hover:text-secondary transition-all duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 flex-shrink-0"
        />
      </div>
    </motion.div>
  );
}
