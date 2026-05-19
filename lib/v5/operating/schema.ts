import type { ChangelogCommit } from "@/lib/github-events";
import type { FailureEntry } from "@/data/lumina-failures";
import type { PlaygroundExperiment } from "@/lib/playground/registry";

/**
 * V5 Phase 9 Sub-PR 9.1 — operational twin schema.
 *
 * Phase 9 ships an "operational digital twin" of the
 * engineering life happening underneath the portfolio.
 * V5 future § 3.1 frames it explicitly:
 *
 *   > Bu sayfa "dashboard" değil. **Portrait**. Visitor
 *   > okuduğunda "bu hafta neler oldu" değil; **"bu kişi
 *   > ne yapıyor"** hissini alır.
 *
 * Five distinct surfaces compose the snapshot:
 *
 *   1. weekly_commits        — last 7 days of pushed commits +
 *                              their WHY paragraphs.
 *   2. active_infrastructure — production systems currently
 *                              live (Lumina chat, the lab
 *                              experiments, the V5 V5 surfaces)
 *                              with last-seen timestamps.
 *   3. running_experiments   — Phase 5 playground experiments
 *                              + Phase 4 lab experiments that
 *                              are currently enabled.
 *   4. planned_next          — the public roadmap card — what
 *                              the operator declared they're
 *                              working on next. Hand-curated;
 *                              honest editorial.
 *   5. recent_failures       — last few entries from the public
 *                              /lumina/failures corrections log.
 *
 * What this module IS
 *   - The typed contract Phase 9.2-9.4 surfaces consume.
 *   - Validators + ID helpers shared across aggregators.
 *   - Stable across future sub-PRs; the surface area is what
 *     `/v5/operating/page.tsx` (Phase 9.2+) renders.
 *
 * What this module is NOT
 *   - It is NOT a renderer. UI lives in
 *     `app/v5/operating/*` (Phase 9.2+).
 *   - It is NOT a fetcher. Aggregators in
 *     `./aggregators.ts` do the I/O. The schema is pure.
 *   - It is NOT a telemetry hook. KV writes live in
 *     `./telemetry.ts`.
 *
 * Privacy posture
 *   The schema NEVER carries per-visitor data. Every shape
 *   describes the OPERATOR's own engineering work — public
 *   commits, public experiment surfaces, public failure
 *   log, hand-curated planned items. No identifiers, no
 *   PII, no fingerprints.
 *
 * V5 future § 3.1: "Bu kişi gerçekten ne yapıyor, gözünün
 * önünde." The twin is the OPERATOR'S transparency. Phase 6
 * (perception) + Phase 7 (temporal) + Phase 8 (topology)
 * are about THE VISITOR'S relationship with the ecosystem;
 * Phase 9 is the OPERATOR'S relationship with their own
 * engineering — surfaced publicly.
 *
 * Edge-safety: pure data + pure functions, no I/O, no DOM.
 * Safe to import from any runtime.
 */

/* ── 1. weekly_commits ─────────────────────────────── */

/**
 * The week's pushed commits, ordered newest-first. The
 * raw `ChangelogCommit` shape from `lib/github-events` is
 * reused so the same source-of-truth feeds /changelog and
 * the operational twin without duplication.
 */
export interface WeeklyCommitsSummary {
  /** Commits whose timestamp is within the last 7 days,
   *  newest first. */
  commits: readonly ChangelogCommit[];
  /** Number of distinct repositories touched in the
   *  window. Operator-side signal of breadth. */
  repos_touched: number;
  /** Total commit count in the window (= `commits.length`,
   *  but exposed as a primitive for the surface that wants
   *  the number without iterating). */
  total_commits: number;
  /** Distribution of commits by conventional-commit type
   *  (`feat` / `fix` / `chore` / etc.). Counts are bounded
   *  by the window. */
  by_type: Readonly<Record<string, number>>;
  /** ISO timestamp of the most recent commit in the
   *  window, or `null` when the window is empty. */
  latest_commit_at: string | null;
  /** ISO timestamp of the oldest commit in the window. */
  oldest_commit_at: string | null;
  /** ISO timestamp of the window's lower bound — exactly
   *  7 days before `generated_at` on the snapshot. */
  window_start: string;
}

/* ── 2. active_infrastructure ──────────────────────── */

/**
 * One row in the active-infrastructure table. The
 * aggregator builds a fixed list of known production
 * systems + checks each one's "last seen" signal from KV
 * telemetry.
 *
 *   id         — stable kebab-case identifier.
 *   label      — short editorial display name.
 *   description— one-sentence operator description.
 *   surface    — public URL where the system is observable.
 *   last_seen_at — ISO timestamp of the most recent
 *                  recorded activity, or `null` when KV
 *                  is empty (system "dormant").
 *   status     — derived from `last_seen_at`:
 *                  `active`   — last seen within 7 days
 *                  `dormant`  — last seen 7-30 days ago
 *                  `archived` — last seen > 30 days ago
 *                                OR no signal at all
 */
export type InfrastructureStatus = "active" | "dormant" | "archived";

export interface InfrastructureEntry {
  id: string;
  label: string;
  description: string;
  surface: string;
  last_seen_at: string | null;
  status: InfrastructureStatus;
}

