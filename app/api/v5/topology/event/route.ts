import {
  isTopologyAdoptionEvent,
  recordTopologyEvent,
} from "@/lib/v5/topology/telemetry";

/**
 * V5 Phase 8 Sub-PR 8.1 — topology adoption event endpoint.
 *
 * Sibling of `/api/v5/temporal/adoption` (Phase 7.1),
 * `/api/v5/temporal/playback` (Phase 7.2),
 * `/api/v5/temporal/timeline` (Phase 7.3 / 7.4). Different
 * registry, different vocabulary:
 *
 *   - 7.1 `/temporal/adoption`  → temporal page-level reach
 *     (view / category_view / event_view)
 *   - 7.2 `/temporal/playback`  → controller verbs
 *     (seek / scrub / play / pause / step)
 *   - 7.3 `/temporal/timeline`  → SLIDER lifecycle
 *     (mounted / engaged, plus the per-project context
 *     extension from 7.4)
 *   - 8.1 `/topology/event`     → TOPOLOGY adoption
 *     (view / node_inspect / relationship_traverse /
 *      path_query). The contract a future Phase 8.2+ renderer
 *     will fire through.
 *
 * Gate hierarchy
 *   1. JSON body parses to `{ kind }`.
 *   2. `kind` is one of the four allow-listed values in
 *      `TOPOLOGY_ADOPTION_EVENTS`.
 *
 * Same posture as the rest of the temporal endpoints:
 *   - No consent gate (public-archive content; no per-visitor
 *     data on the persisted path).
 *   - No IP / UA / cookie reads.
 *   - Edge runtime.
 *   - Always returns 204.
 *
 * Foundation-stage contract — Sub-PR 8.1 ships NO renderer
 * that fires events. The endpoint exists so Phase 8.2+ can
 * wire into it without amending the schema. A misbehaving
 * caller today simply increments hashes that no UI surfaces;
 * the operator's KV cost is bounded by the request rate.
 */

export const runtime = "edge";

interface TopologyEventPayload {
  kind?: unknown;
}

function noContent() {
  return new Response(null, {
    status: 204,
    headers: { "Cache-Control": "no-store" },
  });
}

export async function POST(req: Request) {
  let body: TopologyEventPayload;
  try {
    body = (await req.json()) as TopologyEventPayload;
  } catch {
    return noContent();
  }
  if (!isTopologyAdoptionEvent(body.kind)) {
    return noContent();
  }
  /* Fire-and-forget HINCRBY. The helper itself swallows every
   * error path so this `void` never throws. */
  void recordTopologyEvent(body.kind);
  return noContent();
}

export function GET() {
  return new Response(null, {
    status: 405,
    headers: { Allow: "POST", "Cache-Control": "no-store" },
  });
}
