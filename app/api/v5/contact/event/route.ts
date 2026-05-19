import {
  isValidPatternForTelemetry,
  recordContactPattern,
} from "@/lib/v5/contact/telemetry";

/**
 * V5 Phase 8 Sub-PR 8.5 — adaptive contact event endpoint.
 *
 * The single edge POST surface for the adaptive recruiter
 * telemetry. Same posture as every other Phase 7 + 8
 * endpoint:
 *
 *   - JSON body parses to `{ pattern }`.
 *   - `pattern` is one of the four allow-listed values from
 *     `CONTACT_PATTERNS`.
 *   - Edge runtime.
 *   - Always returns 204.
 *   - No consent gate (the pattern signal is an aggregate
 *     classification, not a per-visitor identifier).
 *
 * Foundation-stage contract — Sub-PR 8.5 ships NO consumer
 * that fires events. The would-be Provider exists at
 * `components/v5/AdaptivePatternProvider.tsx` but is not
 * mounted on /contact. The endpoint exists so a future
 * mount sub-PR has a stable contract to fire through.
 */

export const runtime = "edge";

interface ContactEventPayload {
  pattern?: unknown;
}

function noContent() {
  return new Response(null, {
    status: 204,
    headers: { "Cache-Control": "no-store" },
  });
}

export async function POST(req: Request) {
  let body: ContactEventPayload;
  try {
    body = (await req.json()) as ContactEventPayload;
  } catch {
    return noContent();
  }
  if (!isValidPatternForTelemetry(body.pattern)) {
    return noContent();
  }
  void recordContactPattern(body.pattern);
  return noContent();
}

export function GET() {
  return new Response(null, {
    status: 405,
    headers: { Allow: "POST", "Cache-Control": "no-store" },
  });
}
