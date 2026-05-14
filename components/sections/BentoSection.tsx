"use client";

import { useRef } from "react";
import { useInView, motion } from "motion/react";
import { ArrowRight, Check } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import WordsPullUpMultiStyle from "@/components/ui/WordsPullUpMultiStyle";

const HEADER_SEGMENTS = [
  {
    text: "Production-grade tools built for scale.",
    className: "text-primary",
  },
  {
    text: "Shipped with intention. Powered by craft.",
    className: "text-gray-500",
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
  },
  {
    id: "sixpack-ai",
    number: "03",
    title: "SixPack AI.",
    image: "/projects/sixpack-ai/screenshot-1.jpg",
    items: [
      "Real-time pose detection via Google ML Kit",
      "Flutter native with RevenueCat subscriptions",
      "Supabase + Sentry + PostHog analytics stack",
    ],
  },
] as const;

const CARD_EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

/* ─── Inline brand SVGs (lucide v1.14 has no Github/Linkedin) ─── */
function GitHubIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 0C5.37 0 0 5.37 0 12c0 5.3 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61-.546-1.385-1.335-1.755-1.335-1.755-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23A11.51 11.51 0 0 1 12 5.803c1.02.005 2.047.138 3.006.404 2.29-1.552 3.297-1.23 3.297-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 21.795 24 17.295 24 12c0-6.63-5.37-12-12-12z" />
    </svg>
  );
}

function LinkedInIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
    </svg>
  );
}

/* ─────────────────────────────────────────────────────────────
   CARD 1 — Developer Presence / Social Hub
   Dot grid background + pulsing availability indicator +
   social links with arrow micro-animation
   ───────────────────────────────────────────────────────────── */
