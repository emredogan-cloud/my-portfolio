import {
  isAmbientAdoptionEvent,
  recordAmbientEvent,
} from "@/lib/v5/ambient/telemetry";
import { isAmbientEnabled } from "@/lib/v5/ambient/flags";

/**
 * V5 Phase 10 Sub-PR 10.1 — ambient adoption event endpoint.
 *
 * Same posture as every other V5 adoption endpoint since
 * Phase 6.4:
 *
 *   - Edge runtime.
 *   - POST JSON body `{ kind: AmbientAdoptionEvent }`.
 *   - `kind` validated against the closed allow-list from
 *     telemetry.ts.
 *   - Always returns 204 (silent on invalid kinds / malformed
 *     JSON / KV unavailable). Telemetry never blocks.
 *
 * Flag gate
 *   When `V5_AMBIENT_ENABLED` is OFF, the endpoint still
 *   returns 204 (it's a fire-and-forget interface; no
 *   client cares about the response code), but the
 *   underlying `recordAmbientEvent` helper no-ops because
 *   its own flag check kicks in. This matches the
 *   /api/v5/perception/event posture — endpoint exists at
 *   any flag state; recording is gated internally.
 *
 *   We retain an explicit `isAmbientEnabled` short-circuit
 *   here too as defense-in-depth: if the helper's gate
 *   contract changes, the endpoint still respects the flag.
 *
 * No consumer in 10.1
 *   The endpoint is foundation; no client surface fires
 *   events to it in 10.1. Future ambient consumers
 *   (10.2+) will fire their own kinds when ambient
 *   adaptation behavior is added. Reserving the endpoint
 *   now keeps the contract stable.
 *
 * Privacy posture
 *   No identifier in body (kind enum only). No IP
 *   capture. No User-Agent capture. Aggregate-only
 *   HINCRBY at the helper.
 *
 * Edge-safety: edge-safe @vercel/kv usage in the helper.
 */

export const runtime = "edge";

interface AmbientEventPayload {
  kind?: unknown;
}

function noContent(): Response {
  return new Response(null, {
    status: 204,
    headers: { "Cache-Control": "no-store" },
  });
}

export async function POST(req: Request) {
  if (!isAmbientEnabled()) {
    return noContent();
  }

  let body: AmbientEventPayload;
  try {
    body = (await req.json()) as AmbientEventPayload;
  } catch {
    return noContent();
  }

  if (!isAmbientAdoptionEvent(body.kind)) {
    return noContent();
  }

  void recordAmbientEvent(body.kind);
  return noContent();
}

export function GET() {
  return new Response(null, {
    status: 405,
    headers: { Allow: "POST", "Cache-Control": "no-store" },
  });
}
