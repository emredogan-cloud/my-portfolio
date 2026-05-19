import {
  isPerceptionCategory,
  PERCEPTION_CATEGORIES,
  type PerceptionCategory,
} from "@/lib/v5/perception/buckets";

import { getTopologyNodes, getTopologyNodeById } from "./registry";
import type { TopologyNode } from "./schema";

/**
 * V5 Phase 8 Sub-PR 8.1 — topology ↔ perception cross-system
 * binding.
 *
 * The perception layer (Phase 6) carries the WHAT IS OBSERVED.
 * The topology registry carries the WHAT EXISTS. A
 * `telemetry`-kind topology node typically lists the perception
 * categories it covers; other node kinds may cross-link to one
 * or two specific categories they emit signal for.
 *
 * This module ships the helpers that resolve those
 * cross-references in BOTH directions:
 *
 *   - `getPerceptionCategoriesForNode(nodeId)` — given a node,
 *     return the perception categories it claims to observe.
 *     Filters out any unknown categories silently.
 *   - `getTopologyNodesUsingCategory(category)` — given a
 *     category, walk every node in the topology registry and
 *     return the ones that reference it. Used to answer
 *     "what surfaces feed into the perception:dwell-time
 *     bucket?"
 *
 * The helpers are pure data + pure functions. Like the
 * temporal-link helpers, the resolution is a linear scan
 * over a small registry.
 *
 * Phase 8 cognition note
 *   These bindings turn the topology graph into a SECOND
 *   index over the perception schema. The perception
 *   buckets.ts file still owns the closed allow-list;
 *   topology nodes are merely consumers. The two registries
 *   stay independently rewritable without coupling.
 *
 * Edge-safety: pure imports, no I/O, no DOM, no
 * `process.env`.
 */

/**
 * Resolve a node's `perception_categories` array into the
 * closed-allow-list categories. Unknown categories drop
 * silently — a stale category name is honest engineering
 * memory, not a hard error.
 */
export function getPerceptionCategoriesForNode(
  nodeId: string,
): readonly PerceptionCategory[] {
  const node = getTopologyNodeById(nodeId);
  if (!node) return [];
  const cats = node.perception_categories;
  if (!cats || cats.length === 0) return [];
  const out: PerceptionCategory[] = [];
  for (const cat of cats) {
    if (isPerceptionCategory(cat)) out.push(cat);
  }
  return out;
}

/**
 * Walk the topology registry and return every node that
 * references the given perception category. Many-to-many:
 * a single category can be observed by multiple nodes (the
 * perception-layer node owns all eight categories; a future
 * project node could also reference a subset).
 */
export function getTopologyNodesUsingCategory(
  category: string,
): readonly TopologyNode[] {
  if (!isPerceptionCategory(category)) return [];
  const out: TopologyNode[] = [];
  for (const node of getTopologyNodes()) {
    const cats = node.perception_categories;
    if (!cats) continue;
    if (cats.includes(category)) out.push(node);
  }
  return out;
}

/**
 * Summary of perception cross-link health, mirroring the
 * temporal-link summary.
 */
export interface PerceptionLinkSummary {
  nodesWithCategories: number;
  totalLinks: number;
  resolvedLinks: number;
  staleLinks: number;
}

export function summarisePerceptionLinks(): PerceptionLinkSummary {
  let nodesWithCategories = 0;
  let totalLinks = 0;
  let resolvedLinks = 0;
  for (const node of getTopologyNodes()) {
    const cats = node.perception_categories;
    if (!cats || cats.length === 0) continue;
    nodesWithCategories++;
    for (const cat of cats) {
      totalLinks++;
      if (isPerceptionCategory(cat)) resolvedLinks++;
    }
  }
  return {
    nodesWithCategories,
    totalLinks,
    resolvedLinks,
    staleLinks: totalLinks - resolvedLinks,
  };
}

/**
 * Walk the perception allow-list and return every category
 * that no topology node currently references. Symmetric with
 * `getUnlinkedEvolutionEvents` from temporal-link — operator
 * hint for the next topology editorial pass.
 */
export function getUnlinkedPerceptionCategories(): readonly PerceptionCategory[] {
  const linked = new Set<string>();
  for (const node of getTopologyNodes()) {
    const cats = node.perception_categories;
    if (!cats) continue;
    for (const cat of cats) linked.add(cat);
  }
  return PERCEPTION_CATEGORIES.filter((c) => !linked.has(c));
}
