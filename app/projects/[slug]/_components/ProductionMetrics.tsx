"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useInView } from "motion/react";
import type { LucideIcon } from "lucide-react";
import { DollarSign, Network, Zap } from "lucide-react";

const EASE = [0.22, 1, 0.36, 1] as const;

interface Metric {
  key: "total_savings_usd" | "active_scanners" | "lambda_invocations_30d";
  icon: LucideIcon;
  label: string;
  /** Formats the raw number for display. */
  format: (n: number) => { value: string; suffix?: string };
  hint: string;
}

/**
 * Three operational metrics, formatted to match what the page has
 * always shown ($42,500+, 14, 1.2M). Values now flow through
 * /api/cwh/live-metrics so a future swap from projection → real
 * production data lives in one place.
 */
const METRICS: readonly Metric[] = [
  {
    key: "total_savings_usd",
    icon: DollarSign,
    label: "Total Waste Identified",
    format: (n) => ({ value: `$${n.toLocaleString("en-US")}`, suffix: "+" }),
    hint: "Across all scanned AWS accounts",
  },
  {
    key: "active_scanners",
    icon: Network,
    label: "Active Cross-Account Scanners",
    format: (n) => ({ value: String(n) }),
    hint: "STS AssumeRole sessions",
  },
  {
    key: "lambda_invocations_30d",
    icon: Zap,
    label: "Total Lambda Invocations",
    /** 1,200,000 → "1.2M". 950,000 → "950K". Tiny values stay as-is. */
    format: (n) => {
      if (n >= 1_000_000) {
        return { value: `${(n / 1_000_000).toFixed(1).replace(/\.0$/, "")}M` };
      }
      if (n >= 1_000) {
        return { value: `${Math.round(n / 1_000)}K` };
      }
      return { value: String(n) };
    },
    hint: "Last 30 days",
  },
] as const;

/* Initial values match the endpoint's projection constants so SSR
   HTML matches the post-hydration content — no number flicker. */
const INITIAL: Record<Metric["key"], number> = {
  total_savings_usd: 42500,
  active_scanners: 14,
  lambda_invocations_30d: 1_200_000,
};

interface MetricsResponse {
  paying_customers: number;
  total_savings_usd: number;
  active_scanners: number;
  lambda_invocations_30d: number;
  projection: readonly string[];
}

/**
 * Production Metrics dashboard for the Cloud Waste Hunter project
 * detail page.
 *
 * Phase 3 / Sub-PR 3 update: values now flow through
 * /api/cwh/live-metrics. paying_customers from that endpoint feeds
 * the footer counter (separate component); the three operational
 * metrics shown here are still pre-launch projections, and the
 * section pill now says "Projection" instead of the previous
 * "Live data integration pending".
 *
 * Hydration posture: server renders the same INITIAL values the
 * endpoint reports as projections, so the SSR HTML matches the
 * first client paint exactly. Once useEffect resolves, state may
 * update if the endpoint ever returns different values.
 */
export default function ProductionMetrics() {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });
  const [values, setValues] = useState<Record<Metric["key"], number>>(INITIAL);
  const [isProjection, setIsProjection] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/cwh/live-metrics", {
          cache: "no-store",
        });
        if (!res.ok) return;
        const data = (await res.json()) as MetricsResponse;
        if (cancelled) return;
        setValues({
          total_savings_usd: data.total_savings_usd,
          active_scanners: data.active_scanners,
          lambda_invocations_30d: data.lambda_invocations_30d,
        });
        // If any of the three operational keys is NOT in
        // data.projection, the endpoint is reporting them as live.
        const stillProjection = METRICS.some((m) =>
          data.projection.includes(m.key),
        );
        setIsProjection(stillProjection);
      } catch {
        /* swallow — fall back to INITIAL values already on screen */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section
      ref={ref}
      className="mt-14 pt-10 border-t border-white/[0.08]"
    >
      <div className="flex items-center justify-between gap-3 mb-6 flex-wrap">
        <p className="text-xs font-medium text-white/30 tracking-widest uppercase">
          Production Metrics
        </p>
        {isProjection ? (
          <span
            className="inline-flex items-center gap-1.5 rounded-full border border-amber-400/25 bg-amber-400/[0.07] px-2.5 py-0.5 text-[10px] font-mono uppercase tracking-wider text-amber-200/90"
            title="Operational metrics shown are pre-launch projections, not live readings from a customer-bearing CWH deployment."
          >
            <span
              className="w-1 h-1 rounded-full bg-amber-400"
              aria-hidden="true"
            />
            Projection
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-[#00d2ff]/25 bg-[#00d2ff]/[0.06] px-2.5 py-0.5 text-[10px] font-mono uppercase tracking-wider text-[#00d2ff]/90">
            <span
              className="w-1 h-1 rounded-full bg-[#00d2ff]"
              aria-hidden="true"
            />
            Live
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {METRICS.map((metric, i) => {
          const Icon = metric.icon;
          const formatted = metric.format(values[metric.key]);
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
                {formatted.value}
                {formatted.suffix && (
                  <span className="text-secondary text-2xl ml-0.5">
                    {formatted.suffix}
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
