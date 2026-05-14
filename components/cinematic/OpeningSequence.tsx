"use client";

import { useEffect, useState } from "react";
import { AnimatePresence } from "motion/react";
import IntroOverlay from "./IntroOverlay";

/**
 * Orchestrates the cinematic opening sequence.
 *
 * Behavior contract:
 *  - Plays ONCE per browser tab session (sessionStorage gate).
 *  - Skipped entirely when prefers-reduced-motion is enabled.
 *  - Skipped when sessionStorage is unavailable (private mode) — fail-safe.
 *  - Initial state is `null` to avoid SSR/CSR hydration mismatch on the
 *    overlay tree. Server renders nothing; client decides after mount.
 */

const STORAGE_KEY = "portfolio-intro-played-v1";

export default function OpeningSequence() {
  const [shouldPlay, setShouldPlay] = useState<boolean | null>(null);

  useEffect(() => {
    // Respect reduced-motion preference unconditionally.
    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    if (reducedMotion) {
      setShouldPlay(false);
      return;
    }

    try {
      const played = sessionStorage.getItem(STORAGE_KEY);
      if (played) {
        setShouldPlay(false);
      } else {
        setShouldPlay(true);
        sessionStorage.setItem(STORAGE_KEY, "true");
      }
    } catch {
      // sessionStorage can throw in private mode or with restrictive policies.
      setShouldPlay(false);
    }
  }, []);

  const handleComplete = () => setShouldPlay(false);

  return (
    <AnimatePresence>
      {shouldPlay === true && <IntroOverlay onComplete={handleComplete} />}
    </AnimatePresence>
  );
}
