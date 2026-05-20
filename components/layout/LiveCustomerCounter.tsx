"use client";

import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "motion/react";

/**
 * LiveCustomerCounter — small footer pill that surfaces the number
 * of currently-paying Cloud Waste Hunter customers.
 *
 * Lifecycle:
 *   1. Mount renders nothing (no SSR pill — paying_customers is
 *      unknown until the client fetches the endpoint).
 *   2. useEffect fires /api/cwh/live-metrics, then re-polls every
 *      60s, paused while the tab is hidden.
 *   3. Renders only when paying_customers > 0 — until the first
 *      paying customer lands, this slot is empty. Spares us the
 *      "Currently helping 0 engineers" embarrassment.
 *
 * Reduced motion: useReducedMotion swaps the cyan pulse for a
 * static dot. Same posture as BuildBeacon.
 *
 * Visual: same tiny-mono-uppercase footer pill vocabulary as the
 * BuildBeacon next to it, so the footer reads as one rhythm.
 */

interface MetricsResponse {
  paying_customers: number;
}

const POLL_INTERVAL_MS = 60_000;

export default function LiveCustomerCounter() {
  const [count, setCount] = useState<number | null>(null);
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setInterval> | null = null;

    async function poll() {
      try {
        const res = await fetch("/api/cwh/live-metrics", { cache: "no-store" });
        if (!res.ok) return;
        const data = (await res.json()) as MetricsResponse;
        if (!cancelled) {
          setCount(
            typeof data.paying_customers === "number"
              ? data.paying_customers
              : 0,
          );
        }
      } catch {
        /* network blip — keep previous count */
      }
    }

    poll();
    timer = setInterval(() => {
      if (!document.hidden) poll();
    }, POLL_INTERVAL_MS);

    const onVisibility = () => {
      if (!document.hidden) poll();
    };
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      cancelled = true;
      if (timer) clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  // Render nothing until we have a confirmed positive count.
  if (count === null || count <= 0) return null;

  const dotClass = "w-1.5 h-1.5 rounded-full bg-[#00d2ff]";
  const label =
    count === 1
      ? "currently helping 1 cloud engineer"
      : `currently helping ${count} cloud engineers`;

  return (
    <span
      className="inline-flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-[0.18em] text-tertiary"
      aria-label={`CWH live customer count: ${label}`}
    >
      {prefersReducedMotion ? (
        <span className={dotClass} aria-hidden="true" />
      ) : (
        <motion.span
          className={dotClass}
          animate={{ opacity: [1, 0.4, 1], scale: [1, 1.35, 1] }}
          transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
          aria-hidden="true"
        />
      )}
      <span>{label}</span>
    </span>
  );
}
