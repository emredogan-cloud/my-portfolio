/**
 * V5 Phase 8 Sub-PR 8.2 — topology renderer capability detection.
 *
 * The renderer foundation needs three signals to choose between
 * its implementations:
 *
 *   1. WebGPU support — `'gpu' in navigator`. Future-proofing
 *      for the WebGPU renderer that may ship in a later sub-PR;
 *      Phase 8.2 itself does NOT implement WebGPU rendering, but
 *      the detection path is wired so subsequent renderers can
 *      plug in.
 *   2. Reduced-motion preference — the operating-system-level
 *      `prefers-reduced-motion: reduce`. When set, the SVG
 *      fallback is the only legitimate renderer; the Three.js
 *      scene's animation loop would violate the user's
 *      accessibility preference.
 *   3. Mobile viewport — sub-768px screens get the SVG fallback
 *      regardless of GPU capability. The mobile fallback is the
 *      V5 § 5.3 8.1 validation criterion the user redirected
 *      forward; honored here.
 *
 * Phase 8 cognition note
 *   The capability layer is pure detection. It never decides
 *   WHICH renderer runs — that's the selector's job
 *   (`./renderers/select.ts`). Splitting detection from selection
 *   keeps each module's surface tight: detection answers "what
 *   does the environment offer?", selection answers "what should
 *   we mount given those offers?".
 *
 * SSR-safety
 *   Every check guards against `typeof window === "undefined"`
 *   or `typeof navigator === "undefined"` and returns the
 *   safest server-side default (false for capabilities, true
 *   for reduced-motion / mobile so the server renders the SVG
 *   path). The renderer SSR output is the SVG path; any
 *   client-side upgrade happens after hydration.
 */

/**
 * True when the browser exposes the WebGPU adapter API. This
 * is a CAPABILITY check, not a feature flag — even if the
 * browser supports WebGPU, the operator-side flag (Phase 8.1
 * `V5_TOPOLOGY_RENDER_ENABLED`) plus a separate WebGPU-specific
 * gate would govern whether the WebGPU implementation actually
 * mounts.
 *
 * Returns a Promise because some browsers expose
 * `navigator.gpu.requestAdapter()` as an async probe; even
 * though we don't call requestAdapter here, the Promise shape
 * gives downstream consumers (a future WebGPU renderer) one
 * import to await.
 *
 * SSR: returns false synchronously.
 */
export async function hasWebGPUSupport(): Promise<boolean> {
  if (typeof navigator === "undefined") return false;
  /* The cast is intentional — TypeScript's lib.dom.d.ts only
   * picked up `gpu` on Navigator in recent versions; the cast
   * keeps tsc green on older toolchains. */
  return Boolean((navigator as unknown as { gpu?: unknown }).gpu);
}

/**
 * True when the OS reduced-motion preference is set. Mirrors
 * the pattern Phase 7.3's TimelineSlider uses; the selector
 * reads this to choose the SVG renderer over the Three.js one.
 *
 * SSR: returns false synchronously (server-side reduced-motion
 * default would clash with the SSR HTML the SVG renderer
 * produces; the static SVG IS the reduced-motion path, so
 * defaulting to false at SSR + then re-checking at hydration
 * keeps the initial paint identical for every visitor).
 *
 * Note: when the selector reads this for renderer choice, it
 * runs CLIENT-SIDE after capability resolution. The server
 * renders the SVG regardless; reduced-motion just suppresses
 * the client-side upgrade to Three.js.
 */
export function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  if (typeof window.matchMedia !== "function") return false;
  try {
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  } catch {
    return false;
  }
}

/**
 * True when the viewport width is below the mobile breakpoint
 * (768px — matching Tailwind's `md:` threshold the rest of
 * the portfolio uses). The SVG renderer is the mobile fallback
 * per V5 § 5.3 8.1.
 *
 * SSR: returns false (the server cannot know the viewport
 * width; mobile detection upgrades after hydration if needed).
 */
export function isMobileViewport(): boolean {
  if (typeof window === "undefined") return false;
  return window.innerWidth < 768;
}

/**
 * Aggregate capability snapshot. The selector reads ONE call
 * to this rather than three; reduces the surface for tests
 * + lets future capabilities slot in without re-threading
 * the selector signature.
 *
 * Client-only by construction — the WebGPU probe is async.
 * Server-side, every field is the safe default.
 */
export interface TopologyCapabilities {
  webgpu: boolean;
  reducedMotion: boolean;
  mobile: boolean;
}

export async function detectTopologyCapabilities(): Promise<TopologyCapabilities> {
  if (typeof window === "undefined") {
    return { webgpu: false, reducedMotion: false, mobile: false };
  }
  const webgpu = await hasWebGPUSupport();
  return {
    webgpu,
    reducedMotion: prefersReducedMotion(),
    mobile: isMobileViewport(),
  };
}

/**
 * Synchronous snapshot used for SSR-safe initial paint
 * decisions. Caller treats `webgpu` as false (we can't probe
 * synchronously); the async path upgrades after capability
 * resolution.
 */
export function getSyncTopologyCapabilities(): TopologyCapabilities {
  return {
    webgpu: false,
    reducedMotion: prefersReducedMotion(),
    mobile: isMobileViewport(),
  };
}
