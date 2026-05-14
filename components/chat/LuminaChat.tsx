"use client";

import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { LuminaTrigger } from "./LuminaTrigger";
import { LuminaWindow } from "./LuminaWindow";

const EASE = [0.22, 1, 0.36, 1] as const;
const STORAGE_KEY = "lumina-minimized-v1";

/**
 * Lumina orchestrator.
 *
 * Lifecycle contract:
 *   - First visit: auto-open at T=3.5s in CENTERED position with a
 *     cinematic dim overlay. Lumina introduces itself, reboots,
 *     and arrives at a ready state.
 *   - When the user closes for the first time: the window snaps to
 *     BOTTOM-RIGHT mode, the dim overlay disappears, sessionStorage
 *     gets the `lumina-minimized-v1` flag, and the user can now
 *     interact with the portfolio while Lumina is open.
 *   - Subsequent opens (manual via trigger) always use bottom-right
 *     mode with no environment dimming.
 *   - On refresh in the same tab, sessionStorage rehydrates
 *     `hasBeenMinimized=true` — Lumina never auto-opens again and
 *     never returns to centered mode within the session.
 *
 * Z-stack:
 *   35  environment dimming overlay
 *   55  trigger
 *   60  window
 */
export default function LuminaChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [hasBeenMinimized, setHasBeenMinimized] = useState(false);

  /* On mount: rehydrate hasBeenMinimized from sessionStorage. */
  useEffect(() => {
    try {
      if (sessionStorage.getItem(STORAGE_KEY)) {
        setHasBeenMinimized(true);
        return;
      }
    } catch {
      /* ignore */
    }

    /* No sessionStorage flag → fresh first visit. Auto-open after
       the hero animations have had time to settle. Strict Mode-safe:
       cleanup clears the timer; even if React re-runs the effect,
       only one final timer fires. The sessionStorage check inside
       the timer prevents reopening if the user has already
       minimized in the meantime. */
    const timer = setTimeout(() => {
      try {
        if (!sessionStorage.getItem(STORAGE_KEY)) {
          setIsOpen(true);
        }
      } catch {
        setIsOpen(true);
      }
    }, 3500);

    return () => clearTimeout(timer);
  }, []);

  /* Close handler. The position snap from centered → bottom-right
     happens AFTER the close animation finishes, so the user never
     sees the window jump while it's still visible. */
  const handleClose = () => {
    setIsOpen(false);
    if (hasBeenMinimized) return;
    try {
      sessionStorage.setItem(STORAGE_KEY, "true");
    } catch {
      /* ignore */
    }
    setTimeout(() => setHasBeenMinimized(true), 500);
  };

  /* Environment dimming is only present during the FIRST,
     centered presentation. Once minimized → always transparent
     so the user can interact with the portfolio freely. */
  const showDimOverlay = isOpen && !hasBeenMinimized;

  return (
    <>
      {/* Solid dim — NO backdrop-filter. Full-viewport blur was the
          single biggest GPU cost on lower-end devices. An 85% opaque
          dim achieves the focus-on-Lumina effect at 0% GPU. */}
      <motion.div
        className="fixed inset-0 z-40"
        initial={false}
        animate={{ opacity: showDimOverlay ? 1 : 0 }}
        transition={{ duration: 0.5, ease: EASE }}
        style={{
          backgroundColor: "rgba(5,5,5,0.85)",
          pointerEvents: showDimOverlay ? "auto" : "none",
        }}
        onClick={handleClose}
        aria-hidden="true"
      />

      <LuminaTrigger isOpen={isOpen} onClick={() => setIsOpen(true)} />
      <LuminaWindow
        isOpen={isOpen}
        onClose={handleClose}
        hasBeenMinimized={hasBeenMinimized}
      />
    </>
  );
}
