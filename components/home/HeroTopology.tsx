"use client";

/**
 * HeroTopology — the homepage hero's right-column constellation.
 *
 * Thin client-side router that mirrors CWH's `AWSTopologyClient.tsx`:
 *
 *   first paint           → skeleton (zero-JS placeholder)
 *   after mount, mobile   → 2D SVG fallback (no three.js)
 *   after mount, desktop  → 3D three.js scene (dynamically imported)
 *
 * The three.js scene lives behind `dynamic(import("./HeroTopologyScene"))`
 * so the WebGL stack (three + @react-three/fiber + @react-three/drei,
 * ~210 KB gz combined) NEVER ships in the home page's initial JS
 * bundle. It loads idle after the LCP element paints, then swaps
 * the skeleton in place. This is the exact lazy-load pattern CWH
 * uses on `/projects/aws-waste-hunter`, transplanted whole-cloth
 * onto the hero.
 *
 * Mode selection:
 *   - viewport width < 768px → fallback (no three.js download at all)
 *   - prefers-reduced-motion → fallback (no autorotate / orbit toy)
 *   - everywhere else        → 3D scene, with reducedMotion forwarded
 *
 * History: the prior @xyflow/react implementation lived here briefly
 * (PRs #23 and #24). It was an honest attempt to fake spatial freedom
 * with CSS perspective on a flat node-graph renderer; the user's
 * correction made clear that the architectural problem demanded the
 * real CWH engine, not a CSS trick on top of the wrong renderer.
 * That implementation is gone — preserved only in git history.
 */

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import HeroTopologyFallback from "./HeroTopologyFallback";

/**
 * Skeleton placeholder. Zero-JS, paints instantly, holds the
 * topology's pixel real-estate so the hero grid doesn't reflow
 * once the WebGL chunk arrives + swaps in. Height matches the 3D
 * scene's `h-[560px] sm:h-[640px] lg:h-[720px]` so the swap is
 * geometrically invisible.
 */
function Skeleton() {
  return (
    <div
      className="relative w-full h-[560px] sm:h-[640px] lg:h-[720px]"
      aria-hidden="true"
    >
      {/* Faint cyan core haze — gives the skeleton just enough
          presence to signal "something is here" without competing
          for attention with the hero text. */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 50% 40% at 50% 50%, rgba(0,210,255,0.06) 0%, transparent 70%)",
        }}
      />
    </div>
  );
}

/* Dynamic import keeps three.js + r3f + drei off the initial JS
 * bundle. ssr:false because the WebGL Canvas can't render on the
 * server. */
const HeroTopologyScene = dynamic(() => import("./HeroTopologyScene"), {
  ssr: false,
  loading: () => <Skeleton />,
});

type Mode = "loading" | "scene" | "fallback";

export default function HeroTopology() {
  const [mode, setMode] = useState<Mode>("loading");
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const mobileMQ = window.matchMedia("(max-width: 767px)");
    const motionMQ = window.matchMedia("(prefers-reduced-motion: reduce)");

    const apply = () => {
      const reduced = motionMQ.matches;
      setReducedMotion(reduced);
      /* Mobile OR reduced-motion → fallback. Reduced-motion users
       * don't need the autorotate / orbit camera; they need the
       * same information presented statically. */
      setMode(mobileMQ.matches || reduced ? "fallback" : "scene");
    };

    apply();
    mobileMQ.addEventListener("change", apply);
    motionMQ.addEventListener("change", apply);
    return () => {
      mobileMQ.removeEventListener("change", apply);
      motionMQ.removeEventListener("change", apply);
    };
  }, []);

  if (mode === "loading") return <Skeleton />;
  if (mode === "fallback") return <HeroTopologyFallback />;
  return <HeroTopologyScene reducedMotion={reducedMotion} />;
}
