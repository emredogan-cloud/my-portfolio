"use client";

import { motion } from "motion/react";
import { Sparkles } from "lucide-react";
import type { LuminaTriggerProps } from "./types.js";

const EASE = [0.22, 1, 0.36, 1] as const;
const DEFAULT_BRAND = "#00d2ff";

/**
 * Activation trigger — a dormant AI core, not a support button.
 *
 * Persistent mount; opacity-driven visibility cross-fades with the
 * window so neither element ever pops in/out of the layout. The pulse
 * on the icon makes the dormant state feel alive without screaming
 * for attention.
 */
export function LuminaTrigger({
  isOpen,
  onClick,
  theme,
}: LuminaTriggerProps) {
  const brand = theme?.brandColor ?? DEFAULT_BRAND;
  const rgb = hexToRgb(brand) ?? "0,210,255";

  return (
    <motion.button
      type="button"
      onClick={onClick}
      suppressHydrationWarning
      aria-label="Activate Lumina"
      aria-hidden={isOpen}
      className="fixed bottom-5 right-5 z-[55] inline-flex items-center justify-center rounded-full p-4"
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
        backgroundColor: "rgba(255,255,255,0.04)",
        border: "1px solid rgba(255,255,255,0.08)",
        backdropFilter: "blur(14px)",
        WebkitBackdropFilter: "blur(14px)",
        boxShadow: `0 0 22px 4px rgba(${rgb},0.12), 0 8px 28px rgba(0,0,0,0.4), inset 0 1px 1px rgba(255,255,255,0.14)`,
      }}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
    >
      <motion.span
        className="inline-flex"
        animate={{ opacity: [1, 0.55, 1] }}
        transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut" }}
      >
        <Sparkles className="w-5 h-5 text-white/85" aria-hidden="true" />
      </motion.span>
    </motion.button>
  );
}

function hexToRgb(hex: string): string | null {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m || !m[1]) return null;
  const v = m[1];
  const r = parseInt(v.slice(0, 2), 16);
  const g = parseInt(v.slice(2, 4), 16);
  const b = parseInt(v.slice(4, 6), 16);
  return `${r},${g},${b}`;
}
