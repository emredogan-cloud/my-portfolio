import { kv } from "@vercel/kv";

/**
 * Lemon Squeezy webhook → CWH Pro live customer state.
 *
 * Flow:
 *   LS event fires →
 *   POST here with raw JSON body + X-Signature header →
 *   HMAC SHA-256 verify against LEMON_SQUEEZY_WEBHOOK_SECRET →
 *   route on event_name:
 *     subscription_created  → SADD cwh:active_subs <id>
 *     subscription_expired  → SREM cwh:active_subs <id>
 *     anything else         → 200 {ignored}
 *
 * Why a SET (not INCR/DECR):
 *   SADD/SREM are idempotent — double deliveries from LS (which can
 *   happen on retry) can't double-count a subscriber. SCARD gives
 *   the exact "currently active" number for /api/cwh/live-metrics.
 *
 * subscription_cancelled is intentionally a no-op: the user has
 * cancelled but still has access until period_end. We only drop
 * them when subscription_expired arrives.
 *
 * Runtime: edge — crypto.subtle is native, no Node-only deps.
 * Same hardening posture as /api/github-webhook (Phase 2).
 */

export const runtime = "edge";

const ACTIVE_SUBS_KEY = "cwh:active_subs";

interface LsPayload {
  meta?: {
    event_name?: string;
    custom_data?: Record<string, unknown>;
  };
  data?: {
    id?: string;
    type?: string;
  };
}

function jsonError(error: string, status: number) {
  return new Response(JSON.stringify({ error }), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function hexToBytes(hex: string): Uint8Array | null {
  if (hex.length % 2 !== 0) return null;
  const out = new Uint8Array(hex.length / 2);
  for (let i = 0; i < out.length; i++) {
    const b = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
    if (Number.isNaN(b)) return null;
    out[i] = b;
  }
  return out;
}

async function verifyHmac(
  secret: string,
  body: string,
  signatureHeader: string | null,
): Promise<boolean> {
  if (!signatureHeader) return false;
  // LS sends the bare hex (no "sha256=" prefix), but be lenient.
  const trimmed = signatureHeader.replace(/^sha256=/i, "").trim();
  const expected = hexToBytes(trimmed);
  if (!expected) return false;

  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret) as BufferSource,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["verify"],
  );
  return crypto.subtle.verify(
    "HMAC",
    key,
    expected as BufferSource,
    encoder.encode(body) as BufferSource,
  );
}

const hasKv = Boolean(
  process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN,
);

export async function POST(req: Request) {
  const secret = process.env.LEMON_SQUEEZY_WEBHOOK_SECRET;
  if (!secret) {
    // No secret provisioned — cannot authenticate anything. Return
    // 401 (not 503) so we never leak server-state to an unauth caller.
    return jsonError("unauthorized", 401);
  }

  const raw = await req.text();
  const ok = await verifyHmac(secret, raw, req.headers.get("x-signature"));
  if (!ok) return jsonError("unauthorized", 401);

  let payload: LsPayload;
  try {
    payload = JSON.parse(raw) as LsPayload;
  } catch {
    return jsonError("invalid-json", 400);
  }

  const eventName = payload.meta?.event_name ?? "";
  const subscriptionId = payload.data?.id ?? "";

  // Anything that isn't a subscription_* event with a usable id is an
  // immediate ack-and-discard. LS sends some non-sub events (order_*,
  // license_*) we don't care about for the live counter.
  if (!eventName.startsWith("subscription_") || !subscriptionId) {
    return Response.json({ ignored: eventName || "no-event" });
  }

  if (!hasKv) {
    // Auth passed but KV not provisioned (local dev). Acknowledge
    // honestly so test deliveries from LS still go green.
    return Response.json({ ok: true, event: eventName, persisted: false });
  }

  try {
    if (eventName === "subscription_created") {
      await kv.sadd(ACTIVE_SUBS_KEY, subscriptionId);
    } else if (eventName === "subscription_expired") {
      await kv.srem(ACTIVE_SUBS_KEY, subscriptionId);
    }
    // subscription_cancelled / subscription_resumed / subscription_updated
    // → no state change; the counter only tracks "currently active".
  } catch {
    return jsonError("kv-write-failed", 502);
  }

  return Response.json({
    ok: true,
    event: eventName,
    subscription_id: subscriptionId,
    persisted: true,
  });
}
