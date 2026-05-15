"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { MILESTONES, type Milestone } from "./milestones";
import { ILLUSTRATION_BY_ID } from "./Illustrations";

const EASE = [0.22, 1, 0.36, 1] as const;

/**
 * ScrollStory — the interactive engine for /architecture.
 *
 * Responsibilities (Step 2 — engine only):
 *   1. Render all 8 milestones as a vertical list of full-screen
 *      sections. The SSR pass produces the same HTML so crawlers and
 *      JS-disabled visitors still see the story.
 *   2. Track the active milestone via IntersectionObserver — picks
 *      whichever milestone has the highest intersection ratio at any
 *      moment, so the active state is robust to fast scrolling.
 *   3. Drive a single fixed background blob whose position eases
 *      toward the active milestone's `gradient.{x,y,intensity}`.
 *   4. Mount a sticky header at the top showing the current step
 *      eyebrow + progress.
 *
 * Step 3 (next commit) widens each milestone's body and adds the
 * per-step illustrations. Step 4 layers mobile-specific polish.
 *
 * Identity: stays inside the cyan/black palette by varying gradient
 * POSITION + INTENSITY, not hue — so the cinematic identity rules
 * (no new accents) hold.
 *
 * Reduced motion: useReducedMotion disables the background eased
 * transition and the per-milestone fade-up. The content is fully
 * legible without animation.
 */
export default function ScrollStory() {
  const [activeIndex, setActiveIndex] = useState(0);
  const milestoneRefs = useRef<(HTMLLIElement | null)[]>([]);
  const ratiosRef = useRef<Map<number, number>>(new Map());
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    if (typeof IntersectionObserver === "undefined") return;
    const obs = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          const idx = Number(e.target.getAttribute("data-index"));
          if (!Number.isFinite(idx)) continue;
          ratiosRef.current.set(idx, e.intersectionRatio);
        }
        // Pick the milestone with the largest current intersection.
        // Ties broken by the earliest index — keeps the active state
        // stable on slow scrolls.
        let bestIdx = 0;
        let bestRatio = -1;
        for (const [idx, ratio] of ratiosRef.current) {
          if (ratio > bestRatio) {
            bestRatio = ratio;
            bestIdx = idx;
          }
        }
        setActiveIndex(bestIdx);
      },
      {
        threshold: Array.from({ length: 11 }, (_, i) => i / 10),
        rootMargin: "0px 0px -25% 0px",
      },
    );

    milestoneRefs.current.forEach((el) => {
      if (el) obs.observe(el);
    });
    return () => obs.disconnect();
  }, []);

  const active = MILESTONES[activeIndex] ?? MILESTONES[0];

  return (
    <div className="relative">
      <BackgroundBlob
        x={active.gradient.x}
        y={active.gradient.y}
        intensity={active.gradient.intensity}
        reducedMotion={!!prefersReducedMotion}
      />

      <ProgressHeader active={active} activeIndex={activeIndex} />

      <ol
        className="relative z-10 mt-20"
        aria-label="Cloud Waste Hunter architecture, eight steps"
      >
        {MILESTONES.map((m, i) => (
          <MilestoneSection
            key={m.id}
            milestone={m}
            index={i}
            registerRef={(el) => {
              milestoneRefs.current[i] = el;
            }}
            reducedMotion={!!prefersReducedMotion}
          />
        ))}
      </ol>
    </div>
  );
}

/* ── Sticky progress chip + counter ──────────────────────────────── */

interface ProgressHeaderProps {
  active: Milestone;
  activeIndex: number;
}

function ProgressHeader({ active, activeIndex }: ProgressHeaderProps) {
  return (
    <div
      className="sticky top-4 z-20 mx-auto w-fit"
      aria-hidden="true"
    >
      <div className="inline-flex items-center gap-3 rounded-full border border-white/[0.08] bg-black/60 px-4 py-1.5 backdrop-blur-md">
        <span className="text-[10px] font-mono uppercase tracking-[0.18em] text-[#00d2ff]/85 whitespace-nowrap">
          {active.accent}
        </span>
        <span className="text-[10px] uppercase tracking-[0.16em] text-white/30">
          {activeIndex + 1} / {MILESTONES.length}
        </span>
      </div>
    </div>
  );
}

/* ── Background blob — single layer, position eases per milestone ── */

interface BackgroundBlobProps {
  x: number;
  y: number;
  intensity: number;
  reducedMotion: boolean;
}

function BackgroundBlob({ x, y, intensity, reducedMotion }: BackgroundBlobProps) {
  const transitionStyle = reducedMotion
    ? "none"
    : "background 1.6s cubic-bezier(0.22, 1, 0.36, 1)";
  return (
    <div
      className="pointer-events-none fixed inset-0 z-0"
      aria-hidden="true"
      style={{
        background: `radial-gradient(ellipse at ${x}% ${y}%, rgba(0,210,255,${intensity}) 0%, transparent 60%)`,
        transition: transitionStyle,
      }}
    />
  );
}

/* ── Single milestone section ───────────────────────────────────── */

interface MilestoneSectionProps {
  milestone: Milestone;
  index: number;
  registerRef: (el: HTMLLIElement | null) => void;
  reducedMotion: boolean;
}

function MilestoneSection({
  milestone,
  index,
  registerRef,
  reducedMotion,
}: MilestoneSectionProps) {
  const Illustration = ILLUSTRATION_BY_ID[milestone.id];
  return (
    <li
      ref={registerRef}
      data-index={index}
      data-milestone-id={milestone.id}
      className="relative min-h-[100svh] flex items-center px-2 sm:px-6"
    >
      <motion.div
        initial={reducedMotion ? false : { opacity: 0, y: 28 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-20%" }}
        transition={{ duration: 0.9, ease: EASE }}
        className="grid grid-cols-1 md:grid-cols-12 items-center gap-10 md:gap-14 w-full"
      >
        <div className="md:col-span-7 space-y-5">
          <p className="text-[10px] font-mono uppercase tracking-[0.22em] text-[#00d2ff]/80">
            {milestone.accent}
          </p>
          <h2 className="text-4xl md:text-6xl font-semibold tracking-[-0.04em] leading-[1] text-white">
            {milestone.title}
          </h2>
          <p className="text-white/65 text-base md:text-lg leading-relaxed max-w-2xl">
            {milestone.body}
          </p>
        </div>
        <div className="md:col-span-5">
          {Illustration ? (
            <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4 sm:p-5">
              <Illustration className="w-full h-auto max-w-[360px] mx-auto" />
            </div>
          ) : null}
        </div>
      </motion.div>
    </li>
  );
}