export interface ActiveInfrastructure {
  /** Every known infrastructure entry — ordered by status
   *  (active → dormant → archived) then by label. */
  entries: readonly InfrastructureEntry[];
  /** Counts by status — operator-side glance signal. */
  by_status: Readonly<Record<InfrastructureStatus, number>>;
}

/* ── 3. running_experiments ────────────────────────── */

/**
 * Experiments currently running on the platform. The list
 * combines two sources:
 *   - Phase 5 `lib/playground/registry`'s enabled
 *     experiments (via `getEnabledExperiments`).
 *   - Phase 4 `/lab/*` surfaces (hand-encoded — the lab
 *     experiments are stable enough that a registry isn't
 *     needed).
 *
 * Each entry carries its public URL + a status mapping
 * (`shell` / `active` / `archived`) so the surface can
 * filter cleanly.
 */
export interface ExperimentEntry {
  id: string;
  label: string;
  description: string;
  surface: string;
  /** "lab" or "playground" — the host system. */
  host: "lab" | "playground";
  /** Status passes through the playground's status; lab
   *  experiments are always "active" by convention
   *  (they're production routes, not feature-flagged). */
  status: "shell" | "active" | "archived";
}

export interface RunningExperiments {
  entries: readonly ExperimentEntry[];
  /** Count of entries with status === "active". */
  active_count: number;
}

/* ── 4. planned_next ───────────────────────────────── */

/**
 * One item the operator has declared they're working on
 * next. Hand-curated, honest editorial. Append-only by
 * convention — completed items either move to evolution
 * registry (8.1) or get removed.
 */
export interface PlannedItem {
  /** Stable kebab-case identifier. */
  id: string;
  /** One-line title. */
  title: string;
  /** One-paragraph description — the why, not the what. */
  description: string;
  /** Loose status — operator's honest assessment. */
  status: "draft" | "in-progress" | "next-up" | "considering";
  /** Optional target system / surface (free-form). */
  context?: string;
  /** ISO-8601 date when the operator added the item. */
  added: string;
}

export interface PlannedNext {
  items: readonly PlannedItem[];
  /** Counts by status. */
  by_status: Readonly<Record<PlannedItem["status"], number>>;
}

/* ── 5. recent_failures ────────────────────────────── */

/**
 * The most recent slice of the public /lumina/failures
 * corrections log. The twin renders the LAST N entries
 * (configurable via the aggregator); the full archive
 * remains at /lumina/failures.
 */
export interface RecentFailures {
  entries: readonly FailureEntry[];
  /** Count of entries shown — bounded by the aggregator's
   *  `limit` parameter (default 3). */
  shown_count: number;
  /** Total count in the source log — operator-side signal
   *  of "how often we record corrections". */
  total_count: number;
}

/* ── Snapshot composer ─────────────────────────────── */

/**
 * The aggregate snapshot the twin renders. Every Phase 9
 * sub-PR after 9.1 reads from this exact shape; the schema
 * is the stable contract.
 *
 *   generated_at — ISO timestamp the snapshot was composed.
 *   weekly_commits / active_infrastructure / running_experiments
 *   / planned_next / recent_failures — the five surfaces.
 *
 * `generated_at` is the only field that VARIES per render
 * (everything else is deterministic from the data sources
 * + the clock at compose time).
 */
export interface OperationalSnapshot {
  generated_at: string;
  weekly_commits: WeeklyCommitsSummary;
  active_infrastructure: ActiveInfrastructure;
  running_experiments: RunningExperiments;
  planned_next: PlannedNext;
  recent_failures: RecentFailures;
}

/* ── Validators + helpers ──────────────────────────── */

/** Stable kebab-case ID pattern, shared across infrastructure
 *  + experiment + planned IDs. */
const ID_PATTERN = /^[a-z0-9][a-z0-9-]{1,79}$/;

export function isValidOperatingId(value: unknown): value is string {
  return typeof value === "string" && ID_PATTERN.test(value);
}

/** Status options for `PlannedItem.status`. Closed
 *  allow-list. */
export const PLANNED_STATUSES = [
  "draft",
  "in-progress",
  "next-up",
  "considering",
] as const;

export type PlannedStatus = (typeof PLANNED_STATUSES)[number];

const PLANNED_STATUS_SET: ReadonlySet<string> = new Set(PLANNED_STATUSES);

export function isPlannedStatus(value: unknown): value is PlannedStatus {
  return typeof value === "string" && PLANNED_STATUS_SET.has(value);
}

/** Status options for `InfrastructureEntry.status`. Derived,
 *  not authored — but the closed allow-list keeps the
 *  validator simple. */
export const INFRASTRUCTURE_STATUSES = [
  "active",
  "dormant",
  "archived",
] as const;

const INFRASTRUCTURE_STATUS_SET: ReadonlySet<string> = new Set(
  INFRASTRUCTURE_STATUSES,
);

export function isInfrastructureStatus(
  value: unknown,
): value is InfrastructureStatus {
  return (
    typeof value === "string" && INFRASTRUCTURE_STATUS_SET.has(value)
  );
}

/* Re-export the consumed types so downstream readers
 * import everything from one schema module. */
export type { ChangelogCommit, FailureEntry, PlaygroundExperiment };
