import { LUMINA_FAILURES } from "@/data/lumina-failures";
import type { ChangelogCommit } from "@/lib/github-events";
import {
  PLAYGROUND_EXPERIMENTS,
  type PlaygroundExperiment,
} from "@/lib/playground/registry";

import type {
  ActiveInfrastructure,
  ExperimentEntry,
  InfrastructureEntry,
  InfrastructureStatus,
  PlannedItem,
  PlannedNext,
  RecentFailures,
  RunningExperiments,
  WeeklyCommitsSummary,
} from "./schema";

/**
 * V5 Phase 9 Sub-PR 9.1 — operational twin aggregators.
 *
 * Pure aggregator functions that compose each of the
 * snapshot's five surfaces from existing data sources:
 *
 *   summariseWeeklyCommits  → reads commits[] (caller passes
 *                              the result of `getRecentCommits`)
 *   summariseActiveInfrastructure → reads a metric-snapshot
 *                                    map (caller fetches via
 *                                    `readMetric`)
 *   summariseRunningExperiments → reads `PLAYGROUND_EXPERIMENTS`
 *                                  + a hand-encoded lab list
 *   summarisePlannedNext    → reads the static `PLANNED_ITEMS`
 *                              data file
 *   summariseRecentFailures → reads `LUMINA_FAILURES`
 *
 * Every aggregator is a PURE FUNCTION. The composer
 * (`snapshot.ts`) does the I/O — these helpers receive
 * already-loaded data and produce typed summaries.
 *
 * Why pure functions
 *   - Aggregators are easy to test (pass synthetic inputs,
 *     check outputs deterministically).
 *   - Future ISR regeneration calls the composer once;
 *     each aggregator runs once per render. CPU cost is
 *     bounded by the data sizes.
 *   - The composer can fan out the I/O calls in parallel
 *     via `Promise.all`; aggregators don't block each
 *     other.
 *
 * Edge-safety: pure data + pure functions, no I/O, no DOM,
 * no `process.env`. Safe to call from any runtime.
 */

/* ── 1. weekly_commits aggregator ──────────────────── */

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

/**
 * Filter the recent commits feed to the last 7 days +
 * compute breadth signals. The `now` argument is injected
 * for testability + determinism in ISR contexts.
 *
 * Algorithm:
 *   1. Compute the window lower bound (now - 7 days).
 *   2. Filter commits whose `timestamp` parses + lies in
 *      the window.
 *   3. Count distinct repos.
 *   4. Bucket by conventional-commit `type`.
 *   5. Find newest + oldest timestamps in the window.
 *
 * Empty input or empty window returns a zero-filled
 * summary with `latest_commit_at` + `oldest_commit_at` as
 * `null` + `total_commits` = 0.
 */
export function summariseWeeklyCommits(
  commits: readonly ChangelogCommit[],
  now: number = Date.now(),
): WeeklyCommitsSummary {
  const windowStart = now - SEVEN_DAYS_MS;
  const inWindow: ChangelogCommit[] = [];
  for (const commit of commits) {
    const ts = Date.parse(commit.timestamp);
    if (!Number.isFinite(ts)) continue;
    if (ts < windowStart || ts > now) continue;
    inWindow.push(commit);
  }
  inWindow.sort((a, b) => {
    const ta = Date.parse(a.timestamp);
    const tb = Date.parse(b.timestamp);
    return tb - ta;
  });

  const reposTouched = new Set<string>();
  const byType: Record<string, number> = {};
  for (const commit of inWindow) {
    if (commit.repo) reposTouched.add(commit.repo);
    const t = commit.type ?? "other";
    byType[t] = (byType[t] ?? 0) + 1;
  }

  const latest = inWindow.length > 0 ? inWindow[0].timestamp : null;
  const oldest =
    inWindow.length > 0 ? inWindow[inWindow.length - 1].timestamp : null;

  return {
    commits: inWindow,
    repos_touched: reposTouched.size,
    total_commits: inWindow.length,
    by_type: byType,
    latest_commit_at: latest,
    oldest_commit_at: oldest,
    window_start: new Date(windowStart).toISOString(),
  };
}

/* ── 2. active_infrastructure aggregator ───────────── */

/**
 * The canonical list of known production systems. Each
 * entry maps to a metric key whose `updated_at` carries
 * the "last seen" signal. The aggregator receives a map
 * of metric snapshots from the composer.
 *
 * Order matters editorially (operator's perspective on
 * what's "the main systems first"). The aggregator
 * stable-sorts the OUTPUT by status, not by this list.
 */
