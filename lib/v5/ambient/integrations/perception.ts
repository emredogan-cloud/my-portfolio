import { isPerceptionEnabled } from "@/lib/v5/perception/consent";
import { PERCEPTION_CATEGORIES } from "@/lib/v5/perception/buckets";
import { readPerceptionSnapshot } from "@/lib/v5/perception/telemetry";
import type { PerceptionCategory } from "@/lib/v5/perception/buckets";

import {
  projectIntensity,
  type AttentionDomainView,
  type EnvironmentalSignal,
  type NavigationDomainView,
  type SignalIntensity,
} from "../schema";

/**
 * V5 Phase 10 Sub-PR 10.1 — perception → ambient view.
 *
 * Pure projection from `readPerceptionSnapshot()` (Phase 6.1)
 * to the ambient layer's `NavigationDomainView` +
 * `AttentionDomainView` shapes.
 *
 * Privacy contract (load-bearing)
 *   The perception source already returns AGGREGATE counts
 *   only (HINCRBY-driven hashes). This integration further
 *   PROJECTS those counts to ordinal intensities — the
 *   ambient consumer never sees the underlying numbers as
 *   anything other than the operator-audit primitive
 *   (`total_events` / `weekly_commit_count` etc.).
 *
 *   Critical invariant: `active_categories` is a SET, not an
 *   ordered sequence. Consumers can detect "navigation is
 *   active in these categories" but CANNOT reconstruct flow
 *   paths.
 *
 * Flag gate
 *   When `V5_PERCEPTION_ENABLED` is OFF, both views return
 *   null. Honest absence — the ambient layer doesn't fake
 *   data when the source is dark-launched.
 *
 * Edge-safety: edge-safe (the underlying KV reads + flag
 * check are both edge-compatible).
 */

/* ── Threshold tables ─────────────────────────────────── */

/**
 * Navigation event-count thresholds for ordinal projection.
 *
 * The total event count is summed across all categories' all
 * buckets. The thresholds keep the foundation honest while
 * the perception observers are not yet mounted (most
 * deployments will see 0 events — the view returns null).
 *
 * Once observers ship + early adoption begins, these
 * thresholds may need re-calibration; they're tuned for
 * "is there activity at all" detection, not for high
 * precision.
 */
const NAVIGATION_THRESHOLDS = { low_max: 25, medium_max: 250 } as const;

const DWELL_THRESHOLDS = { low_max: 25, medium_max: 250 } as const;

const SCROLL_THRESHOLDS = { low_max: 25, medium_max: 250 } as const;

/* ── Internal helpers ────────────────────────────────── */

function sumCounts(buckets: Record<string, number>): number {
  let total = 0;
  for (const v of Object.values(buckets)) {
    if (Number.isFinite(v)) total += v;
  }
  return total;
}

/* ── Public projection helpers ───────────────────────── */

/**
 * Compose the perception-derived ambient views in one pass.
 * Returns both `navigation` + `attention` projections
 * (typically the registry needs both; reading the snapshot
 * twice would be wasteful).
 *
 * Returns nulls when:
 *   - `V5_PERCEPTION_ENABLED` is OFF (honest absence)
 *   - KV is unavailable (the underlying read returns empty
 *     hashes; the projection's totals all hit 0; the views
 *     report null)
 */
export async function viewPerception(): Promise<{
  navigation: NavigationDomainView | null;
  attention: AttentionDomainView | null;
  signals: readonly EnvironmentalSignal[];
}> {
  if (!isPerceptionEnabled()) {
    return {
      navigation: null,
      attention: null,
      signals: [
        {
          domain: "navigation",
          kind: "perception-disabled",
          intensity: "low",
          source: "integrations/perception.ts:viewPerception",
        },
      ],
    };
  }

  const snapshot = await readPerceptionSnapshot();

  /* Navigation projection: sum counts across the navigation-
   * flow + section-engagement categories. Track which
   * categories have signal. */
  const navigationCategories: PerceptionCategory[] = [];
  let navigationTotal = 0;
  for (const category of PERCEPTION_CATEGORIES) {
    const total = sumCounts(snapshot[category] ?? {});
    if (total > 0) {
      navigationCategories.push(category);
      navigationTotal += total;
    }
  }

  const navigationIntensity = projectIntensity(
    navigationTotal,
    NAVIGATION_THRESHOLDS,
  );

  /* Attention projection: dwell + scroll specifically. The
   * source hash names are PerceptionCategory enum values. */
  const dwellTotal = sumCounts(snapshot["dwell-time"] ?? {});
  const scrollTotal = sumCounts(snapshot["scroll-velocity"] ?? {});
  const dwellIntensity = projectIntensity(dwellTotal, DWELL_THRESHOLDS);
  const scrollIntensity = projectIntensity(
    scrollTotal,
    SCROLL_THRESHOLDS,
  );

  const navigation: NavigationDomainView | null =
    navigationIntensity === null
      ? null
      : {
          intensity: navigationIntensity,
          active_categories: navigationCategories,
          total_events: navigationTotal,
        };

  const hasAttention =
    dwellIntensity !== null || scrollIntensity !== null;

  const attention: AttentionDomainView | null = hasAttention
    ? {
        dwell_intensity: (dwellIntensity ?? "low") as SignalIntensity,
        scroll_intensity: (scrollIntensity ??
          "low") as SignalIntensity,
        has_signal: true,
      }
    : null;

  const signals: EnvironmentalSignal[] = [];
  if (navigation) {
    signals.push({
      domain: "navigation",
      kind: "perception-active",
      intensity: navigation.intensity,
      source: "integrations/perception.ts:viewPerception",
    });
  }
  if (attention) {
    signals.push({
      domain: "attention",
      kind: "perception-attention",
      intensity:
        attention.dwell_intensity === "high" ||
        attention.scroll_intensity === "high"
          ? "high"
          : attention.dwell_intensity === "medium" ||
              attention.scroll_intensity === "medium"
            ? "medium"
            : "low",
      source: "integrations/perception.ts:viewPerception",
    });
  }

  return { navigation, attention, signals };
}
