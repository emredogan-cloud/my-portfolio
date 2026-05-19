import { summariseEvolutionRegistry } from "@/lib/v5/temporal/registry";
import { currentIsoWeek } from "@/lib/v5/journal/schema";

import type {
  EnvironmentalSignal,
  TemporalDomainView,
} from "../schema";

/**
 * V5 Phase 10 Sub-PR 10.1 — temporal → ambient view.
 *
 * Pure projection: reads the build-time evolution registry
 * summariser + the wall-clock + the ISO-week helper. No KV.
 * No fetch. No async I/O.
 *
 * Privacy contract
 *   Wall-clock time only. NO per-visitor timestamps. NO
 *   session age. The temporal view describes the ECOSYSTEM
 *   time context, not the visitor's time-in-session.
 *
 * Marked async for shape consistency with other integration
 * views; the registry composer can await every domain
 * uniformly. The implementation has no awaited work.
 *
 * Edge-safety: pure read, edge-safe.
 */

const WEEKDAYS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
] as const;

export async function viewTemporal(): Promise<{
  temporal: TemporalDomainView;
  signals: readonly EnvironmentalSignal[];
}> {
  const now = new Date();
  const evolution = summariseEvolutionRegistry();

  const temporal: TemporalDomainView = {
    iso_week: currentIsoWeek(now.getTime()),
    day_of_week: WEEKDAYS[now.getUTCDay()] ?? "Unknown",
    iso_date: now.toISOString().slice(0, 10),
    evolution_events_total: evolution.total,
    evolution_latest: evolution.latestDate,
  };

  const signals: EnvironmentalSignal[] = [
    {
      domain: "temporal",
      kind: "wall-clock",
      /* Ordinal intensity here is a structural placeholder —
       * the temporal domain is always "low" because time is
       * always present. Future consumers branch on `iso_week`
       * + `day_of_week` for richer behavior. */
      intensity: "low",
      source: "integrations/temporal.ts:viewTemporal",
    },
  ];

  return { temporal, signals };
}
