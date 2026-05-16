"use client";

import { motion } from "motion/react";
import type { LuminaAvatarProps } from "./types.js";

const DEFAULT_BRAND = "#00d2ff";

/**
 * Lumina Neural Core — circular avatar with majestic cyan presence.
 *
 * Layers (back to front):
 *   1. Outer breathing pulse — radial gradient on opacity+scale loop.
 *      Compositor-only animation; cheap to run indefinitely.
 *   2. Frame — static box-shadow at peak intensity. Painted once on
 *      mount; no per-frame cost.
 *   3. Fallback gradient — applied to the frame's background, so the
 *      image paints over it naturally without z-index gymnastics.
 *   4. Image — sits in normal flow inside the frame. When `theme.
 *      avatarSrc` is missing or 404s, onError sets display:none and
 *      the background gradient becomes the visible content.
 */
export function LuminaAvatar({
  className = "w-24 h-24 sm:w-32 sm:h-32",
  theme,
}: LuminaAvatarProps) {
  const brand = theme?.brandColor ?? DEFAULT_BRAND;
  const glow = theme?.glowIntensity ?? 1;
  const src = theme?.avatarSrc;

  // Convert hex `#00d2ff` to `0,210,255` for rgba() use. If the color
  // isn't a hex, fall back to the brand default's RGB triplet so the
  // glow still renders.
  const rgb = hexToRgb(brand) ?? "0,210,255";

  return (
    <div className={`relative shrink-0 ${className}`} aria-hidden="true">
      {/* Outer breathing pulse — opacity + scale only */}
      <motion.div
        className="absolute -inset-4 rounded-full pointer-events-none"
        animate={{
          opacity: [0.30 * glow, 0.55 * glow, 0.30 * glow],
          scale: [1, 1.15, 1],
        }}
        transition={{
          duration: 3.8,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        style={{
          background: `radial-gradient(circle, rgba(${rgb},${
            0.22 * glow
          }) 0%, transparent 65%)`,
        }}
      />

      {/* Frame — static glow, fallback gradient as background */}
      <div
        className="relative w-full h-full rounded-full overflow-hidden"
        style={{
          border: `1px solid rgba(${rgb},${0.30 * glow})`,
          boxShadow: `0 0 ${60 * glow}px rgba(${rgb},${
            0.40 * glow
          }), inset 0 1px 0 rgba(255,255,255,0.18)`,
          background: `radial-gradient(circle at 30% 28%, rgba(${rgb},0.40), rgba(11,37,81,0.60) 50%, rgba(5,5,5,0.95))`,
        }}
      >
        {src && (
          <img
            src={src}
            alt=""
            className="w-full h-full object-cover rounded-full pointer-events-none"
            onError={(e) => {
              e.currentTarget.style.display = "none";
            }}
            draggable={false}
          />
        )}
      </div>
    </div>
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
