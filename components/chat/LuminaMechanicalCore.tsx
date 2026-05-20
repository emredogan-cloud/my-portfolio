"use client";

import { motion, useReducedMotion } from "motion/react";

const EASE = [0.22, 1, 0.36, 1] as const;

interface Props {
  isOpen: boolean;
  isHovered: boolean;
  isPressed: boolean;
}

/**
 * Lumina Mechanical Core — evolves the Sub-PR 15.3 AvatarMiniature with
 * a four-layer ring system that gives the trigger a living mechanical
 * presence without changing its visual identity, footprint, or hit
 * target.
 *
 * The Sub-PR 15.3 inner core (16 px cyan-radial gradient sphere + 1 px
 * cyan ring) is preserved verbatim — it is the identity layer the mechanical
 * rings orbit. The 15.3 outer breath halo is also preserved as the
 * outermost atmospheric layer; the new layers slot BETWEEN the halo and
 * the core.
 *
 * Layer stack (back to front, all absolute around an inline 16 × 16 span):
 *   1. Atmospheric breath halo   — `-inset-3` · ~40 px · 15.3 motion verbatim
 *   2. Mechanical ring           — `-inset-2` · ~32 px · NEW · dashed cyan SVG
 *                                  rotating 22 s linear infinite
 *   3. Core focus ring           — `-inset-1` · ~24 px · NEW · cyan hairline,
 *                                  state-driven scale + opacity
 *   4. Inner core                — `inset-0`  ·  16 px · 15.3 sphere verbatim,
 *                                  with state-driven scale layered on top
 *
 * State machine (idle → hover → press → open):
 *   - IDLE   — atmosphere breathing, mechanical ring rotating at 22 s,
 *              focus ring at 0.50 opacity, core at scale 1.
 *   - HOVER  — rings tighten (mechanical 0.97, focus 0.98), focus + mech
 *              opacity rises (alignment / sensor awareness), core breathes
 *              up 4 %.
 *   - PRESS  — core compresses to 0.85 (ignition), mechanical to 0.92,
 *              focus to 0.94. ~250 ms tactile pulse before spring back.
 *   - OPEN   — core swells to 1.06, mechanical to 1.04, atmosphere
 *              one-shot brightens to 0.62 and expands to scale 1.18
 *              (a brief engaged stabilisation as the button fades into
 *              the LuminaWindow).
 *
 * Motion law (V6):
 *   - All transforms are GPU-friendly: rotate / scale / opacity only.
 *   - No new keyframes, no canvas, no shaders, no particles.
 *   - State transitions use the V6 EASE curve `[0.22, 1, 0.36, 1]`.
 *   - Rotation is on motion.svg's `rotate` transform — transform-origin
 *     defaults to the SVG centre.
 *
 * Reduced motion:
 *   - Atmospheric halo loop dropped; renders as a static low-opacity glow.
 *   - Mechanical ring rotation dropped; renders as a static dashed ring.
 *   - State-driven transitions remain (response motion is preserved);
 *     Motion library's global reduced-motion handling dampens their
 *     durations automatically.
 *
 * Performance:
 *   - Two indefinite Motion loops (atmosphere + ring rotation) — both
 *     compositor-only animations on transform/opacity, costless after
 *     initial paint.
 *   - Static SVG circle at one stroke-dash; ~140 B of inline markup.
 *   - Zero new dependencies. Motion library + inline SVG only.
 */
