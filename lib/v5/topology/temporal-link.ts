import {
  getEvolutionEventById,
  getEvolutionEvents,
} from "@/lib/v5/temporal/registry";
import type { EvolutionEvent } from "@/lib/v5/temporal/schema";

import { getTopologyNodes, getTopologyNodeById } from "./registry";
import type { TopologyNode } from "./schema";

/**
 * V5 Phase 8 Sub-PR 8.1 — topology ↔ temporal cross-system
 * binding.
 *
 * The temporal registry (`data/temporal/events.ts`) carries
 * the WHAT happened. The topology registry (`data/topology/
 * graph.ts`) carries the WHAT EXISTS. Most topology nodes
 * have a moment of introduction or evolution recorded as an
 * `evolution_event_ids` cross-reference — but the temporal
 * registry doesn't yet know about it.
 *
 * This module ships the helpers that resolve those
 * cross-references in BOTH directions:
 *
 *   - `getEvolutionEventsForNode(nodeId)` — given a node,
 *     resolve its event ids into the real events.
 *   - `getTopologyNodesForEvolutionEvent(eventId)` — given
 *     an event id, walk every node in the topology registry
 *     and return the ones that reference it. Used by
 *     /evolution surfaces that want to ask "what does THIS
 *     event correspond to architecturally?"
 *
 * The helpers are pure: no I/O, no DOM, no clock reads. The
 * resolution is a linear scan over both registries (each is
 * < 30 entries); a Map index would be premature.
 *
 * Phase 8 cognition note
 *   These helpers are the load-bearing piece of the user's
 *   "topology MUST already understand temporal systems"
 *   directive. Even though no UI consumes them in 8.1, the
 *   contract is in place so Phase 8.2+ renderers can paint
 *   a node's introduction moment alongside its description
 *   without any further integration work.
 *
 * Edge-safety: pure functions, both registries import without
 * I/O. Safe to load from any runtime.
 */

/**
 * Resolve a node's `evolution_event_ids` into full event
 * objects. Returns an empty array when the node has no
 * cross-links, or when none of the referenced ids exist in
 * the temporal registry. Skips unknown ids silently — a
 * stale reference is honest engineering memory, not a hard
 * error.
 */
export function getEvolutionEventsForNode(
  nodeId: string,
): readonly EvolutionEvent[] {
  const node = getTopologyNodeById(nodeId);
  if (!node) return [];
  const ids = node.evolution_event_ids;
  if (!ids || ids.length === 0) return [];
  const out: EvolutionEvent[] = [];
  for (const id of ids) {
    const event = getEvolutionEventById(id);
    if (event) out.push(event);
  }
  return out;
}

/**
 * Walk the topology registry and return every node that
 * cross-references the given event id. The reverse of
 * `getEvolutionEventsForNode`. Many-to-many: a single event
 * can appear in multiple nodes' lists (e.g. the
 * `v5-perception-foundation` event is referenced by both
 * the `perception-layer` telemetry node and the
 * `v5-phase-6` phase node).
 */
export function getTopologyNodesForEvolutionEvent(
  eventId: string,
): readonly TopologyNode[] {
  if (typeof eventId !== "string" || !eventId) return [];
  const out: TopologyNode[] = [];
  for (const node of getTopologyNodes()) {
    const ids = node.evolution_event_ids;
    if (!ids) continue;
    if (ids.includes(eventId)) out.push(node);
  }
  return out;
}

/**
 * Summary of cross-link health: how many topology nodes carry
 * temporal back-links, how many of those back-links are
 * resolvable. Useful for the future operator dashboard and
 * for the validation-style "is the cross-system fabric
 * intact" check.
 */
export interface TemporalLinkSummary {
  nodesWithEvents: number;
  totalLinks: number;
  resolvedLinks: number;
  staleLinks: number;
}

export function summariseTemporalLinks(): TemporalLinkSummary {
  let nodesWithEvents = 0;
  let totalLinks = 0;
  let resolvedLinks = 0;
  for (const node of getTopologyNodes()) {
    const ids = node.evolution_event_ids;
    if (!ids || ids.length === 0) continue;
    nodesWithEvents++;
    for (const id of ids) {
      totalLinks++;
      if (getEvolutionEventById(id)) resolvedLinks++;
    }
  }
  return {
    nodesWithEvents,
    totalLinks,
    resolvedLinks,
    staleLinks: totalLinks - resolvedLinks,
  };
}

/**
 * Walk the temporal registry and return every event that no
 * topology node currently references. Operator-side signal
 * for "this event happened but the architectural graph
 * doesn't know about it yet" — actionable hint for the next
 * topology editorial pass.
 */
export function getUnlinkedEvolutionEvents(): readonly EvolutionEvent[] {
  const linked = new Set<string>();
  for (const node of getTopologyNodes()) {
    const ids = node.evolution_event_ids;
    if (!ids) continue;
    for (const id of ids) linked.add(id);
  }
  return getEvolutionEvents().filter((e) => !linked.has(e.id));
}
