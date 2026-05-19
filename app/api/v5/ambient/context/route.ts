import { isAmbientEnabled } from "@/lib/v5/ambient/flags";
import { composeAmbientContext } from "@/lib/v5/ambient/registry";
import { recordAmbientEvent } from "@/lib/v5/ambient/telemetry";

/**
 * V5 Phase 10 Sub-PR 10.1 — ambient context JSON feed.
 *
 * Single-purpose edge GET. Composes the current
 * `AmbientContext` snapshot via the registry, serialises to
 * JSON, returns with CDN caching headers.
 *
 * Flag gate
 *   `isAmbientEnabled()` (V5_AMBIENT_ENABLED) gates the
 *   endpoint. When OFF the route returns 404 — same dark-
 *   launch pattern as every prior V5 endpoint.
 *
 * Caching
 *   `public, s-maxage=300, stale-while-revalidate=3600`.
 *   Mirrors the Phase 9.4 OG card cache header. Fresh
 *   enough for any future ambient consumer that polls + a
 *   1h SWR window absorbs the cost of background
 *   regeneration.
 *
 * Telemetry
 *   Fires `context_endpoint_view` on 200. The composer
 *   itself fires `context_composed` + per-domain events.
 *
 * Why a JSON feed exists in 10.1
 *   - V5 § 2.3 transparency law: "every V5 surface
 *     publishes its structure". The ambient context
 *     contract is more honest as a JSON feed than as a
 *     hidden internal call.
 *   - Future ambient consumers (10.2+) may want to read
 *     from edge / Lambda / external scripts; the JSON feed
 *     gives them a stable contract without bundling the
 *     registry.
 *   - Operators reading the feed in dev get a quick view
 *     of what context their ecosystem currently surfaces.
 *
 * Privacy posture
 *   The composed context is aggregate-only per the
 *   schema's contract. Serving it publicly does not leak
 *   any per-visitor data because there is no per-visitor
 *   data in the shape.
 *
 * Edge-safety: every imported function is edge-safe per the
 * underlying source's verification.
 */

export const runtime = "edge";

function notFoundResponse(): Response {
  return new Response(null, {
    status: 404,
    headers: { "Cache-Control": "no-store" },
  });
}

export async function GET() {
  if (!isAmbientEnabled()) {
    return notFoundResponse();
  }

  const context = await composeAmbientContext();
  void recordAmbientEvent("context_endpoint_view");

  return new Response(JSON.stringify(context), {
    status: 200,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control":
        "public, s-maxage=300, stale-while-revalidate=3600",
    },
  });
}

export function POST() {
  return new Response(null, {
    status: 405,
    headers: { Allow: "GET", "Cache-Control": "no-store" },
  });
}