export function LuminaMechanicalCore({ isOpen, isHovered, isPressed }: Props) {
  const prefersReducedMotion = useReducedMotion();

  /* Visual state precedence — open > press > hover > idle. */
  const state: "idle" | "hover" | "press" | "open" = isOpen
    ? "open"
    : isPressed
      ? "press"
      : isHovered
        ? "hover"
        : "idle";

  /* Layer scale tokens — tight set so the mechanical motion stays restrained.
     Press compresses inward; hover gently tightens; open expands and
     stabilises. Idle = 1 everywhere. */
  const mechRingScale =
    state === "press" ? 0.92 : state === "hover" ? 0.97 : state === "open" ? 1.04 : 1;
  const focusRingScale =
    state === "press" ? 0.94 : state === "hover" ? 0.98 : 1;
  const coreScale =
    state === "press" ? 0.85 : state === "hover" ? 1.04 : state === "open" ? 1.06 : 1;

  const mechRingOpacity =
    state === "open"
      ? 0.95
      : state === "hover" || state === "press"
        ? 0.85
        : 0.55;
  const focusRingOpacity =
    state === "idle" ? 0.5 : state === "open" ? 0.95 : 0.9;

  return (
    <span className="relative inline-block w-4 h-4" aria-hidden="true">
      {/* ── Layer 1 — Atmospheric breath halo (15.3 motion preserved) ── */}
      {prefersReducedMotion ? (
        /* Reduced-motion fallback: static halo at restrained opacity.
           Still present so the trigger reads as a living core; just no
           breathing loop. */
        <span
          className="absolute -inset-3 rounded-full pointer-events-none"
          style={{
            background:
              "radial-gradient(circle, rgba(0,210,255,0.18) 0%, transparent 65%)",
            opacity: state === "open" ? 0.85 : 0.6,
          }}
        />
      ) : (
        <motion.span
          className="absolute -inset-3 rounded-full pointer-events-none"
          animate={
            state === "open"
              ? { opacity: 0.62, scale: 1.18 }
              : { opacity: [0.3, 0.55, 0.3], scale: [1, 1.15, 1] }
          }
          transition={
            state === "open"
              ? { duration: 0.42, ease: EASE }
              : {
                  opacity: { duration: 3.8, repeat: Infinity, ease: "easeInOut" },
                  scale: { duration: 3.8, repeat: Infinity, ease: "easeInOut" },
                }
          }
          style={{
            background:
              "radial-gradient(circle, rgba(0,210,255,0.22) 0%, transparent 65%)",
          }}
        />
      )}

      {/* ── Layer 2 — Mechanical ring (segmented cyan, slow rotation) ──
            The dashed circle drawn in inline SVG so the dash cadence
            stays crisp at any DPR. State-driven scale + opacity is on
            the wrapper; perpetual rotation is on the inner motion.svg
            so the wrapper's spring transitions don't disturb the
            linear rotation timing. */}
      <motion.span
        className="absolute -inset-2 pointer-events-none"
        animate={{ scale: mechRingScale, opacity: mechRingOpacity }}
        transition={{ duration: 0.38, ease: EASE }}
      >
        {prefersReducedMotion ? (
          <svg viewBox="0 0 32 32" className="w-full h-full" aria-hidden="true">
            <circle
              cx="16"
              cy="16"
              r="15"
              fill="none"
              stroke="rgba(0,210,255,0.6)"
              strokeWidth="0.65"
              strokeDasharray="2.4 3"
            />
          </svg>
        ) : (
          <motion.svg
            viewBox="0 0 32 32"
            className="w-full h-full"
            animate={{ rotate: 360 }}
            transition={{
              rotate: { duration: 22, repeat: Infinity, ease: "linear" },
            }}
            style={{
              transformOrigin: "50% 50%",
            }}
            aria-hidden="true"
          >
            <circle
              cx="16"
              cy="16"
              r="15"
              fill="none"
              stroke="rgba(0,210,255,0.6)"
              strokeWidth="0.65"
              strokeDasharray="2.4 3"
            />
          </motion.svg>
        )}
      </motion.span>

      {/* ── Layer 3 — Core focus ring (cyan hairline) ──
            A thin cyan reticle that brightens on hover/press/open —
            reads as the focal lock-on between the rotating mechanical
            ring and the steady inner core. */}
      <motion.span
        className="absolute -inset-1 rounded-full pointer-events-none"
        animate={{ scale: focusRingScale, opacity: focusRingOpacity }}
        transition={{ duration: 0.32, ease: EASE }}
        style={{
          border: "1px solid rgba(0,210,255,0.45)",
        }}
      />

      {/* ── Layer 4 — Inner core (preserved from Sub-PR 15.3) ──
            The cyan-radial gradient sphere + 1 px cyan ring. The 15.3
            identity layer the rings orbit. State only adds scale —
            border, gradient stops, and box-shadow are unchanged from
            the 15.3 source so the visual identity carries through. */}
      <motion.span
        className="absolute inset-0 rounded-full"
        animate={{ scale: coreScale }}
        transition={{ duration: 0.28, ease: EASE }}
        style={{
          border: "1px solid rgba(0,210,255,0.55)",
          background:
            "radial-gradient(circle at 30% 28%, rgba(0,210,255,0.55), rgba(11,37,81,0.75) 55%, rgba(5,5,5,0.95))",
          boxShadow:
            "0 0 8px rgba(0,210,255,0.32), inset 0 1px 0 rgba(255,255,255,0.18)",
        }}
      />
    </span>
  );
}
