"use client";

import { useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { Sparkles } from "lucide-react";
import { tapHaptic } from "@/lib/haptic";
import { LuminaMechanicalCore } from "./LuminaMechanicalCore";

const EASE = [0.22, 1, 0.36, 1] as const;

interface Props {
  isOpen: boolean;
  onClick: () => void;
}

/**
 * Lumina activation trigger — a dormant AI core, not a support button.
 * Persistent mount; opacity-driven visibility cross-fades with the window.
 *
 * V6 Sub-PR 15.3 — retires the Sparkles icon (audit § 16.1 — universal
 * AI cliché of the era). When NEXT_PUBLIC_V6_LUMINA_TRIGGER is on, the
 * inner content becomes a miniature of the LuminaAvatar: a 16 px
 * cyan-radial core + 1 px cyan ring outline, with the outer breath
 * pulse (3.8 s period, identical params to the avatar's breathing
 * loop). Opening Lumina is then the act of *enlarging the trigger
 * into the avatar* — the two surfaces share an identity, not a
 * relationship of "button → window."
 *
 * V6 Mechanical evolution — gated independently by
 * NEXT_PUBLIC_V6_LUMINA_MECHANICAL (requires the 15.3 flag to also
 * be on). When on, the cyan core remains the identity, but a multi-
 * layer mechanical ring system orbits it: an inner focus reticle, a
 * slow-rotating segmented cyan ring, and the existing breath halo.
 * The trigger gains four perceptible states (idle / hover / press /
 * open / active) with restrained, GPU-only transitions. Implementation
 * lives in `LuminaMechanicalCore.tsx` so the off-flag path here stays
 * source-identical to the 15.3 baseline.
 *
 * Reduced motion: outer breath disabled; the cyan core glyph remains
 * static. The center still reads as a present, dormant AI core.
 * Mechanical mode additionally disables the ring rotation under
 * reduced motion (static dashed ring renders instead).
 *
 * Hit target: button retains `p-4` (16 px) padding; center is 16 px;
 * total is ~48 × 48 px — comfortably above the 44 × 44 minimum.
 *
 * Rollback: flag off → the Sparkles icon returns verbatim (lucide
 * import preserved for the off-path; will retire when V6 stabilises).
 */
export function LuminaTrigger({ isOpen, onClick }: Props) {
  const prefersReducedMotion = useReducedMotion();
  const v6 = process.env.NEXT_PUBLIC_V6_LUMINA_TRIGGER === "1";
  /* Mechanical evolution requires the 15.3 base to be on — it extends
     the AvatarMiniature, it does not replace the V5 Sparkles surface. */
  const v6Mechanical =
    v6 && process.env.NEXT_PUBLIC_V6_LUMINA_MECHANICAL === "1";

  /* Hover + press state is consumed only by LuminaMechanicalCore. The
     hooks are declared unconditionally so React's hook-order rule is
     preserved across flag changes; when mechanical mode is off, the
     state defaults stay at false and the values are never read. */
  const [isHovered, setIsHovered] = useState(false);
  const [isPressed, setIsPressed] = useState(false);

  const handleClick = () => {
    tapHaptic();
    onClick();
  };

  /* Pointer event handlers attach ONLY when mechanical mode is on, so
     the V5 + Sub-PR 15.3 paths' DOM event surface stays byte-identical
     to the pre-mechanical baseline (no new listeners on the off-path). */
  const mechanicalHandlers = v6Mechanical
    ? {
        onMouseEnter: () => setIsHovered(true),
        onMouseLeave: () => {
          setIsHovered(false);
          setIsPressed(false);
        },
        onPointerDown: () => setIsPressed(true),
        onPointerUp: () => setIsPressed(false),
        onPointerCancel: () => setIsPressed(false),
        onFocus: () => setIsHovered(true),
        onBlur: () => {
          setIsHovered(false);
          setIsPressed(false);
        },
      }
    : {};

  return (
    <motion.button
      type="button"
      onClick={handleClick}
      {...mechanicalHandlers}
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
      {v6Mechanical ? (
        /* V6 Mechanical — evolves the 15.3 AvatarMiniature with a
             multi-layer ring system. Identity (the 16 px cyan-radial
             core + 1 px cyan ring) is preserved verbatim inside
             LuminaMechanicalCore; the new layers (atmospheric halo,
             segmented rotating ring, focus reticle) orbit it. State
             machine: idle / hover / press / open. */
        <LuminaMechanicalCore
          isOpen={isOpen}
          isHovered={isHovered}
          isPressed={isPressed}
        />
      ) : v6 ? (
        /* V6 — miniature of the LuminaAvatar.
             Inner: 16 px cyan-radial core with 1 px cyan ring.
             Outer: breath pulse, 3.8 s period, identical params
             to the avatar's breathing loop. Reduced motion
             disables the outer pulse only; the inner core stays
             present and recognisable. */
        <span
          className="relative inline-block w-4 h-4"
          aria-hidden="true"
        >
          {prefersReducedMotion ? null : (
            <motion.span
              className="absolute -inset-3 rounded-full pointer-events-none"
              animate={{
                opacity: [0.30, 0.55, 0.30],
                scale: [1, 1.15, 1],
              }}
              transition={{
                duration: 3.8,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              style={{
                background:
                  "radial-gradient(circle, rgba(0,210,255,0.22) 0%, transparent 65%)",
              }}
            />
          )}
          <span
            className="absolute inset-0 rounded-full"
            style={{
              border: "1px solid rgba(0,210,255,0.55)",
              background:
                "radial-gradient(circle at 30% 28%, rgba(0,210,255,0.55), rgba(11,37,81,0.75) 55%, rgba(5,5,5,0.95))",
              boxShadow:
                "0 0 8px rgba(0,210,255,0.32), inset 0 1px 0 rgba(255,255,255,0.18)",
            }}
          />
        </span>
      ) : (
        <motion.span
          className="inline-flex"
          animate={{ opacity: [1, 0.55, 1] }}
          transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut" }}
        >
          <Sparkles className="w-5 h-5 text-primary" aria-hidden="true" />
        </motion.span>
      )}
    </motion.button>
  );
}
