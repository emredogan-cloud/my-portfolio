import { InvokeModelWithResponseStreamCommand } from "@aws-sdk/client-bedrock-runtime";
import {
  getBedrockClient,
  CLAUDE_HAIKU_BEDROCK_ID,
  BEDROCK_ANTHROPIC_VERSION,
} from "@/lib/bedrock-client";
import { PROMPT_RESCUE_SYSTEM_PROMPT } from "@/lib/lab/prompts/prompt-rescue";
import {
  consumeRateLimit,
  checkCostCap,
  recordEstimatedCost,
  getClientIp,
} from "@/lib/lab/rate-limit";
import { incrementMetric, METRIC_KEYS } from "@/lib/telemetry/metrics";
import { captureRouteError } from "@/lib/sentry";

/**
 * `/lab/prompt-rescuer` backend — V4 Phase 2, Sub-PR 2.2.
 *
 * Sibling shape to `/api/lab/iam-translate` (Sub-PR 2.1) — same
 * Bedrock streaming, same rate-limit + cost-cap guards reused
 * verbatim from `lib/lab/rate-limit`. Three deltas:
 *
 *   1. Different system prompt (`PROMPT_RESCUE_SYSTEM_PROMPT`) —
 *      six-section structured engineering brief.
 *   2. Different slug (`prompt-rescuer`, full URL form). The IAM
 *      route uses the short `iam` schema slug to match V4 § 5.1.2
 *      literally; the prompt-rescue route uses the longer slug
 *      because the doc names it that way too. Consistency with
 *      the doc trumps internal symmetry.
 *   3. Input validation: freeform prose, NOT JSON. We just trim,
 *      enforce a min length to weed out the "idk" hits, and a
 *      max length to keep token cost predictable. The model's
 *      escape-hatch handles thin inputs by returning the
 *      "paste a paragraph" line.
 *
 * Runtime choice + Bedrock posture mirrored from Sub-PR 2.1 —
 * `nodejs` (NOT edge), `maxDuration: 30`, Sentry capture at
 * client / send / stream phases.
 */

export const runtime = "nodejs";
export const maxDuration = 30;

const EXPERIMENT_SLUG = "prompt-rescuer";
const MIN_PROMPT_LENGTH = 12;
const MAX_PROMPT_LENGTH = 4000;
const ESTIMATED_COST_PER_CALL_USD = 0.003;
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
  let body: { prompt?: unknown };
  try {
    body = await req.json();
  } catch {
    return jsonError("invalid-json", 400);
  }

  const promptText =
    typeof body.prompt === "string" ? body.prompt.trim() : "";
  if (!promptText) return jsonError("empty-prompt", 400);
  if (promptText.length < MIN_PROMPT_LENGTH) {
    return jsonError("prompt-too-short", 400, {
      min_chars: MIN_PROMPT_LENGTH,
    });
  }
  if (promptText.length > MAX_PROMPT_LENGTH) {
    return jsonError("prompt-too-large", 413, {
      limit_bytes: MAX_PROMPT_LENGTH,
    });
  }

  /* ── Guards (same shape as iam-translate; new namespace) ── */
  const ip = getClientIp(req);
  const [rateLimit, costCap] = await Promise.all([
    consumeRateLimit(EXPERIMENT_SLUG, ip),
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

  void incrementMetric(METRIC_KEYS.LAB_PROMPT_RESCUER_VISITS_DAILY);

  /* ── Bedrock client ── */
  let client;
  try {
    client = getBedrockClient();
  } catch (err) {
    const msg = err instanceof Error ? err.message : "unknown";
    if (msg !== "bedrock-not-configured") {
      console.error(
        "[lab:prompt-rescue] bedrock client construction failed:",
        msg,
      );
      captureRouteError(err, {
        route: "/api/lab/prompt-rescue",
        tags: { phase: "client" },
      });
    }
    return jsonError("sandbox-offline", 503);
  }

  /* ── Bedrock invoke ── */
  const command = new InvokeModelWithResponseStreamCommand({
    modelId: CLAUDE_HAIKU_BEDROCK_ID,
    contentType: "application/json",
    accept: "application/json",
    body: JSON.stringify({
      anthropic_version: BEDROCK_ANTHROPIC_VERSION,
      max_tokens: 1500,
      temperature: 0.25,
      system: PROMPT_RESCUE_SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: `Rescue this prompt:\n\n${promptText}`,
        },
      ],
    }),
  });

  let response;
  try {
    response = await client.send(command);
  } catch (err) {
    const e = err as {
      name?: string;
      $metadata?: { httpStatusCode?: number };
      message?: string;
    };
    console.error(
      "[lab:prompt-rescue] bedrock send failed:",
      JSON.stringify({
        name: e?.name,
        httpStatusCode: e?.$metadata?.httpStatusCode,
        message: e?.message,
      }),
    );
    captureRouteError(err, {
      route: "/api/lab/prompt-rescue",
      tags: {
        phase: "bedrock-send",
        aws_error: e?.name ?? "unknown",
      },
    });
    const misconfigured =
      e?.name === "AccessDeniedException" ||
      e?.name === "ValidationException" ||
      e?.name === "ResourceNotFoundException" ||
      e?.name === "UnauthorizedException";
    if (misconfigured) return jsonError("sandbox-offline", 503);
    return jsonError("bedrock-error", 502, {
      message: e?.message ?? "unknown",
    });
  }

  if (!response.body) return jsonError("no-stream", 502);

  /* ── Streaming response ── */
  const encoder = new TextEncoder();
  const decoder = new TextDecoder();
  const upstream = response.body;

  let streamCompleted = false;

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        for await (const event of upstream) {
          const bytes = event.chunk?.bytes;
          if (!bytes) continue;
          let parsed: unknown;
          try {
            parsed = JSON.parse(decoder.decode(bytes));
          } catch {
            continue;
          }
          if (
            typeof parsed === "object" &&
            parsed !== null &&
            (parsed as { type?: unknown }).type === "content_block_delta"
          ) {
            const delta = (parsed as { delta?: { text?: unknown } }).delta;
            if (typeof delta?.text === "string") {
              controller.enqueue(encoder.encode(delta.text));
            }
          }
        }
        streamCompleted = true;
        controller.close();
      } catch (err) {
        console.error(
          "[lab:prompt-rescue] stream iteration failed:",
          err instanceof Error ? err.message : "unknown",
        );
        captureRouteError(err, {
          route: "/api/lab/prompt-rescue",
          tags: { phase: "stream" },
        });
        controller.error(err);
      } finally {
        if (streamCompleted) {
          void incrementMetric(
            METRIC_KEYS.LAB_PROMPT_RESCUER_COMPLETIONS_DAILY,
          );
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
