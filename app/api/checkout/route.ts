import { kv } from "@vercel/kv";

/**
 * CWH Pro checkout → Lemon Squeezy permalink.
 *
 * Client POSTs { tier: "plus" | "pro" } from the /pro pricing card.
 * We read the matching LEMON_SQUEEZY_{TIER}_CHECKOUT_URL env var
 * (the Buy Now permalink configured in the LS dashboard) and
 * return it. Client redirects with window.location.assign(url).
 *
 * Why permalinks instead of the LS Checkouts API:
 *   - No SDK to install, no API key on the hot path.
 *   - One env-var edit swaps to a new variant without redeploy.
 *   - Lemon Squeezy permalinks are already personalised per visitor
 *     once they land — we don't need to attach metadata here.
 *
 * Posture matches /api/cwh-demo + /api/voice/*: edge runtime, KV
 * rate-limit (20/IP/hr), 503 when env is missing.
 */

export const runtime = "edge";

const RATE_LIMIT_MAX = 20;
const RATE_LIMIT_WINDOW_SECONDS = 3600;

const ALLOWED_TIERS = new Set(["plus", "pro"]);

const hasKv = Boolean(
  process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN,
);

function jsonError(error: string, status: number, extra?: Record<string, unknown>) {
  return new Response(
    JSON.stringify({ error, ...(extra ?? {}) }),
    { status, headers: { "Content-Type": "application/json" } },
  );
}

function getClientIp(req: Request): string {
  const real = req.headers.get("x-real-ip");
  if (real) return real;
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0]?.trim() ?? "anonymous";
  return "anonymous";
}

async function consumeRateLimit(ip: string): Promise<"ok" | "blocked"> {
  if (!hasKv) return "ok";
  const key = `checkout:rl:${ip}`;
  const count = (await kv.incr(key)) as number;
  if (count === 1) await kv.expire(key, RATE_LIMIT_WINDOW_SECONDS);
  return count > RATE_LIMIT_MAX ? "blocked" : "ok";
}

function checkoutUrlForTier(tier: string): string | null {
  if (tier === "plus") {
    return process.env.LEMON_SQUEEZY_PLUS_CHECKOUT_URL ?? null;
  }
  if (tier === "pro") {
    return process.env.LEMON_SQUEEZY_PRO_CHECKOUT_URL ?? null;
  }
  return null;
}

export async function POST(req: Request) {
  let body: { tier?: unknown };
  try {
    body = (await req.json()) as { tier?: unknown };
  } catch {
    return jsonError("invalid-json", 400);
  }

  const tier = typeof body.tier === "string" ? body.tier : "";
  if (!ALLOWED_TIERS.has(tier)) {
    return jsonError("invalid-tier", 400, { allowed: Array.from(ALLOWED_TIERS) });
  }

  const ip = getClientIp(req);
  if ((await consumeRateLimit(ip)) === "blocked") {
    return jsonError("rate-limited", 429, {
      limit: RATE_LIMIT_MAX,
      window_seconds: RATE_LIMIT_WINDOW_SECONDS,
    });
  }

  const url = checkoutUrlForTier(tier);
  if (!url || !url.startsWith("https://")) {
    // Either env var is missing or has a non-https value. Either way,
    // the public-facing message is "billing offline" — the widget
    // should fall back to the email-Emre affordance.
    return jsonError("billing-offline", 503);
  }

  return Response.json(
    { url, tier },
    { headers: { "Cache-Control": "no-store" } },
  );
}
