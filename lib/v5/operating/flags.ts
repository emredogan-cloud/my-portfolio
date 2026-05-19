/**
 * V5 Phase 9 Sub-PR 9.1 — operational twin feature flag.
 *
 * Mirrors the rest of the V5 flag pattern:
 *   - Phase 6.1 `V5_PERCEPTION_ENABLED`
 *   - Phase 8.1 `V5_TOPOLOGY_RENDER_ENABLED`
 *   - Phase 8.4 `V5_AURA_ENABLED`
 *   - Phase 8.5 `V5_CONTACT_ADAPTIVE_ENABLED`
 *
 * `V5_OPERATING_TWIN_ENABLED` is the operator's switch for
 * the eventual `/v5/operating` route. Default OFF; the
 * future Phase 9.2+ surface gates on it.
 *
 * Phase 9.1 doesn't ship a public route, so nothing reads
 * this flag in 9.1. The flag is declared so the route
 * sub-PRs have a single helper.
 *
 * Edge-safety: pure read from `process.env`, no I/O.
 */

export const V5_OPERATING_TWIN_ENABLED_ENV = "V5_OPERATING_TWIN_ENABLED";

export function isOperatingTwinEnabled(): boolean {
  return process.env[V5_OPERATING_TWIN_ENABLED_ENV] === "1";
}
