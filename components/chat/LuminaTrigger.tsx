"use client";

import { motion } from "motion/react";
import { Sparkles } from "lucide-react";
import { tapHaptic } from "@/lib/haptic";

const EASE = [0.22, 1, 0.36, 1] as const;

interface Props {
  isOpen: boolean;
  onClick: () => void;
}

/**
 * Lumina activation trigger — a dormant AI core, not a support button.
 * Persistent mount; opacity-driven visibility cross-fades with the window.
 */
export function LuminaTrigger({ isOpen, onClick }: Props) {
  const handleClick = () => {
    tapHaptic();
    onClick();
  };

  return (
    <motion.button
      type="button"
      onClick={handleClick}
      suppressHydrationWarning
      aria-label="Activate Lumina"
      aria-hidden={isOpen}
      /* fixed position with safe-area-aware insets so the trigger
         clears the iOS home indicator and the right-edge notch
         (landscape iPhones put the notch on the left or right).
         The `max(...)` floor keeps the existing 1.25rem visual
         spacing when the safe area is zero. */
      className="fixed z-[55] inline-flex items-center justify-center rounded-full p-4 liquid-glass"
      animate={{
        opacity: isOpen ? 0 : 1,
        scale: isOpen ? 0.85 : 1,
      }}
      transition={{
        duration: isOpen ? 0.25 : 0.4,
        ease: EASE,
        delay: isOpen ? 0 : 0.18,
      }}
      style={{
        pointerEvents: isOpen ? "none" : "auto",
        bottom: "max(1.25rem, env(safe-area-inset-bottom))",
        right: "max(1.25rem, env(safe-area-inset-right))",
        boxShadow:
          "0 0 22px 4px rgba(0,210,255,0.12), 0 8px 28px rgba(0,0,0,0.4), inset 0 1px 1px rgba(255,255,255,0.14)",
      }}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
    >
      <motion.span
        className="inline-flex"
        animate={{ opacity: [1, 0.55, 1] }}
        transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut" }}
      >
        <Sparkles className="w-5 h-5 text-primary" aria-hidden="true" />
      </motion.span>
    </motion.button>
  );
}
