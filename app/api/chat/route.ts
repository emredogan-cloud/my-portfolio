import { anthropic } from "@ai-sdk/anthropic";
import {
  streamText,
  convertToModelMessages,
  type UIMessage,
} from "ai";
import { LUMINA_SYSTEM_PROMPT } from "@/lib/lumina/system-prompt";

/**
 * Lumina chat endpoint.
 *
 * Architecture:
 *  - Vercel AI SDK v6 streamText → token-by-token response stream
 *  - Anthropic Claude 3 Haiku via @ai-sdk/anthropic
 *  - Static identity from lib/lumina/system-prompt.ts
 *
 * Extension points (intentionally thin so future phases plug in cleanly):
 *  - Rate limiting       → wrap the POST with a middleware before streamText
 *  - Auth/session        → validate a token before invoking the model
 *  - Retrieval context   → enrich system prompt with project-aware excerpts
 *  - Tool calling        → pass `tools: { … }` into streamText
 *  - Conversation memory → load thread history before convertToModelMessages
 *  - Moderation          → run inputs/outputs through a filter
 */

/* Edge runtime — TTFB on a streaming Anthropic call drops from
   the Node cold-start floor (~600-1500ms) into low triple digits.
   @ai-sdk/anthropic v3 is built against the Edge-compatible Web
   Fetch API, no Node-only imports. maxDuration still applies. */
export const runtime = "edge";
export const maxDuration = 30;

export async function POST(req: Request) {
  try {
    const { messages }: { messages: UIMessage[] } = await req.json();

    if (!process.env.ANTHROPIC_API_KEY) {
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
      system: LUMINA_SYSTEM_PROMPT,
      messages: await convertToModelMessages(messages),
      temperature: 0.6,
    });

    return result.toUIMessageStreamResponse();
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
