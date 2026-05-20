/* ──────────────────────────────────────────────────────────────
 *  V6 Sub-PR 11.5 — Margin Tick System (second motif).
 *
 *  Tiny flag helper that gates the deployment of `.margin-tick` /
 *  `.margin-tick-right` (declared in globals.css). Default OFF —
 *  rollback means the CSS class is never rendered and the V5 layout
 *  carries on with the existing left-border / hairline-rule decor.
 *
 *  Read server-side. The /about page (the single Phase 11
 *  demonstrator) is a Server Component, so the env flag stays
 *  non-public per V5 dark-launch convention. Future Phase 12+
 *  deployments on hero pages or codex detail surfaces should
 *  reuse this helper; if a future consumer is a Client Component
 *  the flag will need to promote to `NEXT_PUBLIC_V6_MARGIN_TICK`
 *  (see the analogous note in lib/v6/glass.ts).
 *
 *  Spec rollback matrix: V6 § 8 names the flag `V6_MARGIN_TICK`.
 *
 *  Audit ref: PORTFOLYO_V6_UI_AUDIT.md § 1.6.
 *  Spec ref:  PORTFOLYO_V6_UI_EXECUTION_SYSTEM.md § Sub-PR 11.5.
 * ────────────────────────────────────────────────────────────── */

export function isMarginTickEnabled(): boolean {
  return process.env.V6_MARGIN_TICK === "1";
}
