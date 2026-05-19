import { anthropic } from "@ai-sdk/anthropic";
import {
  streamText,
  convertToModelMessages,
  stepCountIs,
  type UIMessage,
} from "ai";
import { buildLuminaSystemPrompt } from "@/lib/lumina/system-prompt";
import { createLuminaTools } from "@/lib/lumina/tools";
import { routeRequest } from "@/lib/lumina/router";
import {
  ARCHITECTURE_CRITIC_ID,
  ARCHITECTURE_CRITIC_INIT_TOOL,
  ARCHITECTURE_CRITIC_SYSTEM_PROMPT,
  architectureCriticInitTool,
} from "@/lib/lumina/agents/architecture-critic";
import {
  saveSession,
  loadSummary,
  isValidSessionId,
  VERBATIM_CONTEXT_MESSAGES,
} from "@/lib/lumina/memory";
import { maybeRegenerateSummary } from "@/lib/lumina/summarize";
import {
  recordLatencySample,
  recordRoutingDecision,
  METRIC_KEYS,
} from "@/lib/telemetry/metrics";
import { captureRouteError } from "@/lib/sentry";
import { isAmbientEnabled } from "@/lib/v5/ambient/flags";
import { composeAmbientContext } from "@/lib/v5/ambient/registry";
import { recordLuminaAmbientEvent } from "@/lib/lumina/ambient-context";
import type { AmbientContext } from "@/lib/v5/ambient/schema";

