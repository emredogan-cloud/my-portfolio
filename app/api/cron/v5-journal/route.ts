import { isJournalEnabled } from "@/lib/v5/journal/flags";
import { buildJournalEntry } from "@/lib/v5/journal/generator";
import { writeJournalEntry } from "@/lib/v5/journal/storage";
import { recordJournalEvent } from "@/lib/v5/journal/telemetry";
import { composeOperationalSnapshot } from "@/lib/v5/operating/snapshot";

/**
 * V5 Phase 9 Sub-PR 9.3 — living journal weekly cron.
 *
 * Fires once per week (Vercel cron schedule in
 * `vercel.json`). Reads the current operational snapshot,
 * generates a journal entry, persists it to KV, fires
 * adoption telemetry.
 *
 * Auth
 *   Vercel cron carries `Authorization: Bearer
 *   ${CRON_SECRET}`. The route validates the bearer token
 *   exactly the way `/api/auto-tweet` does. Without the
 *   secret set, the route refuses all calls (including
 *   the platform's own cron call) — defense in depth.
 *
 * Gating
 *   Two gates closed at the entry:
 *     1. `isJournalEnabled()` — operator's V5_JOURNAL_ENABLED
 *        env. Default OFF; the cron silently exits when
 *        unset.
 *     2. CRON_SECRET validation.
 *   Cron schedules continue to fire (Vercel's platform
 *   policy); the route just no-ops when not authorized.
 *
 * Behavior
 *   - Compose snapshot from existing data sources.
 *   - Build the JournalEntry via the pure generator.
 *   - Write to KV (entry + index update).
 *   - Fire `cron_generated` adoption event.
 *   - Failure path fires `cron_error`; the operator can
 *     read the hash on /telemetry or a future operator
 *     dashboard.
 *
 * Always returns 204 No Content. The cron doesn't expose
 * its internal state in the response.
 *
 * Why nodejs runtime (not edge)
 *   The composer makes a GitHub API call + 8 KV reads.
 *   Edge runtime supports both, but the cron's combined
 *   latency budget is generous (the schedule fires once
 *   per week); the nodejs runtime gives slightly richer
 *   error semantics + matches the existing auto-tweet
 *   cron pattern.
 */

export const runtime = "nodejs";

function isAuthorizedCron(req: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const header = req.headers.get("authorization") ?? "";
  return header === `Bearer ${secret}`;
}

function noContent() {
  return new Response(null, {
    status: 204,
    headers: { "Cache-Control": "no-store" },
  });
}

export async function POST(req: Request) {
  return runCron(req);
}

/** Vercel triggers crons via GET to the configured path.
 *  Some setups use POST. The route handles both with the
 *  same code path; the auth gate is identical. */
export async function GET(req: Request) {
  return runCron(req);
}

async function runCron(req: Request): Promise<Response> {
  if (!isAuthorizedCron(req)) {
    /* Unauthenticated — return 401 so misconfigurations
     * surface in the cron's run logs. Vercel cron will
     * retry on failure; an honest 401 is better than a
     * silent 204. */
    return new Response(null, {
      status: 401,
      headers: { "Cache-Control": "no-store" },
    });
  }
  if (!isJournalEnabled()) {
    /* Flag off — silent no-op. The platform's cron schedule
     * continues firing; the cron just doesn't write
     * anything. Idempotent. */
    return noContent();
  }
  try {
    const snapshot = await composeOperationalSnapshot();
    const entry = buildJournalEntry(snapshot);
    if (entry === null) {
      /* Generator returned null — week id couldn't resolve.
       * Defensive; this branch is effectively unreachable
       * in production. */
      void recordJournalEvent("cron_error");
      return noContent();
    }
    await writeJournalEntry(entry);
    void recordJournalEvent("cron_generated");
  } catch {
    /* Composer or write threw — record the error counter +
     * return 204. The Vercel cron retry policy + the operator
     * reading the hash is the failure-detection path. */
    void recordJournalEvent("cron_error");
  }
  return noContent();
}
