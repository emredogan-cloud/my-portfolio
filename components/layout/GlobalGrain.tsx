"use client";

import { useEffect, useState } from "react";

/**
 * Global cinematic film-grain layer.
 *
 * Deferred rendering: the SVG is NOT in the DOM for the first 3.5s
 * after mount. This eliminates the initial-paint cost of the
 * `feTurbulence` filter during the intro sequence, where the heaviest
 * animations are running. After the intro has completed (~3s), the
 * grain renders and fades in via the `grain-fade-in` keyframe in
 * globals.css.
 *
 * Was previously a server-rendered inline SVG in app/layout.tsx,
 * which forced the turbulence computation on the very first paint.
 */
export default function GlobalGrain() {
  const [render, setRender] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setRender(true), 3500);
    return () => clearTimeout(t);
  }, []);

  if (!render) return null;

  return (
    <svg
      className="pointer-events-none fixed inset-0 z-50 h-full w-full grain-fade-in"
      aria-hidden="true"
    >
      <filter id="noise">
        <feTurbulence
          type="fractalNoise"
          baseFrequency="0.8"
          numOctaves="3"
          stitchTiles="stitch"
        />
      </filter>
      <rect width="100%" height="100%" filter="url(#noise)" />
    </svg>
  );
}
