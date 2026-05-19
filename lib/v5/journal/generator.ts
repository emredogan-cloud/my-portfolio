import type { OperationalSnapshot } from "@/lib/v5/operating/schema";
import type { ChangelogCommit, FailureEntry } from "@/lib/v5/operating/schema";

import {
  currentIsoWeek,
  weekIdToBounds,
  type JournalEntry,
} from "./schema";

/**
 * V5 Phase 9 Sub-PR 9.3 — journal entry generator.
 *
 * Pure function that converts an `OperationalSnapshot` into
 * a `JournalEntry` suitable for KV persistence.
 *
 * Two responsibilities:
 *   1. PROJECTION — copy the relevant fields from the
 *      snapshot into the entry's frozen shape. The operational
 *      page renders LIVE counts; the journal entry renders
 *      FROZEN counts from when the cron fired.
 *   2. TEMPLATED NARRATIVE — compose ~2-4 sentences of plain
 *      operator prose from the data. Deterministic string
 *      assembly; no LLM call.
 *
 * Anti-Generic-AI Law (V5 § 2.4) enforcement
 *   The narrative function is GREP-AUDITABLE. Every output
 *   sentence is built from a fixed template + the week's
 *   counts. The same snapshot input always produces the same
 *   narrative output. No external dependencies beyond pure
 *   arithmetic.
 *
 * Editorial voice
 *   The narrative reads as the operator's honest report —
 *   not marketing, not analytics. Examples:
 *
 *     "Week 2026-W20: 14 commits across 3 repos. Phase 8
 *      closed; observation window opened. 8 systems active.
 *      No corrections recorded this week."
 *
 *     "Week 2026-W21: 0 commits — observation week. 8 systems
 *      remain active. 5 planned items unchanged."
 *
 *   Plain, declarative, weekly notebook tone.
 *
 * Edge-safety: pure data + pure functions. No I/O, no DOM,
 * no clock reads (the caller passes `now`).
 */

/** How many "top commits" the digest carries. The journal
 *  page renders this subset; the full week's commit list
 *  lives in /changelog. */
const TOP_COMMITS_LIMIT = 5;

/**
 * Select the most-substantive commits from the week. The
 * heuristic:
 *   1. Prefer commits with a `why` paragraph (they carry
 *      the operator's reasoning).
 *   2. Within the with-`why` set, sort by `why` length DESC
 *      (longer reasoning typically means a more substantive
 *      change).
 *   3. Tie-break on commit timestamp DESC (newer wins).
 *   4. Fill remaining slots from commits without a `why`,
 *      newest first.
 *
 * Returns at most `TOP_COMMITS_LIMIT` entries.
 *
 * Pure function; deterministic.
 */
function selectTopCommits(
  commits: readonly ChangelogCommit[],
): readonly ChangelogCommit[] {
  if (commits.length <= TOP_COMMITS_LIMIT) return commits;
  const withWhy = commits.filter((c) => c.why && c.why.length > 0);
  const withoutWhy = commits.filter((c) => !c.why);

  withWhy.sort((a, b) => {
    const la = a.why?.length ?? 0;
    const lb = b.why?.length ?? 0;
    if (lb !== la) return lb - la;
    return (
      Date.parse(b.timestamp || "") - Date.parse(a.timestamp || "")
    );
  });
  withoutWhy.sort(
    (a, b) =>
      Date.parse(b.timestamp || "") - Date.parse(a.timestamp || ""),
  );

  const out = [...withWhy];
  for (const c of withoutWhy) {
    if (out.length >= TOP_COMMITS_LIMIT) break;
    out.push(c);
  }
  return out.slice(0, TOP_COMMITS_LIMIT);
}

/**
 * Compute the failure entries whose `date` falls within the
 * given week. Used by the generator to slice the public
 * failures log into the per-week journal entry. */
function selectFailuresInWeek(
  allFailures: readonly FailureEntry[],
  weekStartIso: string,
  weekEndIso: string,
): readonly FailureEntry[] {
  return allFailures.filter((f) => {
    if (typeof f.date !== "string") return false;
    return f.date >= weekStartIso && f.date <= weekEndIso;
  });
}

/**
 * Compose the templated narrative. Plain string assembly;
 * no LLM call. The function is grep-auditable: every
 * possible output sentence is visible in this file.
 */
