/**
 * V5 Phase 8 Sub-PR 8.1 — topology feature-flag boundary.
 *
 * The user's Phase 8 brief includes:
 *
 *   > 8. Feature-flag boundaries
 *
 * The flag is the gate the Phase 8.2+ renderers will read
 * before mounting. Default state: OFF — the operator
 * explicitly flips the env var when a renderer is ready to
 * activate. This mirrors the `V5_PERCEPTION_ENABLED`
 * dark-launch pattern from Phase 6.1.
 *
 * The flag exists in 8.1 even though no renderer ships. The
 * surface area is declared NOW so:
 *   - Future renderers import a single helper rather than
 *     each defining their own env-read pattern.
 *   - The flag name is documented + greppable from day one.
 *   - The reverse case (renderer ships with the flag missing)
 *     can't happen — the contract is in place before any
 *     consumer.
 *
 * Phase 8 cognition note
 *   The flag is operator-side only. It does NOT gate the
 *   topology REGISTRY (the data + the JSON feed are always
 *   readable — the registry is public-archive content like
 *   the temporal registry). It gates the optional RENDERER
 *   mount only.
 *
 * Edge-safety: pure read from `process.env`, no I/O.
 */

/** Env var the operator sets to activate the topology
 *  renderer. Acceptable value: literal "1". Anything else
 *  (including absence) is treated as off. */
export const V5_TOPOLOGY_RENDER_ENABLED_ENV =
  "V5_TOPOLOGY_RENDER_ENABLED";

/** Read the flag. True when the env var is exactly "1".
 *  Safe to call from any runtime — edge, node, build-time.
 *  In the browser, `process.env` is replaced at build time
 *  with the inlined value (only for `NEXT_PUBLIC_*` vars by
 *  default, so this read returns `undefined` client-side
 *  unless explicitly inlined; the operator controls this).
 *  Future renderers should call this from the SERVER side
 *  and pass the boolean to client components as a prop. */
export function isTopologyRenderEnabled(): boolean {
  return process.env[V5_TOPOLOGY_RENDER_ENABLED_ENV] === "1";
}
