"use client";

import { useEffect, useRef, useState } from "react";
import { useInView, motion } from "motion/react";
import { ArrowRight, Check } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import WordsPullUpMultiStyle from "@/components/ui/WordsPullUpMultiStyle";
import BentoDecomposeOverlay from "./BentoDecomposeOverlay";
import { confirmHaptic } from "@/lib/haptic";

const HEADER_SEGMENTS = [
  {
    text: "Production-grade tools built for scale.",
    className: "text-primary",
  },
  {
    text: "Shipped with intention. Powered by craft.",
    className: "text-tertiary",
  },
] as const;

const PROJECTS = [
  {
    id: "aws-waste-hunter",
    number: "01",
    title: "Cloud Waste Hunter.",
    image: "/projects/aws-waste-hunter/showcase.png",
    items: [
      "Cross-account AWS scanning via STS AssumeRole",
      "LLM remediation via Claude on AWS Bedrock",
      "Cost analytics with Glue + Athena data lake",
      "Lemon Squeezy subscription monetization",
    ],
    /* Flagship — spans 2 cols on md, plus 2 rows on lg for a
       cinematic Apple-style asymmetric bento. */
    spanClass: "md:col-span-2 lg:row-span-2",
    /* Hover/tap → service nodes (Lambda, API GW, Bedrock, DynamoDB,
       S3) fly outward from the card centre, hold ~2s, reassemble.
       Single-card opt-in via BentoDecomposeOverlay. */
    decompose: true,
  },
  {
    id: "vibing-coder-ai",
    number: "02",
    title: "VibingCoderAI.",
    image: "/projects/vibing-coder-ai/showcase.png",
    items: [
      "Translates casual ideas to senior-grade prompts",
      "Next.js 16 + AWS Lambda decoupled monorepo",
      "Full Terraform infrastructure as code",
    ],
    spanClass: "",
  },
  {
    id: "sixpack-ai",
    number: "03",
    title: "FormAI.",
    image: "/projects/sixpack-ai/screenshot-1.jpg",
    items: [
      "Real-time pose detection via Google ML Kit",
      "Flutter native with RevenueCat subscriptions",
      "Supabase + Sentry + PostHog analytics stack",
    ],
    spanClass: "",
  },
] as const;

const CARD_EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

/* ─────────────────────────────────────────────────────────────
   ImageProjectCard — full-cover background image + cinematic
   dark gradient + vignette + bottom-aligned text hierarchy.
   spanClass is applied to the outer wrapper so the same component
   composes both the flagship (2x2) cell and the standard (1x1) cells.
   ───────────────────────────────────────────────────────────── */
interface ImageProjectCardProps {
  id: string;
  number: string;
  title: string;
  image: string;
  items: readonly string[];
  index: number;
  isInView: boolean;
  spanClass?: string;
  /** When true, hover (desktop) / tap (mobile) triggers the
   *  BentoDecomposeOverlay service-node fly-out for ~3.5s. */
  decompose?: boolean;
}

/* How long the decompose stays visible after a single trigger.
   3.5s is long enough to read the five labels and snap a screenshot
   without holding hover; the parent ignores re-triggers during this
   window so the animation can't stutter. */
const DECOMPOSE_HOLD_MS = 3500;

