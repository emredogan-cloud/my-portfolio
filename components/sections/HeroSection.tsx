"use client";

import { motion } from "motion/react";
import { ArrowRight, Download } from "lucide-react";
import Link from "next/link";
import WordsPullUp from "@/components/ui/WordsPullUp";
import HeroTopology from "@/components/home/HeroTopology";

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

      {/* The global `<Navbar />` (mounted in app/layout.tsx) overlays
          this hero via `fixed top-0 z-40`. The previous inline pill
          nav has been removed — single source of truth lives in
          components/layout/Navbar.tsx. The `pt-28 lg:pt-32` below
          still gives the hero content clear headroom under the h-16
          fixed navbar (~64px nav + ~48px breathing room). */}

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

            {/* ── RIGHT: constellation in open spatial atmosphere.
                Same architecture family as the Cloud Waste Hunter
                topology — three.js scene with an alpha:true Canvas,
                so the page background bleeds through and the
                constellation reads as floating in open space rather
                than embedded in a card. The lazy import keeps the
                WebGL stack out of the home page's initial JS budget.
                Negative right margin on lg+ lets the canvas spill
                past the column edge into the page atmosphere. ── */}
            <div className="lg:col-span-6 lg:pl-4 lg:-mr-6 xl:-mr-12 relative">
              <motion.div
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 1.1, delay: 0.55, ease: EASE }}
              >
                <HeroTopology />
              </motion.div>
            </div>

          </div>
        </div>
      </div>
    </section>
  );
}
