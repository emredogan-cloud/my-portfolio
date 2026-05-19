import { PLANNED_ITEMS } from "@/data/v5/operating/planned";
import { getRecentCommits } from "@/lib/github-events";
import { readMetric, METRIC_KEYS, type MetricKey } from "@/lib/telemetry/metrics";

import {
  getKnownInfrastructureIds,
  summariseActiveInfrastructure,
  summariseRecentFailures,
  summariseRunningExperiments,
  summariseWeeklyCommits,
  summarisePlannedNext,
} from "./aggregators";
import type { OperationalSnapshot } from "./schema";

/**
 * V5 Phase 9 Sub-PR 9.1 — operational snapshot composer.
 *
 * Single entry-point for building the
 * `OperationalSnapshot` shape. Reads from four data
 * sources:
 *
 *   1. `getRecentCommits` (GitHub events feed via
 *      lib/github-events) → weekly_commits
 *   2. Metric snapshots from KV (via lib/telemetry/metrics
 *      `readMetric`) → active_infrastructure
 *   3. Static `PLAYGROUND_EXPERIMENTS` + hand-encoded lab
 *      list (no I/O) → running_experiments
 *   4. Static `PLANNED_ITEMS` (no I/O) → planned_next
 *   5. Static `LUMINA_FAILURES` (no I/O) → recent_failures
 *
 * The composer fans out the two I/O calls (commits + metric
 * snapshots) in parallel via `Promise.all`. Pure aggregators
 * run synchronously after I/O resolves.
 *
 * ISR contract per V5 future § 3.1: "ISR 1h. Real-time poll
 * yasak." The composer is meant to be called once per ISR
 * regeneration window; consumers should not call it per
 * request.
 *
 * Graceful degradation
 *   - When `getRecentCommits` fails (GitHub down, network
 *     hiccup), it returns an empty array; the snapshot's
 *     `weekly_commits.commits` ends up empty.
 *   - When KV is unavailable, every `readMetric` returns
 *     null; the snapshot's `active_infrastructure` shows
 *     every system as "archived" (no signal).
 *   - The static aggregators never throw.
 *
 * Edge-safety
 *   The composer can run from edge OR node runtimes. The
 *   underlying `getRecentCommits` uses fetch + @vercel/kv,
 *   both edge-safe. `readMetric` uses @vercel/kv directly.
 *
 * Privacy posture
 *   The composer reads operator-side data (commits, KV
 *   metric snapshots, hand-curated lists). Zero visitor-
 *   identifying signal is consumed or persisted.
 */

/**
 * Map each known infrastructure id to the metric key whose
 * `updated_at` carries the "last seen" signal. Some systems
 * have an obvious primary counter (e.g., `lumina-chat` →
 * `LUMINA_P95_LATENCY`); others map to their dedicated
 * scalar (`v5-perception` → `V5_PERCEPTION_PAGE_VISITS`).
 *
 * Systems without a meaningful counter map to `null` and
 * always derive status `archived` — operator-side signal
 * that the system exists but the platform doesn't track its
 * heartbeat.
 */
const INFRASTRUCTURE_TO_METRIC_KEY: Readonly<
  Record<string, MetricKey | null>
> = {
  "lumina-chat": METRIC_KEYS.LUMINA_P95_LATENCY,
  "lab-iam-translator": METRIC_KEYS.LAB_IAM_VISITS_DAILY,
  "lab-prompt-rescuer": METRIC_KEYS.LAB_PROMPT_RESCUER_VISITS_DAILY,
  "lab-commit-narrator": METRIC_KEYS.LAB_COMMIT_NARRATOR_VISITS_DAILY,
  "telemetry-dashboard": METRIC_KEYS.TELEMETRY_VISITS,
  "v5-perception": METRIC_KEYS.V5_PERCEPTION_PAGE_VISITS,
  "v5-evolution": METRIC_KEYS.EVOLUTION_PAGE_VISITS,
  "v5-topology": METRIC_KEYS.TOPOLOGY_PAGE_VISITS,
};

/**
 * Compose the full operational snapshot. Returns a freshly
 * built `OperationalSnapshot` every call; consumers
 * (typically a Server Component with ISR) read the
 * structure as-is.
 */
export async function composeOperationalSnapshot(): Promise<OperationalSnapshot> {
  const now = Date.now();

  /* Phase 1: fan out the I/O. The two awaits below are
   * the only network/KV hits the composer makes per call. */
  const [commits, lastSeenById] = await Promise.all([
    getRecentCommits(50),
    readInfrastructureLastSeen(),
  ]);

  /* Phase 2: run pure aggregators against the loaded data. */
  const weekly_commits = summariseWeeklyCommits(commits, now);
  const active_infrastructure = summariseActiveInfrastructure(
    lastSeenById,
    now,
  );
  const running_experiments = summariseRunningExperiments();
  const planned_next = summarisePlannedNext(PLANNED_ITEMS);
  const recent_failures = summariseRecentFailures(3);

  return {
    generated_at: new Date(now).toISOString(),
    weekly_commits,
    active_infrastructure,
    running_experiments,
    planned_next,
    recent_failures,
  };
}

/**
 * Read every infrastructure entry's "last seen" timestamp
 * from KV in parallel. Returns a map keyed by infrastructure
 * id → ISO timestamp (or null when no signal).
 *
 * Each `readMetric` is itself a graceful no-op when KV is
 * unavailable — returns null. The Promise.all collects every
 * result; failures surface as null, not as thrown errors.
 */
async function readInfrastructureLastSeen(): Promise<
  Record<string, string | null>
> {
  const ids = getKnownInfrastructureIds();
  const reads = await Promise.all(
    ids.map(async (id) => {
      const metricKey = INFRASTRUCTURE_TO_METRIC_KEY[id];
      if (!metricKey) return [id, null] as const;
      const snapshot = await readMetric(metricKey);
      return [id, snapshot?.updated_at ?? null] as const;
    }),
  );
  const out: Record<string, string | null> = {};
  for (const [id, ts] of reads) out[id] = ts;
  return out;
}
