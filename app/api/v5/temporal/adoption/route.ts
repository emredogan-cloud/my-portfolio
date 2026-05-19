import {
  isTemporalAdoptionEvent,
  recordTemporalEvent,
} from "@/lib/v5/temporal/telemetry";

/**
 * V5 Phase 7 Sub-PR 7.1 — temporal adoption event endpoint.
 *
 * The single edge POST surface for the temporal layer's
 * surface-specific signal. The page-level visit counter lives
 * on the V4 telemetry surface (`v5:telemetry:evolution-page:visits`)
 * via the existing `VisitPing` primitive. This endpoint captures
 * the FILTER + DEEP-LINK signal — `category_view` when a category
 * filter is applied via the URL, `event_view` when a deep-link
 * hash is followed — both of which the operator wants to see
 * separately from raw visits.
 *
 * Gate hierarchy
 *   1. JSON body parses to `{ kind }`.
 *   2. `kind` is one of the three allow-listed values in
 *      `TEMPORAL_ADOPTION_EVENTS`.
 *
 * What this endpoint does NOT do:
 *   - It does NOT gate on any consent cookie. The temporal
 *     layer is a public archive — there is no per-visitor data
 *     in any of the three counters. The contract symmetric with
 *     the V4 dashboard counters: aggregate-only, no identifier
 *     ever minted.
 *   - It does NOT read IP, User-Agent, or any header beyond
 *     what Vercel logs at the platform. The endpoint receives
 *     `{ kind }` and increments one hash field by one.
 *   - It does NOT accept GET. Prevents prefetch / link-scanner
 *     traffic from incrementing the counter.
 *
 * Always returns 204 No Content — a misbehaving client never
 * blows up the page with a CORS / 4xx pill.
 */

export const runtime = "edge";

interface AdoptionPayload {
  kind?: unknown;
}

function noContent() {
  return new Response(null, {
    status: 204,
    headers: { "Cache-Control": "no-store" },
  });
}

export async function POST(req: Request) {
  let body: AdoptionPayload;
  try {
    body = (await req.json()) as AdoptionPayload;
  } catch {
    return noContent();
  }
  if (!isTemporalAdoptionEvent(body.kind)) {
    return noContent();
  }
  /* Fire-and-forget HINCRBY. The helper itself swallows every
   * error path so this `void` never throws. */
  void recordTemporalEvent(body.kind);
  return noContent();
}

export function GET() {
  return new Response(null, {
    status: 405,
    headers: { Allow: "POST", "Cache-Control": "no-store" },
  });
}
