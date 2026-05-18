"use client";

import { useEffect } from "react";

/**
 * Per-experiment visit ping — V4 Phase 5 Sub-PR 5.4.
 *
 * Sibling to `components/telemetry/VisitPing.tsx`. The standard
 * VisitPing handles single-surface counters (`telemetry`,
 * `changelog`, `lumina-brain`, `playground` for the index).
 * Per-experiment visit counts need the slug as a parameter,
 * which doesn't fit the simple surface-to-key allow-list of
 * the standard pinger.
 *
 * Posture:
 *   - Render-once useEffect; fires a single POST per tab
 *     session per slug (session-storage guard).
 *   - keepalive: true so the request survives navigation away.
 *   - Failures swallow silently — playground telemetry is
 *     decorative.
 *   - Fires ONLY after the [slug]/page.tsx triple gate has
 *     passed (component only mounts when the page renders).
 */

interface ExperimentVisitPingProps {
  /** Experiment slug, as it appears in the registry. */
  slug: string;
}

const STORAGE_PREFIX = "v5:playground:visit:";

export default function ExperimentVisitPing({
  slug,
}: ExperimentVisitPingProps) {
  useEffect(() => {
    const storageKey = `${STORAGE_PREFIX}${slug}`;
    try {
      if (sessionStorage.getItem(storageKey) === "fired") return;
      sessionStorage.setItem(storageKey, "fired");
    } catch {
      /* sessionStorage blocked — fall through and just fire. The
       * cost is one extra count per page load in that edge case. */
    }
    void fetch("/api/playground/event", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "visit", slug }),
      keepalive: true,
    }).catch(() => {
      /* swallow — failing telemetry never blocks the page */
    });
  }, [slug]);

  return null;
}
