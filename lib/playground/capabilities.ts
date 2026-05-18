"use client";

import { useEffect, useState } from "react";

/**
 * Playground capability detection — V4 Phase 5 Sub-PR 5.2.
 *
 * Each experiment may declare requirements (minimum viewport
 * width, WebGPU, motion). The Mount component below uses this
 * module to decide whether the visitor's environment satisfies
 * those requirements before lazy-loading the experiment body.
 *
 * Hydration safety:
 *   - Default values mirror the SAFEST common environment (desktop
 *     viewport, no WebGPU assumed, motion allowed). Server-side
 *     rendering returns these defaults.
 *   - Client-side useEffect refreshes the values from real
 *     `window` / `navigator` / `matchMedia` after mount. The
 *     visitor briefly sees the "default" view before the effect
 *     fires; this is acceptable because the Mount component
 *     shows a "Checking environment…" placeholder until the
 *     first refresh completes.
 *   - Probes never throw. A blocked API or missing global
 *     resolves to the default rather than crashing.
 */

export interface Capabilities {
  /** Current visual viewport width in CSS pixels. Defaults to a
   *  desktop-shaped 1024 server-side. */
  viewportWidth: number;
  /** True when the browser's `prefers-reduced-motion` media
   *  query matches `reduce`. */
  prefersReducedMotion: boolean;
  /** True when `navigator.gpu` is present (WebGPU is available).
   *  Doesn't probe device-level support; just feature detection. */
  hasWebGPU: boolean;
  /** True once the client-side refresh has run. Server renders
   *  with `false`; the Mount component uses this to know whether
   *  defaults are safe to act on. */
  ready: boolean;
}

const SERVER_DEFAULTS: Capabilities = {
  viewportWidth: 1024,
  prefersReducedMotion: false,
  hasWebGPU: false,
  ready: false,
};

/** Read the current capability snapshot from the browser. Always
 *  returns SERVER_DEFAULTS on SSR. Never throws. */
function readCapabilities(): Capabilities {
  if (typeof window === "undefined") return SERVER_DEFAULTS;

  let viewportWidth = SERVER_DEFAULTS.viewportWidth;
  try {
    viewportWidth = window.innerWidth || SERVER_DEFAULTS.viewportWidth;
  } catch {
    /* sandboxed iframe — fall through */
  }

  let prefersReducedMotion = false;
  try {
    prefersReducedMotion =
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  } catch {
    /* matchMedia blocked — assume motion OK */
  }

  let hasWebGPU = false;
  try {
    hasWebGPU =
      typeof navigator !== "undefined" &&
      "gpu" in navigator &&
      navigator.gpu !== undefined &&
      navigator.gpu !== null;
  } catch {
    /* sealed object — assume no WebGPU */
  }

  return {
    viewportWidth,
    prefersReducedMotion,
    hasWebGPU,
    ready: true,
  };
}

/**
 * Subscribe to capability changes for the lifetime of the
 * component. Refreshes on mount and whenever the viewport
 * resizes or the reduced-motion media query toggles.
 *
 * Returns `SERVER_DEFAULTS` until the first client effect fires.
 * Consumers should branch on `capabilities.ready` rather than
 * acting on capability values directly during the first render.
 */
export function useCapabilities(): Capabilities {
  const [caps, setCaps] = useState<Capabilities>(SERVER_DEFAULTS);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCaps(readCapabilities());

    if (typeof window === "undefined") return;

    const onResize = () => setCaps((prev) => ({
      ...prev,
      viewportWidth: window.innerWidth || prev.viewportWidth,
    }));
    let motionQuery: MediaQueryList | null = null;
    let motionHandler: ((e: MediaQueryListEvent) => void) | null = null;
    try {
      motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
      motionHandler = (e) =>
        setCaps((prev) => ({ ...prev, prefersReducedMotion: e.matches }));
      motionQuery.addEventListener("change", motionHandler);
    } catch {
      /* matchMedia unsupported / blocked — skip subscription */
    }
    window.addEventListener("resize", onResize, { passive: true });

    return () => {
      window.removeEventListener("resize", onResize);
      if (motionQuery && motionHandler) {
        try {
          motionQuery.removeEventListener("change", motionHandler);
        } catch {
          /* ignore */
        }
      }
    };
  }, []);

  return caps;
}

/* ── Requirement checking ─────────────────────────────────── */

export interface ExperimentRequirements {
  /** Minimum viewport width in CSS pixels. Set for desktop-only
   *  experiments. Visitors on smaller viewports see the fallback. */
  minViewportWidth?: number;
  /** True when the experiment cannot meaningfully run without
   *  motion (e.g. an animated topology). Visitors with
   *  `prefers-reduced-motion: reduce` see the fallback. */
  requiresMotion?: boolean;
  /** True when the experiment uses WebGPU. Visitors without
   *  navigator.gpu see the fallback. */
  requiresWebGPU?: boolean;
}

export interface RequirementMiss {
  requirement: string;
  detail: string;
}

/** Compute the list of unmet requirements given the visitor's
 *  capability snapshot. Returns an empty array when everything
 *  is satisfied OR when no requirements are declared. */
export function checkRequirements(
  requirements: ExperimentRequirements | undefined,
  caps: Capabilities,
): RequirementMiss[] {
  if (!requirements) return [];
  const misses: RequirementMiss[] = [];

  if (
    typeof requirements.minViewportWidth === "number" &&
    caps.viewportWidth < requirements.minViewportWidth
  ) {
    misses.push({
      requirement: "viewport",
      detail: `requires ≥ ${requirements.minViewportWidth}px viewport (currently ${caps.viewportWidth}px)`,
    });
  }

  if (requirements.requiresMotion && caps.prefersReducedMotion) {
    misses.push({
      requirement: "motion",
      detail: "experiment requires motion; reduced-motion preference is active",
    });
  }

  if (requirements.requiresWebGPU && !caps.hasWebGPU) {
    misses.push({
      requirement: "webgpu",
      detail: "experiment requires WebGPU (navigator.gpu)",
    });
  }

  return misses;
}
