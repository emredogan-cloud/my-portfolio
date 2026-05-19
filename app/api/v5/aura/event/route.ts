import {
  isAuraAdoptionEvent,
  recordAuraEvent,
} from "@/lib/v5/aura/telemetry";

/**
 * V5 Phase 8 Sub-PR 8.4 — aura adoption event endpoint.
 *
 * The single edge POST surface for the aura system. Same
 * posture as the Phase 7 + 8.1 temporal/topology endpoints:
 *
 *   - JSON body parses to `{ kind }`.
 *   - `kind` is one of the four allow-listed values in
 *     `AURA_ADOPTION_EVENTS`.
 *   - Edge runtime.
 *   - Always returns 204.
 *   - No consent gate (aura signals are derived from page +
 *     time-of-day; no per-visitor data on the persisted
 *     path).
 *
 * The AuraProvider (when eventually mounted) fires `mounted`
 * + the temperature-bucket events + the time-modulation
 * event from the client. 8.4 itself ships no consumer; the
 * endpoint is the contract a future mount will use.
 */

export const runtime = "edge";

interface AuraPayload {
  kind?: unknown;
}

function noContent() {
  return new Response(null, {
    status: 204,
    headers: { "Cache-Control": "no-store" },
  });
}

export async function POST(req: Request) {
  let body: AuraPayload;
  try {
    body = (await req.json()) as AuraPayload;
  } catch {
    return noContent();
  }
  if (!isAuraAdoptionEvent(body.kind)) {
    return noContent();
  }
  void recordAuraEvent(body.kind);
  return noContent();
}

export function GET() {
  return new Response(null, {
    status: 405,
    headers: { Allow: "POST", "Cache-Control": "no-store" },
  });
}