const KNOWN_INFRASTRUCTURE: readonly Omit<
  InfrastructureEntry,
  "last_seen_at" | "status"
>[] = [
  {
    id: "lumina-chat",
    label: "Lumina chat",
    description:
      "The AI-native chat surface embedded across the portfolio. 13-tool registry, architecture-critic sub-agent, 14-day persistent memory.",
    surface: "/lumina/brain",
  },
  {
    id: "lab-iam-translator",
    label: "Lab — IAM Translator",
    description:
      "Streaming Bedrock-backed AWS IAM policy translator. Rate-limited, cost-capped, public.",
    surface: "/lab/iam-translator",
  },
  {
    id: "lab-prompt-rescuer",
    label: "Lab — Prompt Rescuer",
    description:
      "Under-specified prompts → structured AI agent briefs. Same rate-limit + cost-cap chassis as IAM Translator.",
    surface: "/lab/prompt-rescuer",
  },
  {
    id: "lab-commit-narrator",
    label: "Lab — Commit Narrator",
    description:
      "Engineering-grade summaries from recent commit history.",
    surface: "/lab/commit-narrator",
  },
  {
    id: "telemetry-dashboard",
    label: "Telemetry dashboard",
    description:
      "Public engineering telemetry — Lumina p95, lab adoption funnels, npm download counts.",
    surface: "/telemetry",
  },
  {
    id: "v5-perception",
    label: "V5 perception layer",
    description:
      "Phase 6 foundation. Closed-schema, consent-gated, aggregate-only perception telemetry.",
    surface: "/v5/perception",
  },
  {
    id: "v5-evolution",
    label: "V5 evolution archive",
    description:
      "Phase 7 engineering memory surface. 17 architectural events, scrubbable timeline.",
    surface: "/evolution",
  },
  {
    id: "v5-topology",
    label: "V5 topology",
    description:
      "Phase 8 cinematic topology renderer. ONE production project mount (Cloud Waste Hunter).",
    surface: "/v5/topology/cloud-waste-hunter",
  },
];

/**
 * Convert a `last_seen_at` ISO timestamp into the derived
 * `status`. Bands per V5 future § 3.1 implicit conventions:
 *
 *   - active   — < 7 days
 *   - dormant  — 7-30 days
 *   - archived — > 30 days OR no signal
 */
export function deriveInfrastructureStatus(
  lastSeenAt: string | null,
  now: number = Date.now(),
): InfrastructureStatus {
  if (lastSeenAt === null) return "archived";
  const ts = Date.parse(lastSeenAt);
  if (!Number.isFinite(ts)) return "archived";
  const age = now - ts;
  if (age < SEVEN_DAYS_MS) return "active";
  if (age < SEVEN_DAYS_MS * 4) return "dormant";
  return "archived";
}

/**
 * Compose the active-infrastructure summary from a map
 * keyed by infrastructure id → last-seen ISO timestamp.
 *
 * The composer fetches the timestamp map (typically by
 * reading metric snapshots for each system's primary
 * counter); this aggregator just stamps each known entry
 * with its derived status + sorts the output.
 *
 * Sort order: status priority (active first, then dormant,
 * then archived) + within each status, alphabetical by
 * label. Deterministic + stable across renders.
 */
export function summariseActiveInfrastructure(
  lastSeenById: Readonly<Record<string, string | null>>,
  now: number = Date.now(),
): ActiveInfrastructure {
  const entries: InfrastructureEntry[] = KNOWN_INFRASTRUCTURE.map(
    (base) => {
      const lastSeen = lastSeenById[base.id] ?? null;
      const status = deriveInfrastructureStatus(lastSeen, now);
      return {
        ...base,
        last_seen_at: lastSeen,
        status,
      };
    },
  );

  /* Status priority for sorting. */
  const STATUS_PRIORITY: Record<InfrastructureStatus, number> = {
    active: 0,
    dormant: 1,
    archived: 2,
  };

  entries.sort((a, b) => {
    const sa = STATUS_PRIORITY[a.status];
    const sb = STATUS_PRIORITY[b.status];
    if (sa !== sb) return sa - sb;
    return a.label.localeCompare(b.label);
  });

  const byStatus: Record<InfrastructureStatus, number> = {
    active: 0,
    dormant: 0,
    archived: 0,
  };
  for (const entry of entries) byStatus[entry.status]++;

  return { entries, by_status: byStatus };
}

/** Public accessor for the canonical infrastructure list
 *  — exposed so the composer can derive metric-key
 *  mappings without re-declaring the list. */
export function getKnownInfrastructureIds(): readonly string[] {
  return KNOWN_INFRASTRUCTURE.map((e) => e.id);
}

