import { anthropic } from "@ai-sdk/anthropic";
import {
  streamText,
  convertToModelMessages,
  stepCountIs,
  type UIMessage,
} from "ai";
import { buildLuminaSystemPrompt } from "@/lib/lumina/system-prompt";
import { LUMINA_TOOLS } from "@/lib/lumina/tools";
import { saveSession, isValidSessionId } from "@/lib/lumina/memory";
import {
  recordLatencySample,
  METRIC_KEYS,
} from "@/lib/telemetry/metrics";
import { captureRouteError } from "@/lib/sentry";

/**
 * Lumina chat endpoint (V2).
 *
 * Phase 2 / Sub-PR 4 — adds tool-use auto-loop + KV-backed thread
 * persistence to the streaming chat surface from Phase 1.
 *
 *   tools           → LUMINA_TOOLS (lib/lumina/tools.ts) wired through
 *                     streamText; the SDK executes each tool whose
 *                     definition carries an execute() body and feeds
 *                     the result back to the model in the next step.
 *   stopWhen        → stepCountIs(5). Allows Claude to chain up to
 *                     four tool invocations before being forced to
 *                     answer; in practice it almost always converges
 *                     in 1-2 steps.
 *   memory          → onFinish stores the final UIMessage[] under
 *                     the visitor's sessionId. Reads happen via
 *                     /api/chat/load on cold mount, not here.
 *   time-of-day     → small dynamic suffix appended to the static
 *                     system prompt every request. Cache impact is
 *                     negligible for an 800-token prompt and reading
 *                     "Emre is at the bakery right now" is the kind
 *                     of detail that makes Lumina feel embodied.
 *
 * Runtime stays edge — @ai-sdk/anthropic v3 is built on Web Fetch and
 * the new dependencies (KV, our tool/memory modules) are also
 * Edge-safe.
 */

export const runtime = "edge";
export const maxDuration = 30;

interface ChatRequestBody {
  messages: UIMessage[];
  sessionId?: string;
}

function isMissingApiKey(): boolean {
  return !process.env.ANTHROPIC_API_KEY;
}

export async function POST(req: Request) {
  /* Latency stopwatch — captured at request entry so the sample
   * reflects full request-to-stream-complete duration, not just
   * model inference time. Sub-PR 1.2 telemetry contract. */
  const start = Date.now();

  try {
    const body = (await req.json()) as Partial<ChatRequestBody>;
    const messages: UIMessage[] = Array.isArray(body.messages)
      ? body.messages
      : [];
    const sessionId =
      typeof body.sessionId === "string" && isValidSessionId(body.sessionId)
        ? body.sessionId
        : undefined;

    if (isMissingApiKey()) {
      return new Response(
        JSON.stringify({
          error: "Lumina is not configured. ANTHROPIC_API_KEY is missing.",
        }),
        { status: 503, headers: { "Content-Type": "application/json" } },
      );
    }

    const result = streamText({
      /* Claude Haiku 4.5 — current Haiku snapshot. Naming convention for
         the 4.x family is `claude-{family}-{major}-{minor}-{snapshot}`
         (family precedes version, unlike the 3.x format). Pinned to a
         specific snapshot rather than an alias for production stability. */
      model: anthropic("claude-haiku-4-5-20251001"),
      system: buildLuminaSystemPrompt(),
      messages: await convertToModelMessages(messages),
      temperature: 0.6,
      tools: LUMINA_TOOLS,
      stopWhen: stepCountIs(5),
    });

    return result.toUIMessageStreamResponse({
      originalMessages: messages,
      onFinish: async ({ messages: finalMessages }) => {
        /* Telemetry first — fire-and-forget so a KV blip can never
         * delay the session-persistence path or the response close.
         * recordLatencySample is itself a graceful no-op when KV is
         * unavailable, so this is safe in dev too. */
        void recordLatencySample(
          METRIC_KEYS.LUMINA_P95_LATENCY,
          Date.now() - start,
        );
        if (!sessionId) return;
        await saveSession(sessionId, finalMessages);
      },
    });
  } catch (err) {
    /* Surface to Sentry — onRequestError in instrumentation.ts only
     * fires for errors that bubble past the route handler, but this
     * outer catch swallows them into a 500 JSON. Capture here so the
     * dashboard sees the failure rate, not just the user-facing 500. */
    captureRouteError(err, { route: "/api/chat" });
    const message = err instanceof Error ? err.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
