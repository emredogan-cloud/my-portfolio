import type { TopologyCapabilities } from "../capabilities";

/**
 * V5 Phase 8 Sub-PR 8.2 — topology renderer selector.
 *
 * Given a capability snapshot, decide which renderer kind the
 * future consumer should mount. Pure function; no I/O, no DOM,
 * no module-scope state. Safe to call from any runtime.
 *
 * Decision tree (the only branch logic the user's Phase 8
 * brief permits — no progressive enhancement gymnastics):
 *
 *   1. Reduced-motion preference set → "svg"
 *      The Three.js renderer's hover-scale + camera-orbit
 *      reactivity violate `prefers-reduced-motion: reduce`.
 *      SVG is static and the universal fallback.
 *
 *   2. Mobile viewport (< 768px) → "svg"
 *      The user's Phase 8 brief inherits V5 § 5.3 8.1's
 *      "Mobile reduced static 2D fallback" criterion. Three.js
 *      on mobile burns battery + interaction is awkward.
 *
 *   3. WebGPU available → "webgpu"
 *      The future WebGPU renderer (not implemented in 8.2) would
 *      consume this branch. For now, the selector returns the
 *      string identifier; the consumer translates it to the
 *      Three.js fallback when the WebGPU renderer isn't yet
 *      available.
 *
 *   4. Default → "three"
 *      The desktop, full-motion, no-WebGPU path. Most visitors
 *      land here.
 *
 * Phase 8 cognition note
 *   The selector knows about the four renderer KINDS but doesn't
 *   import the implementations. This keeps the selector tiny
 *   (a server-side bundle can include it without pulling
 *   three.js). The consumer pattern is:
 *
 *     const kind = selectTopologyRendererKind(capabilities);
 *     // Then dynamically import only the renderer the kind
 *     // points at — keeps every other renderer's chunk out of
 *     // the loaded bundle.
 *
 * Edge-safety: pure function. Zero dependencies beyond the
 * `TopologyCapabilities` type from `../capabilities`.
 */

export const TOPOLOGY_RENDERER_KINDS = [
  "svg",
  "three",
  "webgpu",
] as const;

export type TopologyRendererKind = (typeof TOPOLOGY_RENDERER_KINDS)[number];

/**
 * Select the renderer kind for the given capability snapshot.
 *
 * `webgpu` is included in the return space for forward
 * compatibility. Phase 8.2 itself ships no WebGPU implementation;
 * a consumer that gets `"webgpu"` should fall back to `"three"`
 * until the WebGPU renderer ships. The fallback logic lives in
 * the consumer (not here) because the selector is a pure
 * decision and the consumer owns the renderer dispatch.
 */
export function selectTopologyRendererKind(
  capabilities: TopologyCapabilities,
): TopologyRendererKind {
  if (capabilities.reducedMotion) return "svg";
  if (capabilities.mobile) return "svg";
  if (capabilities.webgpu) return "webgpu";
  return "three";
}

/**
 * The set of renderer kinds that have an actual implementation
 * shipped in 8.2. Consumers can use this to gracefully
 * downgrade — e.g. if the selector returns "webgpu" but the
 * caller can only dispatch implementations from this set, it
 * falls back to "three".
 */
export const SHIPPED_RENDERER_KINDS: ReadonlySet<TopologyRendererKind> =
  new Set(["svg", "three"]);

/**
 * Resolve a renderer kind against the set of shipped
 * implementations. If the selector returned `"webgpu"` but the
 * implementation hasn't shipped, this returns `"three"` (the
 * highest-fidelity available implementation). When `"three"`
 * is the input but somehow not shipped, returns `"svg"`.
 *
 * This is the LAST-MILE resolver consumers call before
 * dynamically importing the renderer module.
 */
export function resolveShippedRendererKind(
  kind: TopologyRendererKind,
): TopologyRendererKind {
  if (SHIPPED_RENDERER_KINDS.has(kind)) return kind;
  if (kind === "webgpu") return "three";
  return "svg";
}
