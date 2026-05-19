/**
 * V5 Phase 8 Sub-PR 8.4 — aura feature flag.
 *
 * Mirrors the Phase 6.1 (`V5_PERCEPTION_ENABLED`) + Phase 8.1
 * (`V5_TOPOLOGY_RENDER_ENABLED`) pattern: the operator
 * flips the env var to opt into the aura system. Default off.
 *
 * The flag exists in 8.4 even though no Provider mounts:
 *   - Future renderers / Provider mount points can gate on a
 *     single helper without re-defining the env-read pattern.
 *   - The flag name is documented + greppable from day one.
 *   - The reverse case (Provider ships before flag) can't
 *     happen — the contract is in place before any consumer.
 *
 * Phase 8 cognition note
 *   The flag gates the OBSERVABLE behaviour (the Provider
 *   setting CSS variables on document). It does NOT gate the
 *   schema / registry / modulation / helpers — those are pure
 *   data and always available to any in-tree caller.
 *
 * Edge-safety: pure read from `process.env`, no I/O.
 */

/** Env var the operator sets to activate the aura system.
 *  Acceptable value: literal "1". Anything else (including
 *  absence) is treated as off. */
export const V5_AURA_ENABLED_ENV = "V5_AURA_ENABLED";

/** Read the flag. True when the env var is exactly "1". */
export function isAuraEnabled(): boolean {
  return process.env[V5_AURA_ENABLED_ENV] === "1";
}
