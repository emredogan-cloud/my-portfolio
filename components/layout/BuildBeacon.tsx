"use client";

import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "motion/react";

/**
 * Build Beacon — minimal footer indicator that turns cyan when Emre
 * has just pushed code.
 *
 * Lifecycle:
 *   1. Mount renders the "idle" skeleton — server and client paint
 *      the same HTML (no Date.now, no locale).
 *   2. useEffect fires a single fetch to /api/build-status, then
 *      re-polls every 60s. Status math (shipping/recent/resting/idle)
 *      already happened server-side; the client renders the string.
 *   3. The interval pauses while the tab is hidden — comes back when
 *      visibilitychange fires.
 *
 * Reduced-motion: useReducedMotion swaps the cyan pulse for a static
 * dot. The Phase 1 CSS guard collapses CSS animations to ~0ms but
 * motion/react drives the dot via RAF, so it needs an explicit gate.
 *
 * Visual posture: tiny font, monospaced uppercase, white/40 — sits
 * next to the footer signature without competing with the nav.
 */

type Status = "idle" | "shipping" | "recent" | "resting";

interface BuildStatusResponse {
  status: Status;
  commit: {
    at: string;
    repo: string;
    message: string;
    sha: string;
  } | null;
}

const LABEL: Record<Status, string> = {
  idle: "tracking…",
  shipping: "currently shipping",
  recent: "recently shipped",
  resting: "resting",
};

const DOT_TONE: Record<Status, string> = {
  idle: "bg-white/30",
  shipping: "bg-[#00d2ff]",
  recent: "bg-[#00d2ff]/80",
  resting: "bg-white/30",
};

const POLL_INTERVAL_MS = 60_000;

export default function BuildBeacon() {
  const [state, setState] = useState<BuildStatusResponse>({
    status: "idle",
    commit: null,
  });
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setInterval> | null = null;

    async function poll() {
      try {
        const res = await fetch("/api/build-status", { cache: "no-store" });
        if (!res.ok) return;
        const data = (await res.json()) as BuildStatusResponse;
        if (!cancelled) setState(data);
      } catch {
        /* network blip — keep the previous state */
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

  const showPulse = state.status === "shipping" && !prefersReducedMotion;
  const dotClass = `w-1.5 h-1.5 rounded-full ${DOT_TONE[state.status]}`;

  const repoLabel = state.commit
    ? `${state.commit.repo} · ${LABEL[state.status]}`
    : LABEL[state.status];

  return (
    <span
      className="inline-flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-[0.18em] text-tertiary"
      title={state.commit?.message}
      aria-label={`Build status: ${repoLabel}`}
    >
      {showPulse ? (
        <motion.span
          className={dotClass}
          animate={{ opacity: [1, 0.4, 1], scale: [1, 1.35, 1] }}
          transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
          aria-hidden="true"
        />
      ) : (
        <span className={dotClass} aria-hidden="true" />
      )}
      <span>{repoLabel}</span>
    </span>
  );
}
