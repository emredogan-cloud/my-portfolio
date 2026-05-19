/**
 * V5 Phase 10 Sub-PR 10.1 — ambient intelligence feature flag.
 *
 * Mirrors the V5 dark-launch pattern established by every
 * prior phase flag:
 *
 *   - Phase 6.1 `V5_PERCEPTION_ENABLED`
 *   - Phase 8.1 `V5_TOPOLOGY_RENDER_ENABLED`
 *   - Phase 8.4 `V5_AURA_ENABLED`
 *   - Phase 8.5 `V5_CONTACT_ADAPTIVE_ENABLED`
 *   - Phase 9.1 `V5_OPERATING_TWIN_ENABLED`
 *   - Phase 9.3 `V5_JOURNAL_ENABLED`
 *
 * `V5_AMBIENT_ENABLED` is the master switch for the ambient
 * intelligence layer. Default OFF.
 *
 * Phase 10 KIRMIZI ÇİZGİ — this flag's behavior:
 *
 *   OFF (default)
 *     - `/api/v5/ambient/context` returns 404.
 *     - `/api/v5/ambient/event` silently 204s without writing.
 *     - `composeAmbientContext()` remains pure-callable
 *       (testing + future internal consumers). The composed
 *       context's `flag_enabled: false` declares the state
 *       honestly so any future caller can branch on it.
 *     - Telemetry hash receives no events; the helper is
 *       a guarded no-op.
 *
 *   ON
 *     - JSON context endpoint returns the composed snapshot.
 *     - Event endpoint accepts adoption pings.
 *     - Telemetry hash records aggregate event counts.
 *     - STILL no visible behavior, no adaptation, no
 *       recommendation surface — the flag enables the
 *       FOUNDATION's readability, not any consumer surface.
 *
 * Sub-PR 10.1 ships the flag declaration + gate helpers.
 * Future sub-PRs (10.2+) may optionally read it to gate
 * additional behavior; that's their scope, not 10.1's.
 *
 * Edge-safety: pure `process.env` read, no I/O.
 */

export const V5_AMBIENT_ENABLED_ENV = "V5_AMBIENT_ENABLED";

export function isAmbientEnabled(): boolean {
  return process.env[V5_AMBIENT_ENABLED_ENV] === "1";
}
