import {
  isOperatingAdoptionEvent,
  recordOperatingEvent,
} from "@/lib/v5/operating/telemetry";

/**
 * V5 Phase 9 Sub-PR 9.1 — operational twin adoption endpoint.
 *
 * Same posture as every other Phase 7 + 8 endpoint:
 *
 *   - JSON body parses to `{ kind }`.
 *   - `kind` is one of the six allow-listed values from
 *     `OPERATING_ADOPTION_EVENTS`.
 *   - Edge runtime.
 *   - Always returns 204.
 *   - No consent gate (the adoption signal is aggregate;
 *     no per-visitor data persists).
 *
 * Foundation-stage contract — Sub-PR 9.1 ships NO consumer
 * that fires events. The `/v5/operating` route doesn't
 * exist yet; future Phase 9.2 surface will mount + fire
 * events through this endpoint.
 */

export const runtime = "edge";

interface OperatingEventPayload {
  kind?: unknown;
}

function noContent() {
  return new Response(null, {
    status: 204,
    headers: { "Cache-Control": "no-store" },
  });
}

export async function POST(req: Request) {
  let body: OperatingEventPayload;
  try {
    body = (await req.json()) as OperatingEventPayload;
  } catch {
    return noContent();
  }
  if (!isOperatingAdoptionEvent(body.kind)) {
    return noContent();
  }
  void recordOperatingEvent(body.kind);
  return noContent();
}

export function GET() {
  return new Response(null, {
    status: 405,
    headers: { Allow: "POST", "Cache-Control": "no-store" },
  });
}
