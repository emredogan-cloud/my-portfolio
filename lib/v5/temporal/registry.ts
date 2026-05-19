/**
 * V5 Phase 7 Sub-PR 7.1 — temporal event registry accessors.
 *
 * This module is the read-only surface over `EVOLUTION_EVENTS`
 * (declared in `data/temporal/events.ts`). It does three jobs:
 *
 *   1. Derive the canonical ordering. The data file is authored
 *      newest-first by editorial convention; the registry sorts
 *      again at import time so re-ordering an entry by hand
 *      never breaks the display.
 *
 *   2. Apply the `supersedes` cascade. When an event declares
 *      `supersedes: "<other-id>"`, the referenced entry's
 *      `status` flips to "superseded" on the next derive. This
 *      keeps the data file simple (authors only edit the newer
 *      entry; the cascade does the rest).
 *
 *   3. Expose typed filter helpers: by category, by system, by
 *      provenance, and a paginated tail for surfaces that want
 *      to render a bounded recent slice.
 *
 * The module imports the raw `EVOLUTION_EVENTS` array, derives
 * the canonical registry once at module load, then re-exports
 * accessors. The expensive work happens once per process; per-
 * call accessors are pure lookups.
 *
 * Edge-safety: pure data + pure functions. No I/O, no DOM, no
 * `process.env`. The whole module tree-shakes to whatever
 * accessor a consumer actually imports.
 */

import { EVOLUTION_EVENTS } from "@/data/temporal/events";

import {
  type EvolutionEvent,
  type EvolutionEventCategory,
  type EvolutionEventProvenance,
  EVOLUTION_EVENT_CATEGORIES,
} from "./schema";

/* ── Derive the canonical registry once at module load ─────── */

const CANONICAL_REGISTRY: readonly EvolutionEvent[] = deriveRegistry();

function deriveRegistry(): readonly EvolutionEvent[] {
  /* Walk every entry once to build the supersedes set. An entry
   * lands in the set when a LATER entry's `supersedes` field
   * points at it. */
  const supersededIds = new Set<string>();
  for (const event of EVOLUTION_EVENTS) {
    if (event.supersedes && event.supersedes.length > 0) {
      supersededIds.add(event.supersedes);
    }
  }
  /* Sort descending by date; ties break on id ascending for
   * stable ordering when two events land on the same day. */
  const sorted = [...EVOLUTION_EVENTS].sort((a, b) => {
    if (a.date !== b.date) return a.date < b.date ? 1 : -1;
    if (a.id !== b.id) return a.id < b.id ? -1 : 1;
    return 0;
  });
  /* Apply the cascade. Authors set every entry's `status` to
   * "current" by default; we flip to "superseded" when the id
   * appears in the set built above. The original data array
   * is not mutated. */
  return sorted.map((event) =>
    supersededIds.has(event.id) && event.status === "current"
      ? { ...event, status: "superseded" as const }
      : event,
  );
}

/* ── Accessors ─────────────────────────────────────────────── */

/** The full canonical registry, sorted newest-first. */
export function getEvolutionEvents(): readonly EvolutionEvent[] {
  return CANONICAL_REGISTRY;
}

/** Look up one event by stable id. Returns `undefined` when no
 *  entry matches. */
export function getEvolutionEventById(
  id: string,
): EvolutionEvent | undefined {
  if (typeof id !== "string" || !id) return undefined;
  return CANONICAL_REGISTRY.find((e) => e.id === id);
}

/** Filter the registry to one category. Preserves the canonical
 *  ordering. */
export function getEvolutionEventsByCategory(
  category: EvolutionEventCategory,
): readonly EvolutionEvent[] {
  return CANONICAL_REGISTRY.filter((e) => e.category === category);
}

/** Filter the registry to one system slug. Slugs are case-
 *  sensitive — the registry author writes them in canonical
 *  kebab-case. */
export function getEvolutionEventsBySystem(
  system: string,
): readonly EvolutionEvent[] {
  if (typeof system !== "string" || !system) return [];
  return CANONICAL_REGISTRY.filter((e) => e.system === system);
}

/** Filter the registry to one provenance class. */
export function getEvolutionEventsByProvenance(
  provenance: EvolutionEventProvenance,
): readonly EvolutionEvent[] {
  return CANONICAL_REGISTRY.filter((e) => e.provenance === provenance);
}

/** Return the most-recent N events. Surfaces that want a
 *  bounded tail (e.g. the homepage one day, the operational
 *  twin in Phase 9) read this. */
export function getRecentEvolutionEvents(
  limit: number,
): readonly EvolutionEvent[] {
  if (!Number.isFinite(limit) || limit <= 0) return [];
  const cap = Math.min(Math.floor(limit), CANONICAL_REGISTRY.length);
  return CANONICAL_REGISTRY.slice(0, cap);
}

/* ── Aggregate counts ──────────────────────────────────────── */

export interface EvolutionRegistrySummary {
  /** Total events in the registry. */
  total: number;
  /** Events currently active (not superseded). */
  current: number;
  /** Per-category counts. Every category in the schema appears,
   *  with zero when no event lives there. */
  byCategory: Record<EvolutionEventCategory, number>;
  /** ISO date of the most recent event, `null` when empty. */
  latestDate: string | null;
  /** ISO date of the earliest event, `null` when empty. */
  earliestDate: string | null;
}

/** One-pass summariser. Cheap; called at most once per ISR
 *  render. */
export function summariseEvolutionRegistry(): EvolutionRegistrySummary {
  const byCategory = {} as Record<EvolutionEventCategory, number>;
  for (const cat of EVOLUTION_EVENT_CATEGORIES) byCategory[cat] = 0;

  let current = 0;
  let latest: string | null = null;
  let earliest: string | null = null;

  for (const event of CANONICAL_REGISTRY) {
    byCategory[event.category]++;
    if (event.status === "current") current++;
    if (latest === null || event.date > latest) latest = event.date;
    if (earliest === null || event.date < earliest) earliest = event.date;
  }

  return {
    total: CANONICAL_REGISTRY.length,
    current,
    byCategory,
    latestDate: latest,
    earliestDate: earliest,
  };
}

/** Convenience: the set of all `system` slugs present in the
 *  registry. Surfaces that want to render a "filter by system"
 *  affordance read this. */
export function getEvolutionEventSystems(): readonly string[] {
  const seen = new Set<string>();
  for (const event of CANONICAL_REGISTRY) {
    if (event.system) seen.add(event.system);
  }
  return [...seen].sort();
}
