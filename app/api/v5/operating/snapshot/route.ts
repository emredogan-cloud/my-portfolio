import { composeOperationalSnapshot } from "@/lib/v5/operating/snapshot";

/**
 * V5 Phase 9 Sub-PR 9.1 — operational twin snapshot endpoint.
 *
 * Read-only GET surface over the composed
 * `OperationalSnapshot`. Future Phase 9.2+ consumers
 * (the `/v5/operating` page Server Component, the future
 * Phase 9.4 OG card generator) read this endpoint OR import
 * `composeOperationalSnapshot` directly. The endpoint exists
 * as the external contract — any operator dashboard tool, RSS
 * generator, or third-party reader consumes the same JSON
 * the internal renderer would.
 *
 * Cache contract per V5 future § 3.1
 *
 *   > ISR 1h. Real-time poll yasak.
 *
 * Cache headers: `public, s-maxage=3600,
 * stale-while-revalidate=86400`. CDN serves the cached JSON
 * for an hour + revalidates in the background. The composer
 * makes one GitHub API call + N KV reads per cold cache; with
 * one hit per hour the GitHub anonymous rate-limit (60/hr) is
 * far from threatened.
 *
 * Edge runtime so the CDN can serve the response close to the
 * visitor without round-tripping to a single region.
 *
 * What this endpoint does NOT do
 *   - It does NOT accept POST. The snapshot is read-only;
 *     write events go through `/api/v5/operating/event`.
 *   - It does NOT read cookies / IP / User-Agent. Same
 *     response for every caller (sometimes hours apart due
 *     to the CDN).
 *   - It does NOT fire any telemetry. Adoption telemetry
 *     fires when a future renderer mounts; this endpoint is
 *     a pure data feed.
 */

export const runtime = "edge";

const JSON_HEADERS = {
  "Content-Type": "application/json; charset=utf-8",
  "Cache-Control":
    "public, s-maxage=3600, stale-while-revalidate=86400",
};

export async function GET() {
  const snapshot = await composeOperationalSnapshot();
  return new Response(JSON.stringify(snapshot), {
    status: 200,
    headers: JSON_HEADERS,
  });
}

export function POST() {
  return new Response(null, {
    status: 405,
    headers: { Allow: "GET", "Cache-Control": "no-store" },
  });
}
