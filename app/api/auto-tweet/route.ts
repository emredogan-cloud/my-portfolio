import { parseMode, AUTOTWEET_MODES, type AutotweetMode } from "@/lib/auto-tweet/modes";
import { runDailyStandup } from "@/lib/auto-tweet/handlers/daily-standup";
import { runWeeklyArchitecture } from "@/lib/auto-tweet/handlers/weekly-architecture";
import { runIncidentResponse } from "@/lib/auto-tweet/handlers/incident-response";
import { runLuminaClip } from "@/lib/auto-tweet/handlers/lumina-clip";
import {
  incrementMetric,
  METRIC_KEYS,
} from "@/lib/telemetry/metrics";

/**
 * Auto-tweet 2.0 — multi-format dispatcher.
 *
 * V4 Phase 1 — Sub-PR 1.3.
 *
 * Single entry point for all four formats. Mode is selected via the
 * `?mode=<value>` query string:
 *
 *   /api/auto-tweet                      → daily_standup (legacy cron default)
 *   /api/auto-tweet?mode=daily_standup   → daily_standup (explicit)
 *   /api/auto-tweet?mode=weekly_architecture
 *   /api/auto-tweet?mode=incident_response (drafts only — needs payload)
 *   /api/auto-tweet?mode=lumina_clip
 *
 * Auth: Bearer ${CRON_SECRET} header. Same posture as V3 — the
 * Vercel-managed cron, manual curl during dev, and the future Sentry
 * webhook (Sub-PR 1.5) all carry the same secret.
 *
 * Behaviour preservation: the legacy cron path `/api/auto-tweet`
 * (no query) maps to `daily_standup` — the existing Vercel cron
 * entry continues firing exactly as before this sub-PR.
 *
 * Telemetry: increments the existing v4:adoption:autotweet:success:30d
 * counter (wired in Sub-PR 1.2) on any successful post, regardless of
 * mode. Per-mode counters land in Sub-PR 1.5.
 */

export const runtime = "edge";
export const maxDuration = 30;

function unauthorized(): Response {
  return new Response(JSON.stringify({ error: "unauthorized" }), {
    status: 401,
    headers: { "Content-Type": "application/json" },
  });
}

function isAuthorized(req: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const header = req.headers.get("authorization") ?? "";
  const expected = `Bearer ${secret}`;
  return header === expected;
}

function unknownMode(raw: string | null): Response {
  return Response.json(
    {
      error: "unknown-mode",
      mode: raw,
      known: Object.values(AUTOTWEET_MODES),
    },
    { status: 400, headers: { "Cache-Control": "no-store" } },
  );
}

async function dispatch(
  mode: AutotweetMode,
  req: Request,
): Promise<Response> {
  switch (mode) {
    case AUTOTWEET_MODES.DAILY_STANDUP:
      return runDailyStandup();
    case AUTOTWEET_MODES.WEEKLY_ARCHITECTURE:
      return runWeeklyArchitecture();
    case AUTOTWEET_MODES.INCIDENT_RESPONSE:
      return runIncidentResponse(req);
    case AUTOTWEET_MODES.LUMINA_CLIP:
      return runLuminaClip();
    default: {
      /* Exhaustiveness check — if a new mode is added to the enum
       * without updating this switch, TypeScript will flag it here
       * via the never-typed `_exhaustive` binding. */
      const _exhaustive: never = mode;
      void _exhaustive;
      return unknownMode(null);
    }
  }
}

/**
 * Best-effort detection of "this run posted a tweet" from the
 * handler's response body. Each handler returns
 * `{ ok: true, tweet_id, ... }` on a real post and
 * `{ ok: true, skipped: "...", ... }` or `{ ok: true, status: "..." }`
 * on intentional no-ops. We only want to increment the success
 * counter for the first case.
 *
 * Reads + buffers the response body, then returns a fresh Response
 * with the same body so the caller still gets the full payload.
 */
async function maybeRecordSuccessAndPassThrough(
  res: Response,
): Promise<Response> {
  if (!res.ok) return res;
  /* Clone-and-read the body. Edge runtime supports response.clone(),
   * but reading the JSON twice from the original is what we actually
   * need so we can inspect + still return it. The clean way is:
   * read text, parse, reassemble a new Response. */
  let bodyText: string;
  try {
    bodyText = await res.clone().text();
  } catch {
    return res;
  }
  try {
    const parsed = JSON.parse(bodyText) as {
      ok?: boolean;
      tweet_id?: string;
      skipped?: string;
      status?: string;
    };
    const posted =
      parsed.ok === true &&
      typeof parsed.tweet_id === "string" &&
      parsed.tweet_id.length > 0 &&
      !parsed.skipped;
    if (posted) {
      /* Fire-and-forget — never blocks the cron response, never
       * affects the response status the cron logs. */
      void incrementMetric(METRIC_KEYS.AUTOTWEET_SUCCESS_30D);
    }
  } catch {
    /* body wasn't JSON — that's fine, just don't increment */
  }
  return res;
}

export async function POST(req: Request) {
  if (!isAuthorized(req)) return unauthorized();

  const url = new URL(req.url);
  const raw = url.searchParams.get("mode");
  const mode = parseMode(raw);
  if (!mode) return unknownMode(raw);

  const res = await dispatch(mode, req);
  return maybeRecordSuccessAndPassThrough(res);
}