/* ── 3. running_experiments aggregator ─────────────── */

/**
 * The lab-side experiments. Hand-encoded because the
 * /lab/* routes don't have a registry like the playground.
 * Phase 4's three experiments are stable enough that an
 * explicit list is honest.
 */
const KNOWN_LAB_EXPERIMENTS: readonly ExperimentEntry[] = [
  {
    id: "iam-translator",
    label: "IAM Translator",
    description:
      "Streaming Bedrock endpoint translating plain-English AWS access requests into hardened least-privilege IAM JSON.",
    surface: "/lab/iam-translator",
    host: "lab",
    status: "active",
  },
  {
    id: "prompt-rescuer",
    label: "Prompt Rescuer",
    description:
      "Rewrites under-specified prompts into structured AI agent briefs.",
    surface: "/lab/prompt-rescuer",
    host: "lab",
    status: "active",
  },
  {
    id: "commit-narrator",
    label: "Commit Narrator",
    description:
      "Synthesises engineering-grade summaries from a project's recent commit history.",
    surface: "/lab/commit-narrator",
    host: "lab",
    status: "active",
  },
];

/** Build the playground entries from the registry. The
 *  PlaygroundExperiment shape uses `name` + `purpose`; we
 *  re-label as `label` + `description` for the twin's
 *  uniform ExperimentEntry shape. */
function playgroundEntries(): ExperimentEntry[] {
  return PLAYGROUND_EXPERIMENTS.map(
    (exp: PlaygroundExperiment): ExperimentEntry => ({
      id: exp.slug,
      label: exp.name,
      description: exp.purpose,
      surface: `/playground/${exp.slug}`,
      host: "playground",
      status: exp.status,
    }),
  );
}

export function summariseRunningExperiments(): RunningExperiments {
  const entries: ExperimentEntry[] = [
    ...KNOWN_LAB_EXPERIMENTS,
    ...playgroundEntries(),
  ];

  /* Sort: active first, then shell, then archived;
   * within each status, alphabetical by label. */
  const STATUS_PRIORITY: Record<ExperimentEntry["status"], number> = {
    active: 0,
    shell: 1,
    archived: 2,
  };
  entries.sort((a, b) => {
    const sa = STATUS_PRIORITY[a.status];
    const sb = STATUS_PRIORITY[b.status];
    if (sa !== sb) return sa - sb;
    return a.label.localeCompare(b.label);
  });

  const activeCount = entries.filter((e) => e.status === "active").length;

  return { entries, active_count: activeCount };
}

/* ── 4. planned_next aggregator ────────────────────── */

/**
 * Build the planned-next summary from the static data
 * file. The composer reads `PLANNED_ITEMS` from
 * `data/v5/operating/planned.ts`; this aggregator counts
 * by status.
 */
export function summarisePlannedNext(
  items: readonly PlannedItem[],
): PlannedNext {
  const byStatus: Record<PlannedItem["status"], number> = {
    draft: 0,
    "in-progress": 0,
    "next-up": 0,
    considering: 0,
  };
  for (const item of items) {
    byStatus[item.status]++;
  }

  /* Sort: in-progress first, next-up, considering, draft.
   * Within each status, by `added` descending (newest first). */
  const STATUS_PRIORITY: Record<PlannedItem["status"], number> = {
    "in-progress": 0,
    "next-up": 1,
    considering: 2,
    draft: 3,
  };
  const sorted = [...items].sort((a, b) => {
    const sa = STATUS_PRIORITY[a.status];
    const sb = STATUS_PRIORITY[b.status];
    if (sa !== sb) return sa - sb;
    return a.added < b.added ? 1 : a.added > b.added ? -1 : 0;
  });

  return { items: sorted, by_status: byStatus };
}

/* ── 5. recent_failures aggregator ─────────────────── */

const DEFAULT_FAILURE_LIMIT = 3;

/**
 * Slice the public failure log to the most-recent N
 * entries. The composer can pass a different limit if a
 * future surface wants more / fewer.
 *
 * `LUMINA_FAILURES` is authored newest-first by editorial
 * convention, so this aggregator preserves that ordering.
 */
export function summariseRecentFailures(
  limit: number = DEFAULT_FAILURE_LIMIT,
): RecentFailures {
  const clamped =
    Number.isFinite(limit) && limit > 0
      ? Math.floor(limit)
      : DEFAULT_FAILURE_LIMIT;
  const entries = LUMINA_FAILURES.slice(0, clamped);
  return {
    entries,
    shown_count: entries.length,
    total_count: LUMINA_FAILURES.length,
  };
}
