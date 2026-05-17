import { anthropic } from "@ai-sdk/anthropic";
import { streamText } from "ai";
import { buildLuminaSystemPrompt } from "@/lib/lumina/system-prompt";
import {
  consumeRateLimit,
  checkCostCap,
  recordEstimatedCost,
  getClientIp,
} from "@/lib/lab/rate-limit";
import { incrementMetric, METRIC_KEYS } from "@/lib/telemetry/metrics";
import { captureRouteError } from "@/lib/sentry";

/**
 * `/api/cli/ask` — CLI-shaped streaming chat endpoint.
 *
 * V4 Phase 2 — Sub-PR 2.4.
 *
 * Sibling to `/api/chat` (the website's chat surface), with two
 * critical differences:
 *
 *   1. **Plain text streaming** instead of the AI SDK 6 UIMessage
 *      protocol. The `@emredogan/cli` `ask` command reads the
 *      response body chunk-by-chunk and writes each chunk to
 *      stdout — no protocol parsing on the consumer side. Keeps
 *      the CLI free of any `@ai-sdk/*` runtime dep.
 *
 *   2. **Per-IP rate limit + per-day cost cap** via the existing
 *      `lib/lab/rate-limit` helpers. The site's chat widget is
 *      session-scoped through Lumina's own memory module
 *      (`lib/lumina/memory`); the CLI surface is anonymous and
 *      needs explicit abuse-mitigation.
 *
 * Runtime: nodejs to match `/api/chat` (the streamText pattern is
 * Web Fetch-backed but we keep posture symmetry with the existing
 * chat route).
 *
 * Same Lumina identity / voice as the website chat — re-uses
 * `buildLuminaSystemPrompt()` with the time-of-day tail. Visitors
 * who paste their CLI output and compare with a browser session
 * should see the same voice.
 */

export const runtime = "nodejs";
export const maxDuration = 30;

const EXPERIMENT_SLUG = "cli-ask";
const RATE_LIMIT_PER_HOUR = 10;
const MAX_QUESTION_LENGTH = 2000;
const ESTIMATED_COST_PER_CALL_USD = 0.002;
const DAILY_COST_CAP_USD = 5;

function jsonError(
  error: string,
  status: number,
  extra?: Record<string, unknown>,
) {
  return new Response(
    JSON.stringify({ error, ...(extra ?? {}) }),
    {
      status,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-store",
      },
    },
  );
}

export async function POST(req: Request) {
  /* ── Body validation ── */
  let body: { question?: unknown };
  try {
    body = await req.json();
  } catch {
    return jsonError("invalid-json", 400);
  }

  const question =
    typeof body.question === "string" ? body.question.trim() : "";
  if (!question) return jsonError("empty-question", 400);
  if (question.length > MAX_QUESTION_LENGTH) {
    return jsonError("question-too-long", 413, {
      limit_chars: MAX_QUESTION_LENGTH,
    });
  }

  /* ── Guards (custom 10/hr per V4 § 2.4) ── */
  const ip = getClientIp(req);
  const [rateLimit, costCap] = await Promise.all([
    consumeRateLimit(EXPERIMENT_SLUG, ip, RATE_LIMIT_PER_HOUR),
    checkCostCap(EXPERIMENT_SLUG, DAILY_COST_CAP_USD),
  ]);

  if (rateLimit.status === "blocked") {
    return jsonError("rate-limited", 429, {
      limit: rateLimit.limit,
      window_seconds: rateLimit.window_seconds,
    });
  }

  if (costCap.status === "capped") {
    return jsonError("daily-cost-cap-reached", 503, {
      cap_usd: costCap.cap_usd,
      current_usd: Number(costCap.current_usd.toFixed(4)),
    });
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return jsonError("sandbox-offline", 503);
  }

  void incrementMetric(METRIC_KEYS.CLI_ASK_VISITS_DAILY);

  /* ── Stream via @ai-sdk/anthropic, project to plain text ── */
  let result;
  try {
    result = streamText({
      model: anthropic("claude-haiku-4-5-20251001"),
      system: buildLuminaSystemPrompt(),
      messages: [{ role: "user", content: question }],
      temperature: 0.6,
      maxOutputTokens: 800,
    });
  } catch (err) {
    captureRouteError(err, {
      route: "/api/cli/ask",
      tags: { phase: "stream-init" },
    });
    return jsonError("sandbox-offline", 503);
  }

  const encoder = new TextEncoder();
  let streamCompleted = false;

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        for await (const delta of result.textStream) {
          if (delta) controller.enqueue(encoder.encode(delta));
        }
        streamCompleted = true;
        controller.close();
      } catch (err) {
        captureRouteError(err, {
          route: "/api/cli/ask",
          tags: { phase: "stream" },
        });
        controller.error(err);
      } finally {
        if (streamCompleted) {
          void incrementMetric(METRIC_KEYS.CLI_ASK_COMPLETIONS_DAILY);
          void recordEstimatedCost(
            EXPERIMENT_SLUG,
            ESTIMATED_COST_PER_CALL_USD,
          );
        }
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-store",
      "x-rate-limit-max": String(rateLimit.limit),
      "x-rate-limit-window": String(rateLimit.window_seconds),
      "x-rate-limit-remaining": String(
        Math.max(0, rateLimit.limit - rateLimit.count),
      ),
    },
  });
}
