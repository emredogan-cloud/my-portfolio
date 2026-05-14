"use client";

import { motion } from "motion/react";
import { ArrowRight, Download } from "lucide-react";
import Link from "next/link";
import WordsPullUp from "@/components/ui/WordsPullUp";
import TerminalShowcase from "@/components/home/TerminalShowcase";

const NAV_ITEMS = [
  { label: "About", href: "/about" },
  { label: "Projects", href: "/projects" },
  { label: "Stack", href: "/stack" },
  { label: "Notes", href: "/notes" },
  { label: "Contact", href: "/contact" },
] as const;

const EASE: [number, number, number, number] = [0.16, 1, 0.3, 1];

export default function HeroSection() {
  return (
    <section className="relative min-h-screen bg-[#050505] overflow-hidden">

      {/* ── Atmospheric depth — three restrained layers ── */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(circle at 78% 25%, rgba(11,37,81,0.42) 0%, transparent 50%)",
        }}
      />
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(circle at 12% 85%, rgba(11,37,81,0.18) 0%, transparent 55%)",
        }}
      />
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ boxShadow: "inset 0 0 220px rgba(0,0,0,0.55)" }}
      />

      {/* ── Pill navbar — hangs from the top edge of the section ── */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 z-30">
        <div className="bg-black rounded-b-2xl md:rounded-b-3xl px-4 py-2 md:px-8">
          <nav className="flex items-center gap-3 sm:gap-6 md:gap-10 lg:gap-14">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className="text-[10px] sm:text-xs md:text-sm whitespace-nowrap text-secondary hover:text-primary transition-colors duration-200"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      </div>

      {/* ── Hero grid — split composition ── */}
      <div className="relative z-10 min-h-screen flex items-center pt-28 pb-16 lg:pt-32 lg:pb-20">
        <div className="w-full max-w-7xl mx-auto px-6 md:px-10 lg:px-12">
          <div className="grid lg:grid-cols-12 gap-10 lg:gap-12 items-center">

            {/* ── LEFT: identity stack ── */}
            <div className="lg:col-span-6 flex flex-col gap-6 lg:gap-7">

              {/* Eyebrow tagline */}
              <motion.p
                className="text-[10px] sm:text-xs tracking-[0.2em] uppercase text-secondary"
                initial={{ y: 12, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.8, delay: 0.3, ease: EASE }}
              >
                19. Self-taught. Monk Mode.
              </motion.p>

              {/* Giant identity heading */}
              <h1 className="text-6xl md:text-7xl xl:text-8xl font-semibold tracking-[-0.06em] leading-[0.9] text-white">
                <WordsPullUp text="Emre Doğan." />
              </h1>

              {/* Description */}
              <motion.p
                className="text-sm md:text-base text-secondary leading-relaxed max-w-lg"
                initial={{ y: 16, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.9, delay: 0.55, ease: EASE }}
              >
                AWS infrastructure, AI-native SaaS, and mobile systems — built
                between 01:30 bakery shifts and high-school exams. Two years
                self-taught. Zero shortcuts.
              </motion.p>

              {/* Availability indicator */}
              <motion.div
                className="inline-flex items-center gap-2 self-start rounded-full border border-white/10 bg-white/[0.04] px-3.5 py-1.5 text-[11px] sm:text-xs text-gray-300"
                initial={{ y: 16, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.9, delay: 0.7, ease: EASE }}
              >
                <motion.span
                  className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0"
                  animate={{ opacity: [1, 0.4, 1], scale: [1, 1.3, 1] }}
                  transition={{
                    duration: 2.6,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                />
                Available for Cloud, SaaS &amp; Mobile work.
              </motion.div>

              {/* CTAs — primary for general visitors, secondary for recruiters. */}
              <motion.div
                className="pt-2 flex flex-wrap items-center gap-3"
                initial={{ y: 16, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.9, delay: 0.85, ease: EASE }}
              >
                {/* Primary — Explore Projects */}
                <Link
                  href="/projects"
                  className="group inline-flex items-center gap-2 rounded-full pl-4 pr-1 py-1 bg-white hover:gap-3 transition-all duration-300"
                >
                  <span className="text-black font-medium text-sm sm:text-base">
                    Explore Projects
                  </span>
                  <div className="bg-black rounded-full w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center group-hover:scale-110 transition-transform duration-300 flex-shrink-0">
                    <ArrowRight className="w-4 h-4 text-white" />
                  </div>
                </Link>

                {/* Secondary — Download CV (recruiter-targeted ghost button) */}
                <a
                  href="/resume/emre-dogan.pdf"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-full px-5 py-2.5 glass-panel text-sm font-medium text-white/80 hover:text-white transition-colors"
                >
                  <Download className="w-4 h-4" aria-hidden="true" />
                  Download CV
                </a>
              </motion.div>
            </div>

            {/* ── RIGHT: terminal anchor ── */}
            <div className="lg:col-span-6 lg:pl-4">
              <TerminalShowcase />
            </div>

          </div>
        </div>
      </div>
    </section>
  );
}
