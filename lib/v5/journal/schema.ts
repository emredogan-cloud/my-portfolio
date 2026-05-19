import type { ChangelogCommit, FailureEntry } from "@/lib/v5/operating/schema";

/**
 * V5 Phase 9 Sub-PR 9.3 — living engineering journal schema.
 *
 * The journal is the weekly artifact the operational-twin
 * cron generates from each week's `OperationalSnapshot`. V5
 * § 4.4 names it:
 *
 *   > Living engineering journal: auto-generated weekly digest
 *
 * Each entry is FROZEN at generation time. Subsequent reads
 * (via `/v5/journal/<week>`) render the snapshot as it was
 * when the cron fired — not the current state. The archive
 * is the operator's running log of "what this week was".
 *
 * Anti-Generic-AI Law (V5 § 2.4)
 *   The `narrative` field is TEMPLATED, not LLM-generated.
 *   The generator composes plain-language prose from the
 *   week's data points using deterministic string assembly.
 *   No Claude / Bedrock / Anthropic / OpenAI call enters
 *   the journal's path.
 *
 * Week identification
 *   `week_id` uses ISO 8601 week-date format: `YYYY-Www`
 *   (e.g., `2026-W20`). The parser handles ISO weeks
 *   correctly — including weeks 53 + the cross-year case.
 *
 * Privacy posture
 *   The journal is the OPERATOR'S log — public commits,
 *   public failures, hand-curated plans. Zero visitor-
 *   identifying signal. The narrative is operator voice,
 *   not visitor profile.
 *
 * Edge-safety: pure data + pure functions, no I/O, no DOM.
 */

/**
 * One journal entry. Frozen at cron-generation time. Reads
 * are pure projections of stored JSON; nothing recomputes.
 */
export interface JournalEntry {
  /** ISO 8601 week id: `YYYY-Www` (`2026-W20`). */
  week_id: string;
  /** ISO timestamp the cron generated this entry. */
  generated_at: string;
  /** ISO date of the week's Monday (the canonical start). */
  week_start: string;
  /** ISO date of the week's Sunday (the canonical end). */
  week_end: string;

  /** Frozen weekly-commits summary. Mirrors the
   *  `WeeklyCommitsSummary` shape from the operational
   *  schema, with one addition: the generator selects a
   *  subset of "top" commits for the digest (5 entries,
   *  prioritised by `why`-paragraph presence + length). */
  weekly_summary: {
    total_commits: number;
    repos_touched: number;
    by_type: Readonly<Record<string, number>>;
    latest_commit_at: string | null;
    oldest_commit_at: string | null;
    top_commits: readonly ChangelogCommit[];
  };

  /** Snapshot of infrastructure status at generation time.
   *  Counts only; the operator can re-read the operational
   *  page for live status. */
  infra_status_summary: {
    active: number;
    dormant: number;
    archived: number;
  };

  /** Names of experiments that were "active" at generation
   *  time. Operator-side glance; the operational page lists
   *  the full set. */
  experiments_active: readonly string[];

  /** Count of planned items in each status at generation
   *  time. */
  planned_state: {
    in_progress: number;
    next_up: number;
    considering: number;
    draft: number;
  };

  /** Failure entries whose `date` falls within the week.
   *  Most weeks: empty array. */
  recent_failures_added: readonly FailureEntry[];

  /** Templated, deterministic prose. ~2-4 sentences.
   *  Generated from the data above using string assembly,
   *  NOT LLM. */
  narrative: string;
}

/* ── ISO-week helpers ─────────────────────────────────── */

/**
 * Get the ISO 8601 week id (`YYYY-Www`) for the given date.
 * ISO week semantics:
 *   - Weeks are Monday-start.
 *   - Week 1 of any year contains the year's first Thursday.
 *   - The last days of December may belong to week 1 of the
 *     next year; the first days of January may belong to
 *     week 52 or 53 of the previous year.
 *
 * Implementation follows the standard "Thursday-of-week"
 * algorithm: shift the date to the Thursday of its week,
 * then find that Thursday's calendar year + the week count
 * from the first Thursday of that year.
 *
 * Pure function; deterministic; safe to call from any
 * runtime.
 */
