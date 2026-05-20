"use client";

import { motion } from "motion/react";
import { Shield } from "lucide-react";
import Pill from "@/components/ui/Pill";

const EASE = [0.22, 1, 0.36, 1] as const;

interface Certification {
  title: string;
  level: string;
  target: string;
}

const CERTIFICATIONS: Certification[] = [
  {
    title: "AWS Certified Solutions Architect",
    level: "Associate",
    target: "Q3 2026",
  },
  {
    title: "AWS Certified DevOps Engineer",
    level: "Professional",
    target: "Q1 2027",
  },
];

/**
 * Certifications & Objectives radar.
 *
 * Lives at the bottom of /stack. Each entry has a pulsing cyan
 * "Target" pill — visually signals "in motion" without claiming
 * the cert is already in hand. Pulse phase is staggered per-card
 * via the `delay` so the two dots don't beat in unison.
 *
 * Static content; the only client-side concern is the motion loop.
 * Hydration-safe (no Date.now(), no locale).
 */
export default function CertificationRadar() {
  return (
    <section className="mt-20 pt-12 border-t border-white/[0.06]">
      <div className="flex items-center gap-3 mb-3">
        <span className="text-quiet text-xs font-mono">08</span>
        <Shield
          className="w-4 h-4 text-secondary"
          strokeWidth={1.75}
          aria-hidden="true"
        />
        <h2 className="text-2xl md:text-3xl font-medium tracking-[-0.02em] text-primary">
          Certifications & Objectives
        </h2>
      </div>
      <p className="text-tertiary text-sm md:text-base leading-relaxed max-w-2xl mb-8">
        Production-grade work first, paper second. These exams are on the
        roadmap to formalise what&apos;s already shipping in production.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {CERTIFICATIONS.map((cert, i) => (
          <motion.div
            key={cert.title}
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{ duration: 0.5, delay: i * 0.1, ease: EASE }}
            className="relative rounded-xl border border-white/[0.06] bg-white/[0.02] p-5 overflow-hidden"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-primary font-medium text-sm md:text-base leading-tight">
                  {cert.title}
                </p>
                <p className="text-tertiary text-xs mt-1.5">{cert.level}</p>
              </div>

              {/* Target pill — V6 11.2 typed Pill (state-live with the
                  breathing cyan pulse). Phase-staggered per card via the
                  Pill's pulseDelay prop so the two pulses don't lock in
                  unison. */}
              <Pill
                kind="state-live"
                pulse
                pulseDelay={i * 0.4}
                className="whitespace-nowrap flex-shrink-0"
              >
                Target: {cert.target}
              </Pill>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
