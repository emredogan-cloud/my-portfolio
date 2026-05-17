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
