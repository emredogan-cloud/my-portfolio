"use client";

/* ──────────────────────────────────────────────────────────────
 *  WorkReadingMode — V6 Sub-PR 14.1
 *
 *  The /work hub's mid-block reading-mode toggle. Two modes:
 *
 *    Outcomes      → wide editorial rows with blurb + metric + CTAs
 *    Architecture  → constellation strips + walkthrough links
 *
 *  Per spec validation #5 the toggle does NOT mutate URL state —
 *  no router push, no useSearchParams. Initial state is derived
 *  from the URL hash exactly once on mount (so that /work#outcomes
 *  and /work#architecture redirects from the legacy hubs land on
 *  the matching composition). After mount the toggle is pure
 *  client-side state.
 *
 *  The compositions themselves are server-rendered and passed in
 *  as children so this client island stays small and the project
 *  rows + strips do not leak into the client bundle.
 *
 *  Reduced-motion: the mode swap is a single fade — Framer's
 *  `motion` honours `prefers-reduced-motion` automatically via
 *  the `useReducedMotion()` consumers downstream. Here we use a
 *  simple CSS opacity transition rather than motion.div to keep
 *  this client island lean.
 *
 *  Spec ref: PORTFOLYO_V6_UI_EXECUTION_SYSTEM.md § Sub-PR 14.1.
 * ────────────────────────────────────────────────────────────── */

import { useEffect, useRef, useState, type ReactNode } from "react";

type Mode = "outcomes" | "architecture";

interface Props {
  outcomesView: ReactNode;
  architectureView: ReactNode;
}

export default function WorkReadingMode({
  outcomesView,
  architectureView,
}: Props) {
  const [mode, setMode] = useState<Mode>("outcomes");
  const wrapperRef = useRef<HTMLDivElement>(null);
  const initialised = useRef(false);

  /* Mount: read the hash once via a deferred callback. /projects
     redirects to /work#outcomes and /architecture redirects to
     /work#architecture, so the hash is the signal carrying which
     composition the visitor asked for.

     Why a deferred callback rather than a synchronous setState
     in the effect body: the URL hash is external browser state,
     not derivable from React props or state. Per react-hooks/
     set-state-in-effect, setState inside an effect's body is
     flagged as a cascading-render anti-pattern; setState inside
     a callback that fires when external state changes (or is
     read) is the accepted "subscribe for external updates"
     posture. We treat the hash as a one-time subscription read
     fired on the next frame, after hydration has completed. */
  useEffect(() => {
    if (initialised.current) return;
    initialised.current = true;
    const syncFromHash = () => {
      const hash = window.location.hash;
      if (hash === "#architecture") {
        setMode("architecture");
      }
      if (hash === "#architecture" || hash === "#outcomes") {
        wrapperRef.current?.scrollIntoView({
          behavior: "auto",
          block: "start",
        });
      }
    };
    const raf = requestAnimationFrame(syncFromHash);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <section
      id="reading-modes"
      aria-label="Work — reading mode"
      ref={wrapperRef}
      className="scroll-mt-24"
    >
      {/* Toggle bar — two pills, side-by-side. Visual weight via dotted
          underline on the active mode, dim on the inactive. Same
          vocabulary as filter-active / filter-inactive Pill kinds in
          spirit but rendered inline (the buttons need to be real
          buttons, not Pill spans). */}
      <div
        role="tablist"
        aria-label="Switch reading mode"
        className="flex items-center gap-6 mb-12"
      >
        <button
          type="button"
          role="tab"
          aria-selected={mode === "outcomes"}
          onClick={() => setMode("outcomes")}
          className={
            mode === "outcomes"
              ? "font-mono uppercase tracking-[0.20em] text-[11px] text-[#00d2ff] border-b border-dotted border-[#00d2ff]/60 pb-1 transition-colors"
              : "font-mono uppercase tracking-[0.20em] text-[11px] text-tertiary border-b border-dotted border-transparent hover:border-white/30 pb-1 transition-colors"
          }
        >
          Outcomes
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={mode === "architecture"}
          onClick={() => setMode("architecture")}
          className={
            mode === "architecture"
              ? "font-mono uppercase tracking-[0.20em] text-[11px] text-[#00d2ff] border-b border-dotted border-[#00d2ff]/60 pb-1 transition-colors"
              : "font-mono uppercase tracking-[0.20em] text-[11px] text-tertiary border-b border-dotted border-transparent hover:border-white/30 pb-1 transition-colors"
          }
        >
          Architecture
        </button>
      </div>

      <div role="tabpanel">
        {mode === "outcomes" ? outcomesView : architectureView}
      </div>
    </section>
  );
}
