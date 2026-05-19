import { isPlaybackEventKind } from "@/lib/v5/temporal/playback";
import { recordPlaybackEvent } from "@/lib/v5/temporal/playback-telemetry";

/**
 * V5 Phase 7 Sub-PR 7.2 — playback adoption event endpoint.
 *
 * The single edge POST surface for the temporal playback layer's
 * interaction signal. The page-level visit counter (Phase 7.1's
 * VisitPing → v5:telemetry:evolution-page:visits) and the
 * filter / deep-link counter (Phase 7.1's v5:temporal:adoption)
 * are decoupled from this endpoint deliberately:
 *
 *   - Phase 7.1 records `view`, `category_view`, `event_view`
 *     — "arrival at a surface" signal.
 *   - Phase 7.2 records `seek`, `scrub`, `play`, `pause`, `step`
 *     — "interaction with the timeline" signal.
 *
 * Different vocabularies, different hashes. Phase 7.3+ slider
 * consumers will fire through this endpoint.
 *
 * Gate hierarchy
 *   1. JSON body parses to `{ kind }`.
 *   2. `kind` is one of the five allow-listed values in
 *      `PLAYBACK_EVENT_KINDS`.
 *
 * What this endpoint does NOT do:
 *   - It does NOT gate on any consent cookie. Symmetric with
 *     Phase 7.1's temporal-adoption endpoint: the playback
 *     interaction signal carries no per-visitor data; the hash
 *     stores only event-kind counters.
 *   - It does NOT read IP / User-Agent / cookies. The body
 *     `{ kind }` is the only signal.
 *   - It does NOT accept GET.
 *
 * Always returns 204 No Content.
 */

export const runtime = "edge";

interface PlaybackPayload {
  kind?: unknown;
}

function noContent() {
  return new Response(null, {
    status: 204,
    headers: { "Cache-Control": "no-store" },
  });
}

export async function POST(req: Request) {
  let body: PlaybackPayload;
  try {
    body = (await req.json()) as PlaybackPayload;
  } catch {
    return noContent();
  }
  if (!isPlaybackEventKind(body.kind)) {
    return noContent();
  }
  /* Fire-and-forget HINCRBY. The helper swallows every error
   * path; this `void` never throws. */
  void recordPlaybackEvent(body.kind);
  return noContent();
}

export function GET() {
  return new Response(null, {
    status: 405,
    headers: { Allow: "POST", "Cache-Control": "no-store" },
  });
}
