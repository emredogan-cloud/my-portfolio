/* ──────────────────────────────────────────────────────────────
 *  PhoneFrame — V6 Sub-PR 14.3
 *
 *  Wraps a scroll-story illustration in a phone-shaped container
 *  to reinforce the "edge ML on mobile" framing of FormAI's
 *  architecture walkthrough. The illustrations themselves are
 *  unchanged — they sit inside the phone's screen area at their
 *  native aspect, centered.
 *
 *  Pure CSS + SVG-free. Server-renderable (no `"use client"`).
 *  Zero animation surface — reduced-motion safe by construction
 *  per spec validation #2 ("Phone-frame variant respects reduced-
 *  motion (no parallax)").
 *
 *  Aspect ratio 9 / 19.5 matches a modern smartphone (iPhone 14
 *  family). max-width capped at 260 px / 280 px so the phone reads
 *  as a real device proportion, not a stretched panel.
 *
 *  Spec ref: PORTFOLYO_V6_UI_EXECUTION_SYSTEM.md § Sub-PR 14.3.
 *  Audit ref: PORTFOLYO_V6_UI_AUDIT.md § 6.2 ("ScrollStory excellent
 *             and repetitive simultaneously — three projects ship
 *             the same exact pattern").
 * ────────────────────────────────────────────────────────────── */

import type { ReactNode } from "react";

interface Props {
  children: ReactNode;
}

export default function PhoneFrame({ children }: Props) {
  return (
    <div
      className="relative mx-auto w-full max-w-[240px] sm:max-w-[260px] aspect-[9/19.5] rounded-[2.5rem] border border-white/[0.15] bg-black/40"
      style={{
        boxShadow:
          "inset 0 0 0 1px rgba(255,255,255,0.04), 0 24px 60px -28px rgba(0,210,255,0.18)",
      }}
    >
      {/* Outer ring detail — implies the device chrome. */}
      <div
        aria-hidden="true"
        className="absolute inset-[3px] rounded-[2.3rem] border border-white/[0.06]"
      />

      {/* Notch — small pill at the top. iPhone 14 dynamic-island scale. */}
      <div
        aria-hidden="true"
        className="absolute top-2.5 left-1/2 -translate-x-1/2 w-16 sm:w-20 h-4 sm:h-5 rounded-full bg-black/90 z-20"
      />

      {/* Side buttons — single thin highlight on each side. */}
      <div
        aria-hidden="true"
        className="absolute -right-[1px] top-20 w-[2px] h-10 rounded-l-full bg-white/[0.10]"
      />
      <div
        aria-hidden="true"
        className="absolute -left-[1px] top-16 w-[2px] h-6 rounded-r-full bg-white/[0.10]"
      />
      <div
        aria-hidden="true"
        className="absolute -left-[1px] top-28 w-[2px] h-12 rounded-r-full bg-white/[0.10]"
      />

      {/* Screen — inset for the notch zone + safe-area padding. The
          illustration sits centered inside; landscape illustrations
          centre with whitespace above/below. */}
      <div className="absolute inset-2.5 rounded-[2rem] overflow-hidden bg-black/30 flex items-center justify-center p-4 pt-10">
        {children}
      </div>
    </div>
  );
}
