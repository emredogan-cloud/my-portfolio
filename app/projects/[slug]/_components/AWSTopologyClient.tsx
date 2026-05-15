"use client";

/**
 * Picks between the 3D scene and the 2D SVG fallback at runtime.
 *
 * Decisions:
 *   - First paint: skeleton card (zero JS-cost placeholder).
 *   - After mount: media-query gate. Viewport < 768px → 2D fallback.
 *     Anywhere wider → 3D scene, dynamically imported so three.js
 *     never reaches any other route.
 *   - prefers-reduced-motion is forwarded to the 3D scene where it
 *     stops the autorotate; the fallback is static by construction
 *     so it needs no special handling.
 *
 * The dynamic() call lives inside a Client Component because
 * `ssr: false` is a client-only option in App Router.
 */

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import TopologyMobileFallback from "./TopologyMobileFallback";

function SkeletonScene() {
  return (
    <div
      className="h-[480px] sm:h-[560px] w-full rounded-2xl border border-white/[0.04] bg-white/[0.02] animate-pulse"
      aria-hidden="true"
    />
  );
}

const AWSTopologyScene = dynamic(() => import("./AWSTopologyScene"), {
  ssr: false,
  loading: () => <SkeletonScene />,
});

type Mode = "loading" | "scene" | "fallback";

export default function AWSTopologyClient() {
  const [mode, setMode] = useState<Mode>("loading");
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const mobileMQ = window.matchMedia("(max-width: 767px)");
    const motionMQ = window.matchMedia("(prefers-reduced-motion: reduce)");

    const apply = () => {
      setReducedMotion(motionMQ.matches);
      setMode(mobileMQ.matches ? "fallback" : "scene");
    };

    apply();
    mobileMQ.addEventListener("change", apply);
    motionMQ.addEventListener("change", apply);
    return () => {
      mobileMQ.removeEventListener("change", apply);
      motionMQ.removeEventListener("change", apply);
    };
  }, []);

  if (mode === "loading") return <SkeletonScene />;
  if (mode === "fallback") return <TopologyMobileFallback />;
  return <AWSTopologyScene reducedMotion={reducedMotion} />;
}
