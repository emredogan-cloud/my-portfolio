"use client";

import { motion } from "motion/react";

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
 * Stack-page tech card client leaf.
 * Renders a fade-up reveal on viewport entry plus a CSS-only hover
 * border treatment. No props beyond data + per-item delay; everything
 * else is design-system constant.
 */
export function TechCard({ tech, delay = 0 }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.5, ease: EASE, delay }}
      className="group relative rounded-xl border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04] hover:border-white/[0.12] transition-all duration-300 p-4 cursor-default"
    >
      <p className="text-primary font-medium text-sm leading-tight">
        {tech.name}
      </p>
      <p className="text-gray-500 text-xs mt-1 leading-snug">{tech.role}</p>
    </motion.div>
  );
}
