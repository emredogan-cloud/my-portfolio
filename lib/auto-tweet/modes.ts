/**
 * Auto-tweet 2.0 — mode taxonomy.
 *
 * V4 Phase 1 — Sub-PR 1.3.
 *
 * Each mode is a self-contained "format" — its own system prompt,
 * its own context-gathering, its own scheduling, its own dedupe
 * scope. The route dispatcher (app/api/auto-tweet/route.ts) reads
 * `?mode=<value>` and routes to the matching handler in
 * lib/auto-tweet/handlers/.
 *
 * Adding a fifth mode later is a four-file change: enum entry +
 * prompt file + handler file + dispatcher case.
 */

export const AUTOTWEET_MODES = {
  /** The Phase 1 baseline. Daily 06:00 UTC cron. ONE tweet per day
   *  summarising what shipped in the last 24 h. Behaviour preserved
   *  verbatim from the V3-era inline implementation. */
  DAILY_STANDUP: "daily_standup",
  /** Tuesday 05:00 UTC cron. One thread-style post (still single
   *  tweet for v1 — threads are Sub-PR 3.x territory) reflecting on
   *  the week's architectural decisions. */
  WEEKLY_ARCHITECTURE: "weekly_architecture",
  /** Sentry webhook → POST /api/auto-tweet?mode=incident_response.
   *  Drafts only — does not post immediately. Manual approval UI
   *  lands in Sub-PR 1.5 with the Sentry setup. Scaffolded here so
   *  the wire-up in 1.5 is one config line. */
  INCIDENT_RESPONSE: "incident_response",
  /** Weekly cron (not yet scheduled in v1 — the "best answer"
   *  signal needs telemetry that lands in 1.5). Text-only post per
   *  V4 § 6.1.B SUB-PR 1.3 step 5; video pipeline is Phase 3.6. */
  LUMINA_CLIP: "lumina_clip",
} as const;

export type AutotweetMode =
  (typeof AUTOTWEET_MODES)[keyof typeof AUTOTWEET_MODES];

const VALID_MODES: ReadonlySet<string> = new Set(
  Object.values(AUTOTWEET_MODES),
);

/**
 * Parse a `mode` query param into an `AutotweetMode`. Defaults to
 * `daily_standup` when missing, so the existing Vercel cron path
 * `/api/auto-tweet` (no query) keeps firing the daily standup
 * exactly the way it did before this sub-PR.
 *
 * Unknown values return `null` — the dispatcher 404's on that.
 */
export function parseMode(
  raw: string | null | undefined,
): AutotweetMode | null {
  if (raw === null || raw === undefined || raw === "") {
    return AUTOTWEET_MODES.DAILY_STANDUP;
  }
  if (VALID_MODES.has(raw)) return raw as AutotweetMode;
  return null;
}

/**
 * Telemetry slug for a given mode. Maps to the v4 metric schema
 * (V4 § 2.13) so each mode tracks its own success counter.
 *
 * For Sub-PR 1.3 v1 we increment the existing
 * `v4:adoption:autotweet:success:30d` cumulative counter from
 * Sub-PR 1.2 regardless of mode (so the /telemetry dashboard
 * keeps reporting a single "auto-tweet successes" tile). Per-mode
 * counters land in Sub-PR 1.5 when the telemetry surface grows
 * room for the breakdown — the slug here is documentation only
 * until then.
 */
export function modeMetricSlug(mode: AutotweetMode): string {
  return `v4:adoption:autotweet:${mode}:success:30d`;
}
