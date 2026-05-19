import { isOperatingTwinEnabled } from "@/lib/v5/operating/flags";
import { composeOperationalSnapshot } from "@/lib/v5/operating/snapshot";
import { listRecentJournalEntries } from "@/lib/v5/journal/storage";

import {
  projectIntensity,
  type EnvironmentalSignal,
  type OperationalDomainView,
} from "../schema";

/**
 * V5 Phase 10 Sub-PR 10.1 — operational → ambient view.
 *
 * Reads the Phase 9.1 composer + (optionally) the Phase 9.3
 * latest journal narrative; projects to the ambient layer's
 * `OperationalDomainView` shape.
 *
 * Privacy contract
 *   The operational composer reads OPERATOR-SIDE data only
 *   (commits, KV metric snapshots, planned items, failures).
 *   The journal entries are templated narratives from
 *   Phase 9.3 (Anti-Generic-AI Law compliant — no LLM).
 *   No visitor-derived signal at any point.
 *
 * Flag gate
 *   When `V5_OPERATING_TWIN_ENABLED` is OFF, returns null.
 *   The ambient layer doesn't force the operational composer
 *   to run when its own family flag is off; absence is
 *   honest.
 *
 * Performance posture
 *   The operational composer makes 1 GitHub API call + 8
 *   parallel KV reads (~150-300ms). The journal head is 2
 *   KV reads. The composer is the dominant cost; the
 *   ambient registry caller is responsible for caching the
 *   composed context.
 *
 * Edge-safety: edge-safe (the underlying composer is edge-
 * safe per Phase 9.1's verification).
 */

const COMMIT_THRESHOLDS = { low_max: 5, medium_max: 25 } as const;

export async function viewOperating(): Promise<{
  operational: OperationalDomainView | null;
  signals: readonly EnvironmentalSignal[];
}> {
  if (!isOperatingTwinEnabled()) {
    return {
      operational: null,
      signals: [
        {
          domain: "operational",
          kind: "operating-disabled",
          intensity: "low",
          source: "integrations/operating.ts:viewOperating",
        },
      ],
    };
  }

  /* Fan out the I/O: snapshot + journal head in parallel.
   * Both are individually graceful — the snapshot composer
   * returns empty/zero structures on infra failure; the
   * journal read returns []. The projection below handles
   * either gracefully. */
  let snapshot: Awaited<ReturnType<typeof composeOperationalSnapshot>>;
  let latestNarrative: string | null = null;
  try {
    const [snap, recent] = await Promise.all([
      composeOperationalSnapshot(),
      listRecentJournalEntries(1).catch(() => []),
    ]);
    snapshot = snap;
    latestNarrative = recent[0]?.narrative ?? null;
  } catch {
    /* If the composer itself throws, return null — the
     * operational domain is "unavailable" rather than
     * presenting partial data. */
    return {
      operational: null,
      signals: [
        {
          domain: "operational",
          kind: "operating-compose-failed",
          intensity: "high",
          source: "integrations/operating.ts:viewOperating",
        },
      ],
    };
  }

  const weeklyCount = Number.isFinite(
    snapshot.weekly_commits.total_commits,
  )
    ? snapshot.weekly_commits.total_commits
    : 0;
  const weeklyIntensity =
    projectIntensity(weeklyCount, COMMIT_THRESHOLDS) ?? "low";

  const plannedInMotion =
    (snapshot.planned_next.by_status["in-progress"] ?? 0) +
    (snapshot.planned_next.by_status["next-up"] ?? 0);

  const operational: OperationalDomainView = {
    weekly_commits: weeklyIntensity,
    weekly_commit_count: weeklyCount,
    active_infrastructure_count:
      snapshot.active_infrastructure.by_status.active ?? 0,
    experiments_running:
      snapshot.running_experiments.active_count ?? 0,
    planned_in_motion: plannedInMotion,
    snapshot_at: snapshot.generated_at,
    latest_narrative: latestNarrative,
  };

  const signals: EnvironmentalSignal[] = [
    {
      domain: "operational",
      kind: "weekly-commits",
      intensity: weeklyIntensity,
      source: "integrations/operating.ts:viewOperating",
    },
  ];

  return { operational, signals };
}