export function formatIsoWeek(date: Date): string {
  const utc = new Date(
    Date.UTC(
      date.getUTCFullYear(),
      date.getUTCMonth(),
      date.getUTCDate(),
    ),
  );
  /* Day number: 1 = Monday, 7 = Sunday (ISO). */
  const dayNum = utc.getUTCDay() === 0 ? 7 : utc.getUTCDay();
  /* Shift to the Thursday of this week. */
  utc.setUTCDate(utc.getUTCDate() + 4 - dayNum);
  /* The week's year is the calendar year of that Thursday. */
  const isoYear = utc.getUTCFullYear();
  /* Week number = number of weeks since the Thursday of
   * Jan 1st of isoYear. */
  const jan1 = new Date(Date.UTC(isoYear, 0, 1));
  const week = Math.ceil(
    ((utc.getTime() - jan1.getTime()) / 86_400_000 + 1) / 7,
  );
  return `${isoYear}-W${String(week).padStart(2, "0")}`;
}

/**
 * The ISO-week id for `now` (defaults to current UTC time).
 * Convenience wrapper around `formatIsoWeek`.
 */
export function currentIsoWeek(now: number = Date.now()): string {
  return formatIsoWeek(new Date(now));
}

/**
 * Get the calendar Monday + Sunday for the given ISO-week
 * id. Returns null on malformed input. The dates are ISO
 * 8601 `YYYY-MM-DD` strings (UTC).
 *
 *   weekIdToBounds("2026-W20") → { start: "2026-05-11",
 *                                   end:   "2026-05-17" }
 */
export function weekIdToBounds(
  weekId: string,
): { start: string; end: string } | null {
  const match = /^(\d{4})-W(\d{2})$/.exec(weekId);
  if (!match) return null;
  const year = Number(match[1]);
  const week = Number(match[2]);
  if (
    !Number.isFinite(year) ||
    !Number.isFinite(week) ||
    week < 1 ||
    week > 53
  ) {
    return null;
  }
  /* Find the Monday of week 1: the Monday on or before
   * Jan 4 (the date that is always in week 1 per ISO). */
  const jan4 = new Date(Date.UTC(year, 0, 4));
  const jan4Day = jan4.getUTCDay() === 0 ? 7 : jan4.getUTCDay();
  const week1Monday = new Date(jan4);
  week1Monday.setUTCDate(jan4.getUTCDate() - (jan4Day - 1));

  /* Target week's Monday = week 1 Monday + 7 × (week - 1)
   * days. */
  const start = new Date(week1Monday);
  start.setUTCDate(week1Monday.getUTCDate() + 7 * (week - 1));
  const end = new Date(start);
  end.setUTCDate(start.getUTCDate() + 6);

  return {
    start: start.toISOString().slice(0, 10),
    end: end.toISOString().slice(0, 10),
  };
}

/**
 * True when `value` is a syntactically-valid ISO-week id.
 * Used by the per-week route + the JSON feed to validate
 * inbound week ids before reading KV. */
const WEEK_ID_PATTERN = /^\d{4}-W\d{2}$/;

export function isValidWeekId(value: unknown): value is string {
  if (typeof value !== "string") return false;
  return WEEK_ID_PATTERN.test(value) && weekIdToBounds(value) !== null;
}

/**
 * Compare two week ids chronologically. Returns negative
 * when `a` is earlier, positive when later, 0 when equal.
 * Pure; deterministic.
 *
 * Used by the index page to sort journal entries newest-
 * first.
 */
export function compareWeekIds(a: string, b: string): number {
  if (a === b) return 0;
  return a < b ? -1 : 1;
}
