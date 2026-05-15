import { isValidSessionId, loadSession } from "@/lib/lumina/memory";

/**
 * Lumina conversation rehydration.
 *
 * Companion to /api/chat: Phase 1's sessionStorage path handles
 * same-tab refreshes; this endpoint handles cross-tab and cross-day
 * resumption by reading the same KV bucket /api/chat onFinish wrote.
 *
 * Request:  GET /api/chat/load?sessionId=<uuid>
 * Response: { messages: UIMessage[] }  — empty array if the session
 *           is unknown, KV is unavailable, or the id is malformed.
 *           Never returns an error status — the chat surface should
 *           keep working even if memory is offline.
 */

export const runtime = "edge";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const sessionId = url.searchParams.get("sessionId");

  if (!sessionId || !isValidSessionId(sessionId)) {
    return Response.json(
      { messages: [] },
      { headers: { "Cache-Control": "no-store" } },
    );
  }

  const messages = (await loadSession(sessionId)) ?? [];
  return Response.json(
    { messages },
    { headers: { "Cache-Control": "no-store" } },
  );
}
