"use client";

/**
 * CodexTopology — client-side mode router for the narrative
 * constellation.
 *
 * Mirror of components/home/HeroTopology.tsx, parametrised on the
 * per-book `nodes` + `edges`. Picks at runtime between:
 *
 *   first paint           → skeleton (zero-JS placeholder)
 *   after mount, mobile   → 2D SVG fallback (no three.js)
 *   after mount, desktop  → 3D scene via `dynamic(import())`
 *
 * The three.js scene chunk only loads on capable viewports, and
 * even there only on /codex/[slug] — never on the index, never on
 * other routes.
 */

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import CodexTopologyFallback from "./CodexTopologyFallback";
import type { CodexNode, CodexEdge } from "@/data/codex";

function Skeleton() {
  return (
    <div
      className="relative w-full h-[560px] sm:h-[640px] lg:h-[720px]"
      aria-hidden="true"
    >
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

const CodexTopologyScene = dynamic(() => import("./CodexTopologyScene"), {
  ssr: false,
  loading: () => <Skeleton />,
});

type Mode = "loading" | "scene" | "fallback";

interface Props {
  nodes: readonly CodexNode[];
  edges: readonly CodexEdge[];
}

export default function CodexTopology({ nodes, edges }: Props) {
  const [mode, setMode] = useState<Mode>("loading");
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const mobileMQ = window.matchMedia("(max-width: 767px)");
    const motionMQ = window.matchMedia("(prefers-reduced-motion: reduce)");

    const apply = () => {
      const reduced = motionMQ.matches;
      setReducedMotion(reduced);
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
  if (mode === "fallback") return <CodexTopologyFallback nodes={nodes} edges={edges} />;
  return <CodexTopologyScene nodes={nodes} edges={edges} reducedMotion={reducedMotion} />;
}
