import { kv } from "@vercel/kv";

/**
 * Cloud Waste Hunter — live metrics for the dashboard + footer
 * counter.
 *
 * Returns four numbers:
 *   paying_customers      LIVE — KV SCARD over cwh:active_subs,
 *                         maintained by /api/lemon-webhook.
 *   total_savings_usd     PROJECTION — until a CWH production
 *   active_scanners       PROJECTION   metrics feed exists, these
 *   lambda_invocations_30d PROJECTION  three carry the same values
 *                                       ProductionMetrics has been
 *                                       showing all along, now
 *                                       honestly labelled.
 *
 * The `projection` field in the response names which keys are NOT
 * live so the client renders a small "projection" pill on those
 * tiles instead of "live data".
 *
 * Runtime: edge. Read-only, no rate limit (the footer LiveCustomer-
 * Counter polls every 60s and ProductionMetrics fetches once on
 * mount — neither is hot enough to need throttling).
 */

export const runtime = "edge";

const ACTIVE_SUBS_KEY = "cwh:active_subs";

interface MetricsResponse {
  paying_customers: number;
  total_savings_usd: number;
  active_scanners: number;
  lambda_invocations_30d: number;
  /** Keys NOT yet sourced from a real-time feed. The client should
   *  badge these as "projection" rather than "live". */
  projection: readonly string[];
}

/* The three projection numbers carry the same values
   ProductionMetrics has been showing since the page was built. They
   stay in sync with what visitors already saw — only the framing
   changes (from "live data integration pending" to "projection"). */
const PROJECTION: Omit<MetricsResponse, "paying_customers" | "projection"> = {
  total_savings_usd: 42500,
  active_scanners: 14,
  lambda_invocations_30d: 1_200_000,
};

const PROJECTION_KEYS: readonly string[] = [
  "total_savings_usd",
  "active_scanners",
  "lambda_invocations_30d",
];

const hasKv = Boolean(
  process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN,
);

export async function GET() {
  let payingCustomers = 0;
  if (hasKv) {
    try {
      const count = (await kv.scard(ACTIVE_SUBS_KEY)) as number;
      payingCustomers = typeof count === "number" ? count : 0;
    } catch {
      // KV blip — fall back to 0 rather than 5xx. Counter is
      // decorative; the dashboard renders "no live customers" cleanly.
      payingCustomers = 0;
    }
  }

  const body: MetricsResponse = {
    paying_customers: payingCustomers,
    ...PROJECTION,
    projection: PROJECTION_KEYS,
  };

  return Response.json(body, {
    headers: { "Cache-Control": "no-store" },
  });
}
