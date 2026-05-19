import {
  incrementMetric,
  METRIC_KEYS,
  type MetricKey,
} from "@/lib/telemetry/metrics";

/**
 * Visit-counter endpoint.
 *
 * V4 Phase 1 — Sub-PR 1.5. Closes the visit-telemetry deferrals
 * documented in the Sub-PR 1.2 and 1.4 reports (V4 § 5.1.2 and
 * § 5.1.4 self-referential `*:visits` metrics).
 *
 * Why a separate endpoint from `/api/telemetry/[metric]`:
 *   - The `[metric]` route is **read-only** and Vercel-edge-cached
 *     under `Cache-Control: s-maxage=300`. Allowing writes there
 *     would either need cache-busting (defeating the cache) or a
 *     route-level POST handler — both more complex than just a
 *     focused write-only sibling.
 *   - This endpoint **must NOT cache**: every visit needs to land.
 *
 * Posture:
 *   - Edge runtime. Fast path; one KV incrby.
 *   - POST-only. GET returns `405` to discourage prefetch / clicks
 *     from accidentally incrementing.
 *   - Surface allow-list — anonymous callers can't poison arbitrary
 *     keys; only the two whitelisted slugs map to KV writes.
 *   - Always returns `204 No Content` so a misbehaving client island
 *     never blows up the page with a CORS / error pill.
 */

export const runtime = "edge";

const SURFACE_TO_KEY: Record<string, MetricKey> = {
  telemetry: METRIC_KEYS.TELEMETRY_VISITS,
  changelog: METRIC_KEYS.CHANGELOG_VISITS,
  /* Sub-PR 2.5 — notes 2.0 adoption signals. The naming
   * keeps the `surface` semantically close to the metric:
   * `notes-audio-play` fires from AudioPlayer.onPlay;
   * `notes-diagram-interaction` fires from InteractiveDiagram
   * on first node interaction. */
  "notes-audio-play": METRIC_KEYS.NOTES_AUDIO_PLAYS,
  "notes-diagram-interaction": METRIC_KEYS.NOTES_DIAGRAM_INTERACTIONS,
  /* Sub-PR 4.1 — Public Lumina Transparency Layer (V4 § 2.3).
   * Same shape as `telemetry` / `changelog` — cumulative visit
   * counts on the two new public meta-pages. */
  "lumina-brain": METRIC_KEYS.LUMINA_BRAIN_VISITS,
  "lumina-failures": METRIC_KEYS.LUMINA_FAILURES_VISITS,
  /* Sub-PR 5.1 — experimental playground foundation. Even an
   * empty playground deserves a visit counter — the lack of
   * traffic is itself a signal about whether experiments earn
   * their slot. */
  playground: METRIC_KEYS.PLAYGROUND_VISITS,
  /* V5 Phase 6 Sub-PR 6.1 — public transparency page for the
   * perception layer. The page documents the opt-in contract;
   * the visit counter is the only signal it collects (consent
   * is what unlocks any v5:perception:* writes). */
  "v5-perception": METRIC_KEYS.V5_PERCEPTION_PAGE_VISITS,
  /* V5 Phase 7 Sub-PR 7.1 — public engineering memory archive.
   * The /evolution surface renders the temporal event registry;
   * the visit count is the V4-level signal symmetric with
   * /telemetry and /changelog. Surface-specific filter +
   * deep-link signal lives separately at v5:temporal:adoption. */
  evolution: METRIC_KEYS.EVOLUTION_PAGE_VISITS,
  /* V5 Phase 8 Sub-PR 8.3 — public engineering-cognition
   * surface. /v5/topology/<slug> renders the project subgraph
   * via the Phase 8.2 renderer chassis. The scalar visit
   * counter sits alongside the Phase 8.1 v5:topology:graph
   * hash; the two carry different signals (V4-style cumulative
   * vs V5 event-kind aggregate). */
  topology: METRIC_KEYS.TOPOLOGY_PAGE_VISITS,
  /* V5 Phase 9 Sub-PR 9.2 — operational twin surface.
   * /v5/operating renders the composed snapshot from Phase 9.1's
   * data layer. Scalar visit counter; the per-section inspection
   * hash lives at v5:operating:adoption (Phase 9.1). */
  operating: METRIC_KEYS.OPERATING_PAGE_VISITS,
};

interface VisitPayload {
  surface?: string;
}

export async function POST(req: Request) {
  let surface: string | undefined;
  try {
    const body = (await req.json()) as VisitPayload;
    surface = body?.surface;
  } catch {
    /* JSON parse failure — fall through; surface stays undefined */
  }

  if (typeof surface !== "string" || !surface) {
    return new Response(null, {
      status: 204,
      headers: { "Cache-Control": "no-store" },
    });
  }

  const key = SURFACE_TO_KEY[surface];
  if (!key) {
    return new Response(null, {
      status: 204,
      headers: { "Cache-Control": "no-store" },
    });
  }

  /* Fire-and-forget write. incrementMetric is itself a graceful
   * no-op when KV is unavailable. */
  void incrementMetric(key);

  return new Response(null, {
    status: 204,
    headers: { "Cache-Control": "no-store" },
  });
}

export function GET() {
  return new Response(null, {
    status: 405,
    headers: { Allow: "POST", "Cache-Control": "no-store" },
  });
}
