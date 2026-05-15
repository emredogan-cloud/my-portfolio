import { anthropic } from "@ai-sdk/anthropic";
import {
  streamText,
  convertToModelMessages,
  stepCountIs,
  type UIMessage,
} from "ai";
import { LUMINA_SYSTEM_PROMPT } from "@/lib/lumina/system-prompt";
import { LUMINA_TOOLS } from "@/lib/lumina/tools";
import { saveSession, isValidSessionId } from "@/lib/lumina/memory";

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

/* Istanbul timezone is UTC+3 year-round (Türkiye dropped DST in 2016).
   Build a short note describing what Emre is most likely doing right
   now so Lumina can ground time-sensitive answers ("you can probably
   reach him in the build window tonight"). */
function buildTimeOfDayNote(): string {
  const fmt = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/Istanbul",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  const parts = fmt.formatToParts(new Date());
  const hour = parseInt(parts.find((p) => p.type === "hour")?.value ?? "0", 10);
  const minute = parseInt(
    parts.find((p) => p.type === "minute")?.value ?? "0",
    10,
  );
  const local = `${hour.toString().padStart(2, "0")}:${minute
    .toString()
    .padStart(2, "0")}`;

  // Bands per data/notes.ts "monk-mode" — single source of truth for
  // Emre's daily schedule.
  //   01:30 – 08:00  bakery shift
  //   08:00 – 16:00  high school
  //   16:00 – 22:00  build window
  //   22:00 – 01:30  sleeping
  const minutes = hour * 60 + minute;
  let band: string;
  if (minutes >= 90 && minutes < 480) {
    band = "Emre is currently at the bakery — 01:30-08:00 shift.";
  } else if (minutes >= 480 && minutes < 960) {
    band = "Emre is at school — 08:00-16:00.";
  } else if (minutes >= 960 && minutes < 1320) {
    band = "Emre is in his build window — 16:00-22:00.";
  } else {
    band = "Emre is likely asleep — 22:00-01:30.";
  }

  return `\n\n# Right now\nLocal time at Emre's location (Istanbul, UTC+3): ${local}. ${band}`;
}

interface ChatRequestBody {
  messages: UIMessage[];
  sessionId?: string;
}

function isMissingApiKey(): boolean {
  return !process.env.ANTHROPIC_API_KEY;
}

export async function POST(req: Request) {
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
      system: LUMINA_SYSTEM_PROMPT + buildTimeOfDayNote(),
      messages: await convertToModelMessages(messages),
      temperature: 0.6,
      tools: LUMINA_TOOLS,
      stopWhen: stepCountIs(5),
    });

    return result.toUIMessageStreamResponse({
      originalMessages: messages,
      onFinish: async ({ messages: finalMessages }) => {
        if (!sessionId) return;
        await saveSession(sessionId, finalMessages);
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
