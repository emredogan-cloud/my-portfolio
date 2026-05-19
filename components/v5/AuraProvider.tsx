"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

import { applyAuraToElement } from "@/lib/v5/aura/css";
import {
  composeAuraForPage,
  timeOfDayModulation,
} from "@/lib/v5/aura/modulation";
import { resolveAuraForPath } from "@/lib/v5/aura/registry";
import type { AuraAdoptionEvent } from "@/lib/v5/aura/telemetry";

/**
 * V5 Phase 8 Sub-PR 8.4 — engineering aura provider.
 *
 * Client component that computes the per-page aura (base from
 * the registry + time-of-day modulation), applies the result
 * as CSS custom properties on `document.documentElement`, and
 * fires aggregate adoption telemetry through
 * `/api/v5/aura/event`.
 *
 * NOT MOUNTED IN 8.4
 *   The component lives in the codebase but is intentionally
 *   NOT imported by `app/layout.tsx`. The user's Phase 8
 *   foundation discipline — same as 8.1's "no renderer" + 8.2's
 *   "no route mount" — keeps the aura system in storage until
 *   a future sub-PR earns the visible activation. Until that
 *   happens:
 *     - The CSS variables are not set on any document.
 *     - The adoption hash stays at zero.
 *     - The page bundle is unaffected (the Provider tree-
 *       shakes from every route).
 *
 * When this component IS eventually mounted
 *   - Mount in `app/layout.tsx` at the root: the Provider
 *     uses `usePathname()` so it recomputes on every route
 *     change without forcing a full re-render of the tree.
 *   - The Provider returns `null` — no rendered output, no
 *     DOM children. The only effect is the CSS variables set
 *     on `document.documentElement`.
 *
 * Telemetry firing rules
 *   - `mounted` fires once per session per pathname-prefix
 *     match (so a visitor who lands on `/architecture/cwh`
 *     contributes ONE `mounted` count for `/architecture`).
 *     sessionStorage-deduped.
 *   - `temperature_warm` fires when the composed temperature
 *     > 0.6 AND `mounted` would also fire (same session
 *     dedupe applies — each prefix gets at most one
 *     temperature-bucket event per session).
 *   - `temperature_cool` fires when the composed temperature
 *     < 0.4.
 *   - `time_modulation_applied` fires when the time-of-day
 *     modulation produced a non-zero delta (i.e., it's
 *     outside 12-18).
 *
 * All telemetry is fire-and-forget. The Provider never blocks
 * navigation or LCP.
 *
 * Hydration safety
 *   - Renders null on both server and client.
 *   - The useEffect runs after commit; CSS variables are set
 *     post-hydration. The visitor sees the page render with
 *     the EXISTING hard-coded ambient colors; the aura
 *     variables become available before any CSS rule could
 *     read them (since no rule reads them in 8.4).
 *
 * Reduced-motion + mobile
 *   - The aura system itself doesn't introduce motion. The
 *     CSS variables (specifically `--v5-aura-motion-multiplier`)
 *     are AVAILABLE for consumers to read; the Provider
 *     doesn't compose motion side-effects.
 *   - The aura computation is the same on mobile and desktop;
 *     no viewport gating.
 *
 * Phase 8 cognition note
 *   The Provider's responsibility is precisely scoped:
 *     compute aura → set CSS variables → fire telemetry.
 *   It does NOT modify any existing CSS rule. It does NOT
 *   modulate the existing pacing engine. Future consumers
 *   opt in to reading `var(--v5-aura-*)` in their styles;
 *   this Provider is the producer side of that contract.
 */

const AURA_EVENT_ENDPOINT = "/api/v5/aura/event";
const AURA_STORAGE_PREFIX = "v5:aura:fired:";

/* Each fire is session-deduped per (event, prefix) tuple.
 * Different pages contribute separate counts per session. */
function fireAuraEvent(
  kind: AuraAdoptionEvent,
  dedupeKey: string,
): void {
  if (typeof window === "undefined") return;
  const slot = `${AURA_STORAGE_PREFIX}${kind}:${dedupeKey}`;
  try {
    if (window.sessionStorage.getItem(slot) === "1") return;
    window.sessionStorage.setItem(slot, "1");
  } catch {
    /* sessionStorage blocked → fall through. */
  }
  void fetch(AURA_EVENT_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ kind }),
    keepalive: true,
  }).catch(() => {
    /* swallow — aura telemetry never blocks */
  });
}

/** True when the time-of-day modulation produced any
 *  non-zero delta. Mirrors the modulation function's
 *  branching exactly so we don't redo the time check. */
function timeOfDayProducedDelta(hour: number): boolean {
  const mod = timeOfDayModulation(hour);
  return (
    (typeof mod.temperature === "number" && mod.temperature !== 0) ||
    (typeof mod.intensity === "number" && mod.intensity !== 0) ||
    (typeof mod.pace === "number" && mod.pace !== 0) ||
    (typeof mod.clarity === "number" && mod.clarity !== 0)
  );
}

export default function AuraProvider() {
  const pathname = usePathname();
  /* Track the previous matched prefix so we don't re-fire
   * telemetry for the same prefix across multiple effect
   * runs (next/navigation can re-trigger usePathname during
   * route transitions). */
  const lastFiredPrefixRef = useRef<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (typeof pathname !== "string" || !pathname) return;

    /* Resolve the base aura + the matched prefix. */
    const resolution = resolveAuraForPath(pathname);
    const hour = new Date().getHours();
    const aura = composeAuraForPage({
      base: resolution.aura,
      hour,
      /* The Provider doesn't read the cognition signal in 8.4
       * — wiring lives in a future sub-PR where the Provider
       * subscribes to the Phase 6 cognition state. */
      cognition: null,
      /* Same for topology context. */
      topologyContext: null,
    });

    /* Apply CSS variables to the root element. */
    applyAuraToElement(aura);

    /* Fire telemetry once per session per matched prefix. */
    const dedupeKey = resolution.matchedPrefix || "(neutral)";
    if (lastFiredPrefixRef.current === dedupeKey) return;
    lastFiredPrefixRef.current = dedupeKey;

    fireAuraEvent("mounted", dedupeKey);

    if (aura.temperature > 0.6) {
      fireAuraEvent("temperature_warm", dedupeKey);
    } else if (aura.temperature < 0.4) {
      fireAuraEvent("temperature_cool", dedupeKey);
    }

    if (timeOfDayProducedDelta(hour)) {
      fireAuraEvent("time_modulation_applied", dedupeKey);
    }
  }, [pathname]);

  /* The Provider renders no DOM. It's a side-effect-only
   * client component. */
  return null;
}
