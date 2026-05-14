"use client";

import { useRef } from "react";
import { motion, useInView } from "motion/react";
import type { LucideIcon } from "lucide-react";
import { DollarSign, Network, Zap } from "lucide-react";

const EASE = [0.22, 1, 0.36, 1] as const;

interface Metric {
  icon: LucideIcon;
  label: string;
  value: string;
  suffix?: string;
  hint: string;
}

const METRICS: Metric[] = [
  {
    icon: DollarSign,
    label: "Total Waste Identified",
    value: "$42,500",
    suffix: "+",
    hint: "Across all scanned AWS accounts",
  },
  {
    icon: Network,
    label: "Active Cross-Account Scanners",
    value: "14",
    hint: "STS AssumeRole sessions",
  },
  {
    icon: Zap,
    label: "Total Lambda Invocations",
    value: "1.2M",
    hint: "Last 30 days",
  },
];

/**
 * Production Metrics dashboard for the Cloud Waste Hunter detail
 * page. Mock values until the live data integration ships — the
 * pending badge is mandatory so auditing engineers don't read the
 * numbers as fake data masquerading as real metrics.
 *
 * Hydration-safe: the numbers are static strings, the motion runs
 * only on the client (useInView), and there's no Date.now() or
 * locale-dependent rendering.
 */
export default function ProductionMetrics() {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section
      ref={ref}
      className="mt-14 pt-10 border-t border-white/[0.08]"
    >
      <div className="flex items-center justify-between gap-3 mb-6 flex-wrap">
        <p className="text-xs font-medium text-white/30 tracking-widest uppercase">
          Production Metrics
        </p>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-400/25 bg-amber-400/[0.07] px-2.5 py-0.5 text-[10px] font-mono uppercase tracking-wider text-amber-200/90">
          <span className="w-1 h-1 rounded-full bg-amber-400" aria-hidden="true" />
          Live data integration pending
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {METRICS.map((metric, i) => {
          const Icon = metric.icon;
          return (
            <motion.div
              key={metric.label}
              initial={{ opacity: 0, y: 12 }}
              animate={
                isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 12 }
              }
              transition={{ duration: 0.6, delay: i * 0.1, ease: EASE }}
              className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-5"
            >
              <div className="flex items-center gap-2 mb-4">
                <Icon
                  className="w-3.5 h-3.5 text-secondary"
                  strokeWidth={1.75}
                  aria-hidden="true"
                />
                <p className="text-quiet text-[10px] uppercase tracking-widest font-medium">
                  {metric.label}
                </p>
              </div>
              <p className="text-primary text-3xl md:text-4xl font-semibold tracking-tight">
                {metric.value}
                {metric.suffix && (
                  <span className="text-secondary text-2xl ml-0.5">
                    {metric.suffix}
                  </span>
                )}
              </p>
              <p className="text-tertiary text-[11px] mt-2">{metric.hint}</p>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}
