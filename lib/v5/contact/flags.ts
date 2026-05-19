/**
 * V5 Phase 8 Sub-PR 8.5 — adaptive contact feature flag.
 *
 * Mirrors the rest of the V5 flag pattern:
 *   - Phase 6.1 `V5_PERCEPTION_ENABLED`
 *   - Phase 8.1 `V5_TOPOLOGY_RENDER_ENABLED`
 *   - Phase 8.4 `V5_AURA_ENABLED`
 *
 * `V5_CONTACT_ADAPTIVE_ENABLED` is the operator's switch for
 * the adaptive recruiter interface. Default OFF; the
 * operator flips the env var + redeploys when the layout
 * is ready to ship publicly.
 *
 * Phase 8.5 ships nothing that READS this flag — the
 * would-be Provider exists in the codebase but is not
 * mounted on /contact. The flag is declared so a future
 * mount sub-PR has a single helper to gate on.
 *
 * Edge-safety: pure read from `process.env`, no I/O.
 */

export const V5_CONTACT_ADAPTIVE_ENABLED_ENV =
  "V5_CONTACT_ADAPTIVE_ENABLED";

export function isContactAdaptiveEnabled(): boolean {
  return process.env[V5_CONTACT_ADAPTIVE_ENABLED_ENV] === "1";
}
