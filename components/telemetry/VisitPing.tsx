"use client";

import { useEffect } from "react";

/**
 * Render-once visit ping for /telemetry and /changelog.
 *
 * V4 Phase 1 — Sub-PR 1.5. Lands the visit-telemetry path deferred
 * from Sub-PR 1.2 + 1.4 reports.
 *
 * Posture:
 *   - The smallest possible client island. No state, no JSX, no
 *     dependencies beyond React's useEffect — first-load bundle
 *     impact measured in hundreds of bytes.
 *   - POSTs once to `/api/telemetry/visit` with `{ surface }`, then
 *     unmounts back into nothing. The fetch failure mode is swallowed
 *     — a missing counter is acceptable; a broken page is not.
 *   - Includes `keepalive: true` so the request survives the visitor
 *     navigating away mid-fetch.
 *
 * Why a session-scoped guard (sessionStorage):
 *   The page is ISR-cached for 5-30 min; without a guard, every tab
 *   reload re-fires the ping. The session-storage flag scopes one
 *   ping per tab session — closer to "unique visit" semantics than
 *   raw page-render counts.
 */

interface VisitPingProps {
  /** Slug routed to the visit endpoint's surface-allow-list.
   *  Keep this union in lockstep with `SURFACE_TO_KEY` over in
   *  `app/api/telemetry/visit/route.ts`. */
  surface:
    | "telemetry"
    | "changelog"
    | "lumina-brain"
    | "lumina-failures"
    | "playground"
    | "v5-perception"
    | "evolution"
    | "topology"
    | "operating"
    | "journal"
    | "ambient";
}

const STORAGE_PREFIX = "v4:telemetry:ping:";

export default function VisitPing({ surface }: VisitPingProps) {
  useEffect(() => {
    const key = `${STORAGE_PREFIX}${surface}`;
    try {
      if (sessionStorage.getItem(key) === "fired") return;
      sessionStorage.setItem(key, "fired");
    } catch {
      /* sessionStorage blocked (Safari private mode, locked-down
       * profiles) — fall through and just fire the ping; the cost
       * is one extra count per page load in that edge case. */
    }
    /* `keepalive: true` lets the browser complete the request even
     * if the user immediately navigates away. */
    void fetch("/api/telemetry/visit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ surface }),
      keepalive: true,
      /* No `cache: "no-store"` needed — POSTs aren't cached. */
    }).catch(() => {
      /* swallow — failing telemetry never blocks the page */
    });
  }, [surface]);

  return null;
}
