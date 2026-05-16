"use client";

import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { LuminaTrigger } from "./LuminaTrigger.js";
import { LuminaWindow } from "./LuminaWindow.js";
import type { LuminaChatProps } from "./types.js";

const EASE = [0.22, 1, 0.36, 1] as const;
const DEFAULT_MINIMIZED_KEY = "lumina-minimized-v1";
const DEFAULT_AUTO_OPEN_MS = 1500;

/**
 * LuminaChat — drop-in orchestrator. Pairs a trigger with the window
 * and manages the centered → bottom-right lifecycle.
 *
 * Lifecycle contract:
 *   - First visit: auto-open at T=autoOpenDelayMs (default 1500ms) in
 *     CENTERED position. Lumina plays its welcome sequence, then the
 *     input unlocks.
 *   - When the user closes for the first time: window snaps to
 *     BOTTOM-RIGHT mode, the dim overlay disappears, and a session
 *     flag is set so Lumina never auto-opens again in this session.
 *   - Subsequent opens (manual via trigger) always use bottom-right
 *     mode with no environment dimming.
 *   - On refresh in the same tab, the session flag rehydrates —
 *     Lumina never returns to centered mode within the session.
 *
 * Z-stack:
 *   35  environment dimming overlay (only on centered first open)
 *   55  trigger
 *   60  window
 */
export function LuminaChat(props: LuminaChatProps = {}) {
  const {
    position = "centered-then-bottom-right",
    autoOpenDelayMs = DEFAULT_AUTO_OPEN_MS,
    dimOverlay = true,
    persistence,
  } = props;

  const minimizedKey = persistence?.minimizedKey ?? DEFAULT_MINIMIZED_KEY;
  const persistMinimized = minimizedKey.length > 0;

  const [isOpen, setIsOpen] = useState(false);
  /* `bottom-right` mode skips the centered presentation entirely —
     start with hasBeenMinimized already true so the window opens
     directly into the corner widget shape. */
  const [hasBeenMinimized, setHasBeenMinimized] = useState(
    position === "bottom-right",
  );

  useEffect(() => {
    if (position === "bottom-right") return;

    if (persistMinimized) {
      try {
        if (sessionStorage.getItem(minimizedKey)) {
          setHasBeenMinimized(true);
          return;
        }
      } catch {
        /* sessionStorage blocked — fall through to auto-open */
      }
    }

    if (autoOpenDelayMs <= 0) return;

    /* Auto-open. Strict-mode safe: the cleanup clears the timer; even
       if React re-runs the effect, only one final timer fires. */
    const timer = setTimeout(() => {
      if (persistMinimized) {
        try {
          if (sessionStorage.getItem(minimizedKey)) return;
        } catch {
          /* sessionStorage blocked → still open */
        }
      }
      setIsOpen(true);
    }, autoOpenDelayMs);

    return () => clearTimeout(timer);
  }, [position, persistMinimized, minimizedKey, autoOpenDelayMs]);

  const handleClose = () => {
    setIsOpen(false);
    if (hasBeenMinimized) return;
    if (persistMinimized) {
      try {
        sessionStorage.setItem(minimizedKey, "true");
      } catch {
        /* ignore */
      }
    }
    /* Position snap from centered → bottom-right happens AFTER the
       close animation finishes, so the user never sees the window
       jump while it's still visible. */
    setTimeout(() => setHasBeenMinimized(true), 500);
  };

  const showDimOverlay = dimOverlay && isOpen && !hasBeenMinimized;

  return (
    <>
      {/* Solid dim — NO backdrop-filter. Full-viewport blur was the
          single biggest GPU cost on lower-end devices in early
          prototypes. An 85% opaque dim achieves the focus-on-Lumina
          effect at zero GPU cost. */}
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

      <LuminaTrigger
        isOpen={isOpen}
        onClick={() => setIsOpen(true)}
        theme={props.theme}
      />
      <LuminaWindow
        {...props}
        isOpen={isOpen}
        onClose={handleClose}
        hasBeenMinimized={hasBeenMinimized}
      />
    </>
  );
}
