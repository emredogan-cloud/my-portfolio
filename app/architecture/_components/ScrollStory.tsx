"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import type { Milestone, IllustrationsById } from "./types";
import PhoneFrame from "./PhoneFrame";

const EASE = [0.22, 1, 0.36, 1] as const;

/**
 * ScrollStory — the project-agnostic scroll-story engine for the
 * /architecture section.
 *
 * Each project page under /architecture/{project} supplies its own
 * milestones array + illustration dispatch map and feeds them in
 * via props. The engine handles:
 *   1. SSR-render every milestone so crawlers + JS-disabled visitors
 *      still see the full story.
 *   2. IntersectionObserver-driven active-milestone tracking.
 *   3. A single fixed cyan background blob whose position eases
 *      toward `active.gradient.{x,y,intensity}`.
 *   4. Sticky pill at the top showing the current step + N/total.
 *   5. Mobile scroll-snap, opt-in via a body class scoped under
 *      (max-width: 767px) in globals.css.
 *
 * Cinematic identity: stays inside the cyan/black palette by varying
 * gradient POSITION + INTENSITY, not hue.
 *
 * Reduced motion: useReducedMotion disables the eased background
 * transition + the per-milestone fade-up. Content remains legible.
 *
 * V6 Sub-PR 14.3 — `variant` prop introduces three project-specific
 * tonal variations of the same engine. Spec validation #1 requires
 * the existing CWH page render byte-identical when no variant is
 * passed. The runtime gate below makes that explicit: when the
 * V6_ARCH_VARIANTS flag is OFF or the variant prop is absent or
 * equals 'wide-text', the layout collapses to the V5 default
 * (text col-span-7 / illustration col-span-5, default bordered
 * card wrapper). 'wide-illustration' inverts the column ratio for
 * VCA; 'phone-frame' wraps the illustration in a phone-shaped
 * mockup for FormAI.
 */

export type ScrollStoryVariant =
  | "wide-text"
  | "wide-illustration"
  | "phone-frame";

interface ScrollStoryProps {
  /** Ordered list of milestones to render. */
  milestones: readonly Milestone[];
  /** Map from milestone.id → SVG illustration component. Missing
   *  entries are tolerated; the engine just renders no illustration
   *  for that step. */
  illustrationsById: IllustrationsById;
  /**
   * V6 14.3 — per-project tonal variation. When the V6_ARCH_VARIANTS
   * flag is off, this prop is ignored and the engine renders the
   * `wide-text` default (V5 byte-identical layout). When the flag is
   * on, each project's variant is honoured.
   */
  variant?: ScrollStoryVariant;
}

