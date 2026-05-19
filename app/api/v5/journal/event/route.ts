import {
  isJournalAdoptionEvent,
  recordJournalEvent,
} from "@/lib/v5/journal/telemetry";

/**
 * V5 Phase 9 Sub-PR 9.3 — journal adoption event endpoint.
 *
 * Same posture as every other Phase 7 + 8 + 9.1 endpoint:
 *
 *   - JSON body parses to `{ kind }`.
 *   - `kind` is one of the four allow-listed values from
 *     `JOURNAL_ADOPTION_EVENTS`.
 *   - Edge runtime.
 *   - Always returns 204.
 *   - No consent gate.
 *
 * The journal index page (`/v5/journal`) fires `index_view`.
 * Per-week detail pages (`/v5/journal/<week>`) fire
 * `entry_view`. The cron route fires `cron_generated` and
 * `cron_error` directly (server-side, no client fetch).
 */

export const runtime = "edge";

interface JournalEventPayload {
  kind?: unknown;
}

function noContent() {
  return new Response(null, {
    status: 204,
    headers: { "Cache-Control": "no-store" },
  });
}

export async function POST(req: Request) {
  let body: JournalEventPayload;
  try {
    body = (await req.json()) as JournalEventPayload;
  } catch {
    return noContent();
  }
  if (!isJournalAdoptionEvent(body.kind)) {
    return noContent();
  }
  void recordJournalEvent(body.kind);
  return noContent();
}

export function GET() {
  return new Response(null, {
    status: 405,
    headers: { Allow: "POST", "Cache-Control": "no-store" },
  });
}
