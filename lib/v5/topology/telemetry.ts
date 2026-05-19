import { kv } from "@vercel/kv";

/**
 * V5 Phase 8 Sub-PR 8.1 — topology adoption counters.
 *
 * V5 § 2.13 prescribes the key shape
 *   v5:topology:<surface>:<metric>:<bucket>
 *
 * Following the convention from prior Phase 6 + Phase 7
 * sub-PRs (long-form V5 slot maps to a 2-segment hash for
 * endpoint-reuse consistency), 8.1's telemetry foundation
 * lives at:
 *
 *   v5:topology:graph  → hash {
 *     view                   : a renderer rendered the topology
 *                              into the DOM (foundation-stage
 *                              client mount signal)
 *     node_inspect           : a visitor focused / clicked a
 *                              single node
 *     relationship_traverse  : a visitor traversed an edge
 *                              (clicked through from one node
 *                              to a neighbor)
 *     path_query             : the visitor (or a future Lumina
 *                              tool) asked "how does A connect
 *                              to B"
 *   }
 *
 * Why four event kinds
 *   - `view`           — minimum signal that someone reached
 *     the renderer at all. Foundation-stage: even with no
 *     renderer in 8.1, the slot is named so 8.2+ can fire
 *     through it without amending the schema.
 *   - `node_inspect`   — focused engagement with a SINGLE
 *     node. Lets the operator see which topology entities
 *     attract attention.
 *   - `relationship_traverse` — the visitor moved between
 *     nodes via an edge. The signal that distinguishes
 *     "skim" from "actually understanding the graph".
 *   - `path_query` — a higher-cognition act (Lumina or the
 *     visitor asking the topology to explain itself). Future
 *     wiring; the slot is reserved.
 *
 * Same posture as every other V5 adoption hash (Phase 6.4
 * memory, Phase 7.1 temporal, Phase 7.2 playback, Phase 7.3
 * timeline, Phase 7.4 architecture-engagement):
 *   - Single HASH, atomic HINCRBY per event.
 *   - Graceful no-op when KV is unavailable.
 *   - Fire-and-forget at the call site; errors swallow.
 *
 * Privacy posture
 *   - Aggregate-only. Counters by event kind, never per-
 *     visitor. No identifier field exists on the persisted
 *     path.
 *   - No consent gate (symmetric with the temporal layer):
 *     the topology graph is public-archive content; the
 *     adoption signal carries no per-visitor data.
 */

export const TOPOLOGY_ADOPTION_HASH_KEY = "v5:topology:graph";

export const TOPOLOGY_ADOPTION_EVENTS = [
  "view",
  "node_inspect",
  "relationship_traverse",
  "path_query",
] as const;

export type TopologyAdoptionEvent =
  (typeof TOPOLOGY_ADOPTION_EVENTS)[number];

const KNOWN_EVENTS: ReadonlySet<TopologyAdoptionEvent> = new Set(
  TOPOLOGY_ADOPTION_EVENTS,
);

export function isTopologyAdoptionEvent(
  value: unknown,
): value is TopologyAdoptionEvent {
  return (
    typeof value === "string" &&
    KNOWN_EVENTS.has(value as TopologyAdoptionEvent)
  );
}

const hasKv = Boolean(
  process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN,
);

/** Increment one topology-adoption counter. Fire-and-forget;
 *  the helper is async only because @vercel/kv is. Swallows
 *  every error path. */
export async function recordTopologyEvent(
  kind: TopologyAdoptionEvent,
): Promise<void> {
  if (!hasKv) return;
  if (!isTopologyAdoptionEvent(kind)) return;
  try {
    await kv.hincrby(TOPOLOGY_ADOPTION_HASH_KEY, kind, 1);
  } catch {
    /* swallow — topology telemetry is decorative */
  }
}

/** Read the entire adoption hash. Returns an empty object on
 *  KV unavailable / hash never written / read error. Same
 *  shape as the rest of the V5 adoption hashes. */
export async function readTopologyAdoption(): Promise<
  Record<string, number>
> {
  if (!hasKv) return {};
  try {
    const stored = await kv.hgetall<Record<string, number | string>>(
      TOPOLOGY_ADOPTION_HASH_KEY,
    );
    if (!stored || typeof stored !== "object") return {};
    const out: Record<string, number> = {};
    for (const [k, v] of Object.entries(stored)) {
      const n = typeof v === "number" ? v : Number(v);
      if (Number.isFinite(n)) out[k] = n;
    }
    return out;
  } catch {
    return {};
  }
}