export default function ScrollStory({
  milestones,
  illustrationsById,
  variant,
}: ScrollStoryProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const milestoneRefs = useRef<(HTMLLIElement | null)[]>([]);
  const ratiosRef = useRef<Map<number, number>>(new Map());
  const prefersReducedMotion = useReducedMotion();

  /* Spec validation #1 — when the flag is off OR no variant is
     passed, the engine MUST render byte-identical to the V5 CWH
     page. The runtime gate collapses every input to 'wide-text'
     under those conditions. */
  const flagOn = process.env.NEXT_PUBLIC_V6_ARCH_VARIANTS === "1";
  const effectiveVariant: ScrollStoryVariant = flagOn
    ? variant ?? "wide-text"
    : "wide-text";

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

  /* Mobile scroll-snap opt-in. Body class is added on mount and
     removed on unmount so other routes never inherit the behaviour.
     CSS rule itself lives in app/globals.css and only activates
     under (max-width: 767px). */
  useEffect(() => {
    if (typeof document === "undefined") return;
    const klass = "architecture-scroll-snap";
    document.body.classList.add(klass);
    return () => document.body.classList.remove(klass);
  }, []);

  const active = milestones[activeIndex] ?? milestones[0];
  if (!active) return null;

  return (
    <div className="relative">
      <BackgroundBlob
        x={active.gradient.x}
        y={active.gradient.y}
        intensity={active.gradient.intensity}
        reducedMotion={!!prefersReducedMotion}
      />

      <ProgressHeader
        active={active}
        activeIndex={activeIndex}
        total={milestones.length}
      />

      <ol className="relative z-10 mt-20">
        {milestones.map((m, i) => (
          <MilestoneSection
            key={m.id}
            milestone={m}
            illustration={illustrationsById[m.id]}
            index={i}
            registerRef={(el) => {
              milestoneRefs.current[i] = el;
            }}
            reducedMotion={!!prefersReducedMotion}
            variant={effectiveVariant}
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
  total: number;
}

function ProgressHeader({ active, activeIndex, total }: ProgressHeaderProps) {
  return (
    <div
      className="sticky top-4 z-20 mx-auto w-fit max-w-[calc(100vw-1.5rem)] px-3"
      aria-hidden="true"
    >
      <div className="inline-flex items-center gap-2 sm:gap-3 rounded-full border border-white/[0.08] bg-black/70 px-3 sm:px-4 py-1.5 backdrop-blur-md">
        <span className="text-[9px] sm:text-[10px] font-mono uppercase tracking-[0.16em] sm:tracking-[0.18em] text-[#00d2ff]/85 whitespace-nowrap truncate">
          {active.accent}
        </span>
        <span className="text-[9px] sm:text-[10px] uppercase tracking-[0.14em] sm:tracking-[0.16em] text-quiet whitespace-nowrap">
          {activeIndex + 1} / {total}
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
  illustration?: (p: { className?: string }) => React.ReactNode;
  index: number;
  registerRef: (el: HTMLLIElement | null) => void;
  reducedMotion: boolean;
  variant: ScrollStoryVariant;
}

function MilestoneSection({
  milestone,
  illustration: Illustration,
  index,
  registerRef,
  reducedMotion,
  variant,
}: MilestoneSectionProps) {
  /* V6 14.3 — variant-driven column ratio.
       wide-text          → text 7 / ill 5 (CWH default, V5 byte-identical)
       wide-illustration  → text 5 / ill 7 (VCA — agents benefit from larger art)
       phone-frame        → text 7 / ill 5 (FormAI — same ratio, phone wrapper)
     The phone-frame variant keeps the wide-text ratio AND wraps the
     illustration in <PhoneFrame> to reinforce the "edge ML on mobile"
     framing of FormAI's architecture. */
  const isWideIllustration = variant === "wide-illustration";
  const isPhoneFrame = variant === "phone-frame";

  const textColSpan = isWideIllustration ? "md:col-span-5" : "md:col-span-7";
  const illustrationColSpan = isWideIllustration
    ? "md:col-span-7"
    : "md:col-span-5";

  return (
    <li
      ref={registerRef}
      data-index={index}
      data-milestone-id={milestone.id}
      className="relative min-h-[100svh] flex items-center py-16 sm:py-20"
    >
      <motion.div
        initial={reducedMotion ? false : { opacity: 0, y: 28 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-20%" }}
        transition={{ duration: 0.9, ease: EASE }}
        className="grid grid-cols-1 md:grid-cols-12 items-center gap-8 md:gap-14 w-full"
      >
        <div className={`${textColSpan} space-y-4 sm:space-y-5`}>
          <p className="text-[10px] font-mono uppercase tracking-[0.22em] text-[#00d2ff]/80">
            {milestone.accent}
          </p>
          <h2 className="text-3xl sm:text-4xl md:text-6xl font-semibold tracking-[-0.04em] leading-[1.05] sm:leading-[1] text-primary">
            {milestone.title}
          </h2>
          <p className="text-secondary text-[15px] sm:text-base md:text-lg leading-relaxed max-w-2xl">
            {milestone.body}
          </p>
        </div>
        <div className={illustrationColSpan}>
          {Illustration ? (
            isPhoneFrame ? (
              <PhoneFrame>
                <Illustration className="w-full h-auto max-w-full" />
              </PhoneFrame>
            ) : (
              <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-3 sm:p-5">
                <Illustration
                  className={
                    isWideIllustration
                      ? "w-full h-auto max-w-[480px] sm:max-w-[520px] mx-auto"
                      : "w-full h-auto max-w-[320px] sm:max-w-[360px] mx-auto"
                  }
                />
              </div>
            )
          ) : null}
        </div>
      </motion.div>
    </li>
  );
}