/**
 * Lumina chat endpoint (V2).
 *
 * Phase 2 / Sub-PR 4 — adds tool-use auto-loop + KV-backed thread
 * persistence to the streaming chat surface from Phase 1.
 *
 *   tools           → createLuminaTools(req) (lib/lumina/tools.ts).
 *                     Built per-request so the lab-invocation tools
 *                     (Sub-PR 3.2) can close over the originating
 *                     Request and forward IP headers to the
 *                     loopback POST against the nodejs lab routes.
 *                     Wired through streamText; the SDK executes
 *                     each tool whose definition carries an
 *                     execute() body and feeds the result back to
 *                     the model in the next step.
 *   stopWhen        → stepCountIs(5). Allows Claude to chain up to
 *                     four tool invocations before being forced to
 *                     answer; in practice it almost always converges
 *                     in 1-2 steps.
 *   memory          → onFinish redacts + persists the final
 *                     UIMessage[] under the visitor's sessionId,
 *                     then fires the summary regenerator if the
 *                     thread has grown past the verbatim context
 *                     window. Reads happen via /api/chat/load on
 *                     cold mount, not here.
 *   verbatim cap    → Only the last VERBATIM_CONTEXT_MESSAGES turns
 *                     are sent to the model verbatim. Older turns
 *                     are represented by the cached session summary
 *                     loaded via loadSummary() and prepended to the
 *                     system prompt as an "earlier in this session"
 *                     note. The visitor's UI still shows the full
 *                     thread — the cap is model-side only.
 *   time-of-day     → small dynamic suffix appended to the static
 *                     system prompt every request. Cache impact is
 *                     negligible for an 800-token prompt and reading
 *                     "Emre is at the bakery right now" is the kind
 *                     of detail that makes Lumina feel embodied.
 *   routing         → Sub-PR 4.5. routeRequest(messages) classifies
 *                     each turn into either default Lumina or the
 *                     architecture-critic sub-agent. The decision is
 *                     deterministic (heuristic, NOT LLM-based) so
 *                     adds < 1 ms to the chat-turn latency, and
 *                     always falls back to single-agent mode for
 *                     anything ambiguous (the constitutional MUST).
 *                     When the sub-agent fires, the synthetic
 *                     selectArchitectureCritic tool is appended to
 *                     the registry and the prompt instructs the
 *                     model to call it once at the start — the
 *                     resulting tool-status pill IS the visible
 *                     orchestration trace.
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
  /** Sub-PR 4.4: when true the visitor has explicitly opted out
   *  of conversation memory. The route skips every KV operation
   *  for the turn — no load, no save, no summary regen. */
  memoryOptOut?: boolean;
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
    /* Sub-PR 4.4 opt-out flag. Default false (memory enabled);
     * true only when the client toggle is in the off position. */
    const memoryOptOut = body.memoryOptOut === true;

    if (isMissingApiKey()) {
      return new Response(
        JSON.stringify({
          error: "Lumina is not configured. ANTHROPIC_API_KEY is missing.",
        }),
        { status: 503, headers: { "Content-Type": "application/json" } },
      );
    }

    /* Memory contract (Sub-PR 3.3 + 4.4) + Phase 10.2 ambient
     * context: load the cached recap of older turns AND compose the
     * ambient operator context in parallel. Both are graceful no-ops
     * when their inputs aren't available (no sessionId / opt-out /
     * thread shorter than the window / ambient flag off / compose
     * failed). Promise.all is safe because neither helper throws —
     * the ambient compose's `viewOperating` catches its own failures
     * and returns null. */
    const wantsAmbient = isAmbientEnabled();
    const [summaryRecord, ambientContext] = await Promise.all([
      !memoryOptOut && sessionId && messages.length > VERBATIM_CONTEXT_MESSAGES
        ? loadSummary(sessionId)
        : Promise.resolve(null),
      wantsAmbient
        ? composeAmbientContext().catch(
            (): AmbientContext | null => null,
          )
        : Promise.resolve(null),
    ]);

    /* Phase 10.2 telemetry — fire-and-forget per chat turn. The
     * three event kinds (context_consumed / context_unavailable /
     * context_skipped) cover every code path; the operator can
     * read `v5:lumina-v5:ambient` to know Lumina's ambient
     * adoption ratio without instrumenting the chat path further. */
    if (!wantsAmbient) {
      void recordLuminaAmbientEvent("context_skipped");
    } else if (ambientContext) {
      void recordLuminaAmbientEvent("context_consumed");
    } else {
      void recordLuminaAmbientEvent("context_unavailable");
    }

    const verbatimMessages =
      messages.length > VERBATIM_CONTEXT_MESSAGES
        ? messages.slice(-VERBATIM_CONTEXT_MESSAGES)
        : messages;

    /* Sub-PR 4.5 routing layer. routeRequest is pure + deterministic
     * — heuristic classifier that always returns SOMETHING, never
     * throws. The decision is recorded fire-and-forget so a KV blip
     * can never affect the routing path itself. Constitutional MUST
     * #1 (fail back to single-agent mode) is satisfied at the
     * router boundary: any ambiguous or unrecognized input lands on
     * the "lumina" branch. */
    const routing = routeRequest(messages);
    void recordRoutingDecision(routing.agent);

    /* Compose the prompt + tool registry per the routing decision.
     * The architecture-critic overlay APPENDS to the default Lumina
     * prompt — the sub-agent inherits Lumina's voice, tool surface,
     * and operator-awareness rules verbatim, then adds the critique
     * discipline overlay last (highest recency in attention). The
     * synthetic init tool is gated to the sub-agent path only — base
     * tool registry stays unchanged for default chats. */
    const baseSystemPrompt = buildLuminaSystemPrompt(
      new Date(),
      summaryRecord?.summary ?? null,
      ambientContext,
    );
    const baseTools = createLuminaTools(req);
    const isCritic = routing.agent === ARCHITECTURE_CRITIC_ID;
    const systemPrompt = isCritic
      ? `${baseSystemPrompt}\n\n${ARCHITECTURE_CRITIC_SYSTEM_PROMPT}`
      : baseSystemPrompt;
    const tools = isCritic
      ? {
          ...baseTools,
          [ARCHITECTURE_CRITIC_INIT_TOOL]: architectureCriticInitTool,
        }
      : baseTools;

    const result = streamText({
      /* Claude Haiku 4.5 — current Haiku snapshot. Naming convention for
         the 4.x family is `claude-{family}-{major}-{minor}-{snapshot}`
         (family precedes version, unlike the 3.x format). Pinned to a
         specific snapshot rather than an alias for production stability. */
      model: anthropic("claude-haiku-4-5-20251001"),
      system: systemPrompt,
      messages: await convertToModelMessages(verbatimMessages),
      temperature: 0.6,
      tools,
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
        /* Sub-PR 4.4: opt-out turns this side of the contract into
         * a complete no-op. No save, no summary regen — KV is
         * never touched for the duration of the off state. */
        if (memoryOptOut) return;
        await saveSession(sessionId, finalMessages);
        /* Fire-and-forget: regenerate the cached summary if the
         * thread has grown past the verbatim window by enough to
         * warrant it. The function itself decides whether to run —
         * see lib/lumina/summarize#shouldRegenerate. Errors swallow
         * silently; next save attempt will retry. */
        void maybeRegenerateSummary(sessionId, finalMessages);
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