function ImageProjectCard({
  id,
  number,
  title,
  image,
  items,
  index,
  isInView,
  spanClass = "",
  decompose = false,
}: ImageProjectCardProps) {
  const [isDecomposed, setIsDecomposed] = useState(false);
  const resetTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const triggerDecompose = () => {
    if (!decompose) return;
    if (isDecomposed) return; // ignore re-triggers within the hold window
    confirmHaptic();
    setIsDecomposed(true);
    if (resetTimerRef.current) clearTimeout(resetTimerRef.current);
    resetTimerRef.current = setTimeout(() => {
      setIsDecomposed(false);
      resetTimerRef.current = null;
    }, DECOMPOSE_HOLD_MS);
  };

  // Cleanup on unmount so a navigation away mid-decompose doesn't
  // leak the timer.
  useEffect(() => {
    return () => {
      if (resetTimerRef.current) {
        clearTimeout(resetTimerRef.current);
        resetTimerRef.current = null;
      }
    };
  }, []);

  return (
    <motion.div
      className={`relative rounded-2xl overflow-hidden h-full min-h-[320px] lg:min-h-0 group ${spanClass}`}
      initial={{ scale: 0.95, opacity: 0 }}
      animate={isInView ? { scale: 1, opacity: 1 } : { scale: 0.95, opacity: 0 }}
      transition={{
        duration: 0.7,
        delay: index * 0.12,
        ease: CARD_EASE,
      }}
      onHoverStart={triggerDecompose}
      onTap={triggerDecompose}
    >
      {/* Background image — fully covers the card */}
      <Image
        src={image}
        alt={title}
        fill
        className="object-cover object-center transition-transform duration-[1200ms] ease-out group-hover:scale-[1.04]"
        sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
      />

      {/* Cinematic readability gradient — heaviest at bottom */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/75 to-black/25 pointer-events-none" />

      {/* Edge vignette — focuses the eye toward the content area */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ boxShadow: "inset 0 0 120px rgba(0,0,0,0.65)" }}
      />

      {/* Decompose overlay — only mounted on cards with decompose
          enabled. Internally returns null under prefers-reduced-motion
          and renders nothing when isActive is false (idle 0% CPU). */}
      {decompose && <BentoDecomposeOverlay isActive={isDecomposed} />}

      {/* Content */}
      <div className="relative h-full p-6 flex flex-col">
        {/* Top: number badge */}
        <div className="flex justify-end">
          <span className="text-quiet text-xs font-light">{number}</span>
        </div>

        {/* Bottom: title + checklist + view link */}
        <div className="mt-auto space-y-4">
          <h3 className="text-primary font-medium text-base sm:text-lg leading-snug">
            {title}
          </h3>

          <ul className="space-y-2">
            {items.map((item, i) => (
              <li key={i} className="flex items-start gap-2">
                <Check className="w-3 h-3 text-primary/80 mt-1 flex-shrink-0" />
                <span className="text-secondary text-xs leading-snug">
                  {item}
                </span>
              </li>
            ))}
          </ul>

          <div className="pt-3 border-t border-white/[0.08]">
            <Link
              href={`/projects/${id}`}
              className="flex items-center gap-1.5 py-3 -my-1 text-secondary text-xs sm:text-sm hover:text-primary transition-colors duration-200"
            >
              View project
              <ArrowRight
                className="w-3 h-3 flex-shrink-0"
                style={{ transform: "rotate(-45deg)" }}
              />
            </Link>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export default function BentoSection() {
  const gridRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(gridRef, { once: true, margin: "-100px" });

  return (
    <section className="min-h-screen bg-black relative py-16 sm:py-20 md:py-24 lg:py-32 px-4 sm:px-6 md:px-8">
      {/* Subtle noise texture */}
      <div className="bg-noise absolute inset-0 opacity-[0.15] pointer-events-none" />

      <div className="relative max-w-7xl mx-auto">

        {/* Section header */}
        <div className="mb-12 sm:mb-16 md:mb-20">
          <div className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-normal">
            <WordsPullUpMultiStyle
              segments={HEADER_SEGMENTS}
              containerClassName="justify-start"
            />
          </div>
        </div>

        {/* ── Asymmetric Apple-style bento ──
            Mobile (1 col):      stacked
            Tablet (md, 2 cols): CWH spans both rows, VCAI+SixPack share row 2
            Desktop (lg, 3 cols × 2 rows):
              CWH 2×2 flagship | VCAI    (top-right)
                               | SixPack (bottom-right)                       */}
        <div
          ref={gridRef}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 lg:grid-rows-2 gap-3 sm:gap-4 lg:h-[640px]"
        >
          {PROJECTS.map((project, i) => (
            <ImageProjectCard
              key={project.id}
              {...project}
              index={i}
              isInView={isInView}
            />
          ))}
        </div>

      </div>
    </section>
  );
}
