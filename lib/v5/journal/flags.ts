/**
 * V5 Phase 9 Sub-PR 9.3 — living engineering journal flag.
 *
 * Mirrors the rest of the V5 flag pattern. Default OFF —
 * the public `/v5/journal` pages return 404 + the cron's
 * write path no-ops until the operator sets the env var.
 *
 * Edge-safety: pure read from `process.env`, no I/O.
 */

export const V5_JOURNAL_ENABLED_ENV = "V5_JOURNAL_ENABLED";

export function isJournalEnabled(): boolean {
  return process.env[V5_JOURNAL_ENABLED_ENV] === "1";
}
