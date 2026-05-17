import { kv } from "@vercel/kv";

/**
 * Lab experiment guards — per-IP rate limit + per-day cost cap.
 *
 * V4 Phase 2 — Sub-PR 2.1.
 *
 * Each lab experiment that calls Bedrock through this module gets
 * two layers of defence:
 *
 *   1. **Per-IP rate limit** — 5 requests per IP per rolling hour.
 *      Stops a single visitor from monopolising the sandbox while
 *      keeping the surface usable for genuine "try once" curiosity.
 *      Mirrors the existing /api/cwh-demo pattern, just keyed under
 *      the lab's own namespace so the two surfaces don't share
 *      buckets.
 *
 *   2. **Per-day cost cap** — when the cumulative estimated cost
 *      for an experiment crosses the configured ceiling (default $5),
 *      the route refuses new calls until the daily window rolls.
 *      The cost is *estimated*, not metered — Bedrock per-call cost
 *      varies with response token count, so we increment by a
 *      conservative fixed estimate per successful streaming call.
 *      Refining to true response.usage-based metering is a Sub-PR
 *      2.5 or later concern.
 *
 * Graceful no-op contract: when KV is unavailable, both guards
 * return "ok" — better to let a few requests through during a KV
 * outage than to refuse every request and look broken. The
 * production deploy never runs without KV; dev/local does.
 *
 * Both functions are *namespaced by experiment slug* so a noisy
 * IAM translator doesn't disable the prompt rescuer. Each
 * experiment's rate limit + cost cap is independent.
 */

const RL_KEY_PREFIX = "v4:lab:rate:";
const COST_KEY_PREFIX = "v4:cost:lab:";
const RL_WINDOW_SECONDS = 60 * 60; // 1 hour
const RL_MAX_PER_WINDOW = 5;
const COST_TTL_SECONDS = 36 * 60 * 60; // 36 hours — well past one UTC day
const DEFAULT_DAILY_CAP_USD = 5;

const hasKv = Boolean(
  process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN,
);

export interface RateLimitResult {
  status: "ok" | "blocked";
  /** Current count within the window (1-based for the request that
   *  was just consumed, or the existing count when blocked). */
  count: number;
  limit: number;
  window_seconds: number;
}

export interface CostCapResult {
  status: "ok" | "capped";
  /** Cumulative estimated cost for the experiment today, in USD. */
  current_usd: number;
  cap_usd: number;
}

/**
 * Extract the visitor IP from Vercel's request headers. Same
 * resolution order as /api/cwh-demo's `getClientIp` — `x-real-ip`
 * first, then the first hop in `x-forwarded-for`, then "anonymous"
 * as a coarse bucket. Anonymous traffic shares one bucket; that's
 * acceptable for the rate-limit role (it ratchets down obvious
 * floods without being precisely fair).
 */
export function getClientIp(req: Request): string {
  const real = req.headers.get("x-real-ip");
  if (real) return real;
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0]?.trim() ?? "anonymous";
  return "anonymous";
}

/**
 * Consume one slot from the per-IP, per-experiment rate-limit
 * bucket. Returns `ok` when under the limit, `blocked` when at or
 * above it.
 *
 * `maxPerWindow` is optional and defaults to 5 — the IAM
 * translator + prompt rescuer use the default. Sub-PR 2.3
 * (Commit Narrator) passes 3 because each call hits both the
 * GitHub API and Bedrock with a larger context, so the per-IP
 * ceiling is more conservative.
 */
export async function consumeRateLimit(
  experimentSlug: string,
  ip: string,
  maxPerWindow: number = RL_MAX_PER_WINDOW,
): Promise<RateLimitResult> {
  if (!hasKv) {
    return {
      status: "ok",
      count: 0,
      limit: maxPerWindow,
      window_seconds: RL_WINDOW_SECONDS,
    };
  }
  const key = `${RL_KEY_PREFIX}${experimentSlug}:${ip}`;
  try {
    const count = (await kv.incr(key)) as number;
    if (count === 1) {
      await kv.expire(key, RL_WINDOW_SECONDS);
    }
    return {
      status: count > maxPerWindow ? "blocked" : "ok",
      count,
      limit: maxPerWindow,
      window_seconds: RL_WINDOW_SECONDS,
    };
  } catch {
    return {
      status: "ok",
      count: 0,
      limit: maxPerWindow,
      window_seconds: RL_WINDOW_SECONDS,
    };
  }
}

/**
 * Check whether the experiment's per-day cost cap has been
 * reached. Read-only — does NOT increment. Call this *before* the
 * Bedrock invocation so a capped experiment can short-circuit
 * with a 503 cleanly.
 */
export async function checkCostCap(
  experimentSlug: string,
  capUsd: number = DEFAULT_DAILY_CAP_USD,
): Promise<CostCapResult> {
  if (!hasKv) {
    return { status: "ok", current_usd: 0, cap_usd: capUsd };
  }
  const key = `${COST_KEY_PREFIX}${experimentSlug}:usd_daily`;
  try {
    const current = (await kv.get<number>(key)) ?? 0;
    const currentNumeric =
      typeof current === "number" ? current : Number(current) || 0;
    return {
      status: currentNumeric >= capUsd ? "capped" : "ok",
      current_usd: currentNumeric,
      cap_usd: capUsd,
    };
  } catch {
    return { status: "ok", current_usd: 0, cap_usd: capUsd };
  }
}

/**
 * Record an estimated cost increment for an experiment. Called
 * *after* a successful Bedrock streaming response.
 *
 * Implementation note on the get + add + set sequence: @vercel/kv
 * (Upstash REST) exposes `incrbyfloat`, but its return value is a
 * string in some SDK versions; the get+set path keeps the numeric
 * type clean. The race window between concurrent calls produces at
 * most a few-cent overshoot of the cap — acceptable given the cap
 * is a soft economic ceiling, not a hard accounting boundary.
 */
export async function recordEstimatedCost(
  experimentSlug: string,
  usd: number,
): Promise<void> {
  if (!hasKv) return;
  if (!Number.isFinite(usd) || usd <= 0) return;
  const key = `${COST_KEY_PREFIX}${experimentSlug}:usd_daily`;
  try {
    const prior = (await kv.get<number>(key)) ?? 0;
    const priorNumeric =
      typeof prior === "number" ? prior : Number(prior) || 0;
    const next = priorNumeric + usd;
    await kv.set(key, next, { ex: COST_TTL_SECONDS });
    /* Pair `${key}:updated_at` write so readMetric (counter case)
     * shows an honest "X ago" on the /telemetry tile. Without this
     * the tile would always render "0s ago" since readMetric falls
     * back to current time when the sibling is missing. */
    await kv.set(`${key}:updated_at`, new Date().toISOString(), {
      ex: COST_TTL_SECONDS,
    });
  } catch {
    /* swallow — cost tracking never blocks the response */
  }
}