function SocialHubCard({ isInView }: { isInView: boolean }) {
  return (
    <motion.div
      className="relative bg-[#0d0d0d] rounded-2xl p-6 flex flex-col h-full min-h-[320px] lg:min-h-0 overflow-hidden"
      initial={{ scale: 0.95, opacity: 0 }}
      animate={isInView ? { scale: 1, opacity: 1 } : { scale: 0.95, opacity: 0 }}
      transition={{ duration: 0.7, delay: 0, ease: CARD_EASE }}
    >
      {/* Subtle dot-grid background */}
      <div
        className="absolute inset-0 opacity-30 pointer-events-none"
        style={{
          backgroundImage:
            "radial-gradient(circle, rgba(222,219,200,0.08) 1px, transparent 1px)",
          backgroundSize: "18px 18px",
        }}
      />
      {/* Warm radial highlight */}
      <div
        className="absolute -top-24 -right-24 w-72 h-72 rounded-full blur-3xl opacity-25 pointer-events-none"
        style={{
          background:
            "radial-gradient(circle, rgba(222,219,200,0.18) 0%, transparent 70%)",
        }}
      />

      <div className="relative flex flex-col h-full">
        {/* Status indicator */}
        <div className="flex items-center gap-2 mb-6">
          <motion.span
            className="w-1.5 h-1.5 rounded-full bg-emerald-400"
            animate={{ opacity: [1, 0.35, 1], scale: [1, 1.4, 1] }}
            transition={{
              duration: 2.5,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
          <span className="text-primary/40 text-[10px] uppercase tracking-widest">
            Available
          </span>
        </div>

        {/* Title */}
        <h3 className="text-primary font-medium text-xl sm:text-2xl leading-tight mb-3">
          Let&apos;s connect.
        </h3>

        {/* Supporting copy */}
        <p className="text-gray-400 text-xs sm:text-sm leading-relaxed mb-auto pb-6">
          Building cloud-native systems, AI tooling, and developer
          infrastructure.
        </p>

        {/* Social links */}
        <div className="space-y-1.5">
          <a
            href="https://github.com/emredogan-cloud"
            target="_blank"
            rel="noopener noreferrer"
            className="group flex items-center justify-between gap-3 py-2.5 px-3 -mx-3 rounded-lg hover:bg-white/[0.04] transition-colors duration-200"
          >
            <div className="flex items-center gap-2.5">
              <GitHubIcon className="w-4 h-4 text-primary/70 group-hover:text-primary transition-colors" />
              <div>
                <p className="text-primary text-xs sm:text-sm font-medium leading-none">
                  GitHub
                </p>
                <p className="text-gray-500 text-[10px] sm:text-xs mt-0.5">
                  @emredogan-cloud
                </p>
              </div>
            </div>
            <ArrowRight
              className="w-3.5 h-3.5 text-gray-600 group-hover:text-primary transition-all duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
              style={{ transform: "rotate(-45deg)" }}
            />
          </a>

          <a
            href="https://www.linkedin.com/in/emre-do%C4%9Fan-657a99388/"
            target="_blank"
            rel="noopener noreferrer"
            className="group flex items-center justify-between gap-3 py-2.5 px-3 -mx-3 rounded-lg hover:bg-white/[0.04] transition-colors duration-200"
          >
            <div className="flex items-center gap-2.5">
              <LinkedInIcon className="w-4 h-4 text-primary/70 group-hover:text-primary transition-colors" />
              <div>
                <p className="text-primary text-xs sm:text-sm font-medium leading-none">
                  LinkedIn
                </p>
                <p className="text-gray-500 text-[10px] sm:text-xs mt-0.5">
                  Emre Doğan
                </p>
              </div>
            </div>
            <ArrowRight
              className="w-3.5 h-3.5 text-gray-600 group-hover:text-primary transition-all duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
              style={{ transform: "rotate(-45deg)" }}
            />
          </a>
        </div>
      </div>
    </motion.div>
  );
}

/* ─────────────────────────────────────────────────────────────
   CARDS 2-4 — Image background project cards
   Full-cover background image + cinematic dark gradient
   + vignette + bottom-aligned text hierarchy
   ───────────────────────────────────────────────────────────── */
interface ImageProjectCardProps {
  id: string;
  number: string;
  title: string;
  image: string;
  items: readonly string[];
  index: number;
  isInView: boolean;
}

function ImageProjectCard({
  id,
  number,
  title,
  image,
  items,
  index,
  isInView,
}: ImageProjectCardProps) {
  return (
    <motion.div
      className="relative rounded-2xl overflow-hidden h-full min-h-[320px] lg:min-h-0 group"
      initial={{ scale: 0.95, opacity: 0 }}
      animate={isInView ? { scale: 1, opacity: 1 } : { scale: 0.95, opacity: 0 }}
      transition={{
        duration: 0.7,
        delay: (index + 1) * 0.15,
        ease: CARD_EASE,
      }}
    >
      {/* Background image — fully covers the card */}
      <Image
        src={image}
        alt={title}
        fill
        className="object-cover object-center transition-transform duration-[1200ms] ease-out group-hover:scale-[1.04]"
        sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 25vw"
      />

      {/* Cinematic readability gradient — heaviest at bottom */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/75 to-black/25 pointer-events-none" />

      {/* Edge vignette — focuses the eye toward the content area */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ boxShadow: "inset 0 0 120px rgba(0,0,0,0.65)" }}
      />

      {/* Content */}
      <div className="relative h-full p-6 flex flex-col">
        {/* Top: number badge */}
        <div className="flex justify-end">
          <span className="text-primary/30 text-xs font-light">{number}</span>
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
                <span className="text-primary/75 text-xs leading-snug">
                  {item}
                </span>
              </li>
            ))}
          </ul>

          <div className="pt-3 border-t border-white/[0.08]">
            <Link
              href={`/projects/${id}`}
              className="flex items-center gap-1.5 text-primary/70 text-xs sm:text-sm hover:text-primary transition-colors duration-200"
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

        {/* 4-column bento grid */}
        <div
          ref={gridRef}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-2 md:gap-1 lg:h-[480px]"
        >
          {/* Card 1 — Social Hub */}
          <SocialHubCard isInView={isInView} />

          {/* Cards 2-4 — Image project cards */}
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