function composeNarrative(
  weekId: string,
  weekStart: string,
  weeklySummary: JournalEntry["weekly_summary"],
  infraSummary: JournalEntry["infra_status_summary"],
  experimentsActive: readonly string[],
  plannedState: JournalEntry["planned_state"],
  failuresInWeek: readonly FailureEntry[],
): string {
  const parts: string[] = [];

  /* Sentence 1 — the week's commit shape. */
  if (weeklySummary.total_commits === 0) {
    parts.push(`Week ${weekId} (starting ${weekStart}): no commits.`);
  } else if (weeklySummary.total_commits === 1) {
    parts.push(
      `Week ${weekId} (starting ${weekStart}): 1 commit, ${weeklySummary.repos_touched} repo${weeklySummary.repos_touched === 1 ? "" : "s"} touched.`,
    );
  } else {
    parts.push(
      `Week ${weekId} (starting ${weekStart}): ${weeklySummary.total_commits} commits, ${weeklySummary.repos_touched} repo${weeklySummary.repos_touched === 1 ? "" : "s"} touched.`,
    );
  }

  /* Sentence 2 — commit type distribution. Skip when only
   * 1 type appears (uninformative). */
  const typeEntries = Object.entries(weeklySummary.by_type)
    .filter(([, count]) => count > 0)
    .sort((a, b) => b[1] - a[1]);
  if (typeEntries.length >= 2) {
    const top2 = typeEntries
      .slice(0, 2)
      .map(([t, c]) => `${c} ${t}`)
      .join(", ");
    parts.push(`Mostly ${top2}.`);
  }

  /* Sentence 3 — infrastructure status. */
  const totalInfra =
    infraSummary.active + infraSummary.dormant + infraSummary.archived;
  if (totalInfra > 0) {
    parts.push(
      `${infraSummary.active} of ${totalInfra} tracked systems active.`,
    );
  }

  /* Sentence 4 — experiments + plans. Combine to avoid
   * stacking too many short sentences. */
  const planTotal =
    plannedState.in_progress +
    plannedState.next_up +
    plannedState.considering +
    plannedState.draft;
  if (experimentsActive.length > 0 || planTotal > 0) {
    const experimentClause =
      experimentsActive.length > 0
        ? `${experimentsActive.length} experiment${experimentsActive.length === 1 ? "" : "s"} running`
        : null;
    const planClause =
      planTotal > 0
        ? `${plannedState.in_progress} in-progress, ${plannedState.next_up} next-up, ${plannedState.considering} considering`
        : null;
    const fragments = [experimentClause, planClause].filter(
      (f): f is string => f !== null,
    );
    parts.push(`${fragments.join("; ")}.`);
  }

  /* Sentence 5 — failures. Honest reporting. */
  if (failuresInWeek.length === 0) {
    parts.push("No corrections recorded this week.");
  } else if (failuresInWeek.length === 1) {
    parts.push(
      `One correction recorded: ${failuresInWeek[0].title}.`,
    );
  } else {
    parts.push(
      `${failuresInWeek.length} corrections recorded this week.`,
    );
  }

  return parts.join(" ");
}

/**
 * Build a complete journal entry from an operational
 * snapshot. The caller passes `now` for testability +
 * determinism; the generator uses it to compute the
 * week id + the week bounds.
 *
 * Returns null when:
 *   - `now` doesn't resolve to a valid week id (impossible
 *     in practice; defensive).
 */
export function buildJournalEntry(
  snapshot: OperationalSnapshot,
  now: number = Date.now(),
): JournalEntry | null {
  const weekId = currentIsoWeek(now);
  const bounds = weekIdToBounds(weekId);
  if (!bounds) return null;

  const topCommits = selectTopCommits(snapshot.weekly_commits.commits);
  const experimentsActive = snapshot.running_experiments.entries
    .filter((e) => e.status === "active")
    .map((e) => e.label);
  const failuresInWeek = selectFailuresInWeek(
    snapshot.recent_failures.entries,
    bounds.start,
    bounds.end,
  );

  const weeklySummary: JournalEntry["weekly_summary"] = {
    total_commits: snapshot.weekly_commits.total_commits,
    repos_touched: snapshot.weekly_commits.repos_touched,
    by_type: snapshot.weekly_commits.by_type,
    latest_commit_at: snapshot.weekly_commits.latest_commit_at,
    oldest_commit_at: snapshot.weekly_commits.oldest_commit_at,
    top_commits: topCommits,
  };

  const infraSummary: JournalEntry["infra_status_summary"] = {
    active: snapshot.active_infrastructure.by_status.active,
    dormant: snapshot.active_infrastructure.by_status.dormant,
    archived: snapshot.active_infrastructure.by_status.archived,
  };

  const plannedState: JournalEntry["planned_state"] = {
    in_progress: snapshot.planned_next.by_status["in-progress"],
    next_up: snapshot.planned_next.by_status["next-up"],
    considering: snapshot.planned_next.by_status.considering,
    draft: snapshot.planned_next.by_status.draft,
  };

  const narrative = composeNarrative(
    weekId,
    bounds.start,
    weeklySummary,
    infraSummary,
    experimentsActive,
    plannedState,
    failuresInWeek,
  );

  return {
    week_id: weekId,
    generated_at: new Date(now).toISOString(),
    week_start: bounds.start,
    week_end: bounds.end,
    weekly_summary: weeklySummary,
    infra_status_summary: infraSummary,
    experiments_active: experimentsActive,
    planned_state: plannedState,
    recent_failures_added: failuresInWeek,
    narrative,
  };
}
