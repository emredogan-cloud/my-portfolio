import { forgetSession, isValidSessionId } from "@/lib/lumina/memory";

/**
 * Lumina session forget — Sub-PR 3.3 hotfix.
 *
 * Companion to /api/chat (save) and /api/chat/load (read):
 * this endpoint deletes both KV buckets (`lumina:session:<id>` and
 * `lumina:summary:<id>`) for a given session. Wired to the Forget-Me
 * control in the chat header so a visitor has explicit, immediate
 * control over what we store about them.
 *
 * Request:  POST /api/chat/forget  body: { sessionId: string }
 * Response: { ok: true } — always. The client must not depend on
 *           server reachability to clear its own state; KV records
 *           expire naturally within 14 days even if this call
 *           fails. Returning 200 even on a no-op is the simplest
 *           contract for the UI's fire-and-forget invocation.
 *
 * Runtime: edge, matching the sibling chat routes.
 */

export const runtime = "edge";

export async function POST(req: Request) {
  let body: { sessionId?: unknown };
  try {
    body = (await req.json()) as { sessionId?: unknown };
  } catch {
    return Response.json(
      { ok: true },
      { headers: { "Cache-Control": "no-store" } },
    );
  }

  const sessionId = body.sessionId;
  if (typeof sessionId !== "string" || !isValidSessionId(sessionId)) {
    return Response.json(
      { ok: true },
      { headers: { "Cache-Control": "no-store" } },
    );
  }

  await forgetSession(sessionId);
  return Response.json(
    { ok: true },
    { headers: { "Cache-Control": "no-store" } },
  );
}
