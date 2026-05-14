"use client";

import { useEffect } from "react";
import { motion } from "motion/react";
import AmbientBackground from "./AmbientBackground";
import IdentityReveal from "./IdentityReveal";
import ParticleField from "./ParticleField";

const EASE = [0.22, 1, 0.36, 1] as const;

/* Trigger the exit at 2.3s — the 0.55s scale-out brings total to ~2.85s,
   inside the 2.0–3.0s brief envelope. */
const EXIT_AT_MS = 2300;

interface Props {
  onComplete: () => void;
}

export default function IntroOverlay({ onComplete }: Props) {
  useEffect(() => {
    const timer = setTimeout(onComplete, EXIT_AT_MS);
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <motion.div
      className="intro-overlay fixed inset-0 z-[100] flex items-center justify-center bg-black overflow-hidden"
      /* No entrance animation — overlay is already covering on first paint. */
      initial={{ opacity: 1 }}
      /* Phase 4 — scale outward + fade. Phase 2.6 perf fix: removed
         `filter: blur` from the exit. The scale + opacity still create
         the "lifting away" sensation without forcing a final-frame
         repaint pass on the entire overlay. */
      exit={{ opacity: 0, scale: 1.04 }}
      transition={{ duration: 0.55, ease: EASE }}
      aria-hidden="true"
    >
      <AmbientBackground />
      <ParticleField />
      <IdentityReveal />
    </motion.div>
  );
}
