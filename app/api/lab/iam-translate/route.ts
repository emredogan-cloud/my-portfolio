import { InvokeModelWithResponseStreamCommand } from "@aws-sdk/client-bedrock-runtime";
import {
  getBedrockClient,
  CLAUDE_HAIKU_BEDROCK_ID,
  BEDROCK_ANTHROPIC_VERSION,
} from "@/lib/bedrock-client";
import { IAM_TRANSLATE_SYSTEM_PROMPT } from "@/lib/lab/prompts/iam-translate";
import {
  consumeRateLimit,
  checkCostCap,
  recordEstimatedCost,
  getClientIp,
} from "@/lib/lab/rate-limit";
import { incrementMetric, METRIC_KEYS } from "@/lib/telemetry/metrics";
import { captureRouteError } from "@/lib/sentry";

/**
 * `/lab/iam-translator` backend — V4 Phase 2, Sub-PR 2.1.
 *
 * Mirrors the existing `/api/cwh-demo` pattern verbatim with two
 * differences:
 *
 *   1. Different system prompt (`lib/lab/prompts/iam-translate`) —
 *      structured 4-part output instead of cwh-demo's terse bullet
 *      audit.
 *   2. Adds a per-day cost cap on top of the per-IP rate limit, so
 *      a coordinated flood across many IPs can't run up an AWS
 *      bill faster than the cap allows.
 *
 * Runtime decision — explicitly `nodejs`, NOT edge, even though
 * V4 § 6.1.B SUB-PR 2.1 step 4 names "Edge runtime". The existing
 * `/api/cwh-demo` route documents (lines 24-33) that the Bedrock
 * SDK's SigV4 signer + EventStream codec crash pre-flight on
 * Vercel's edge isolates. The doc's "edge" guidance was written
 * before that constraint surfaced in production; § 2.9 explicitly
 * sanctions Node fallback for SDK incompatibilities ("Whisper
 * transcribe → Node runtime kabul edilebilir"). Following the
 * existing precedent.
 *
 * Cost telemetry: $0.003 estimated per successful streaming
 * response (Bedrock Claude 3.5 Haiku, ~800 max tokens). Conservative
 * — real average is lower. Per V4 § 2.10 cost observability is
 * mandatory.
 */

export const runtime = "nodejs";
export const maxDuration = 30;

/* `EXPERIMENT_SLUG` is the *short* schema name from V4 § 5.1.2 —
 * `iam`, not `iam-translator`. It namespaces the KV keys
 * (`v4:lab:rate:iam:<ip>`, `v4:cost:lab:iam:usd_daily`) and matches
 * METRIC_KEYS.LAB_IAM_* exactly. The URL slug `/lab/iam-translator`
 * is a separate concern (registry / page routing). */
const EXPERIMENT_SLUG = "iam";
const MAX_POLICY_LENGTH = 4000;
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
  let body: { policy?: unknown };
  try {
    body = await req.json();
  } catch {
    return jsonError("invalid-json", 400);
  }

  const policy = typeof body.policy === "string" ? body.policy.trim() : "";
  if (!policy) return jsonError("empty-policy", 400);
  if (policy.length > MAX_POLICY_LENGTH) {
    return jsonError("policy-too-large", 413, {
      limit_bytes: MAX_POLICY_LENGTH,
    });
  }
  /* Try to parse — we hand the raw text to the model regardless,
   * because the model is more lenient about formatting than
   * JSON.parse. But if the input isn't even close to JSON shape,
   * the model's escape-hatch instructions will catch that too. */
  try {
    JSON.parse(policy);
  } catch {
    return jsonError("policy-not-json", 400);
  }

  /* ── Guards ── */
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
    /* Soft-503: the experiment's not broken, the day's already
     * paid for. The UI surfaces this as "sandbox quiet — daily
     * budget reached, try again tomorrow" rather than a generic
     * error. */
    return jsonError("daily-cost-cap-reached", 503, {
      cap_usd: costCap.cap_usd,
      current_usd: Number(costCap.current_usd.toFixed(4)),
    });
  }

  /* Record the visit attempt as soon as we know the request was
   * authorised — even completions that fail downstream count as
   * "someone tried the experiment". */
  void incrementMetric(METRIC_KEYS.LAB_IAM_VISITS_DAILY);

  /* ── Bedrock client ── */
  let client;
  try {
    client = getBedrockClient();
  } catch (err) {
    const msg = err instanceof Error ? err.message : "unknown";
    if (msg !== "bedrock-not-configured") {
      console.error(
        "[lab:iam-translate] bedrock client construction failed:",
        msg,
      );
      captureRouteError(err, {
        route: "/api/lab/iam-translate",
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
      max_tokens: 1200,
      temperature: 0.2,
      system: IAM_TRANSLATE_SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: `Translate this IAM policy:\n\n${policy}`,
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
      "[lab:iam-translate] bedrock send failed:",
      JSON.stringify({
        name: e?.name,
        httpStatusCode: e?.$metadata?.httpStatusCode,
        message: e?.message,
      }),
    );
    captureRouteError(err, {
      route: "/api/lab/iam-translate",
      tags: {
        phase: "bedrock-send",
        aws_error: e?.name ?? "unknown",
      },
    });
    /* IAM / model-access misconfiguration → quiet 503. Anything
     * else surfaces as a 502 with the upstream message. */
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
          "[lab:iam-translate] stream iteration failed:",
          err instanceof Error ? err.message : "unknown",
        );
        captureRouteError(err, {
          route: "/api/lab/iam-translate",
          tags: { phase: "stream" },
        });
        controller.error(err);
      } finally {
        /* Telemetry on successful completion only — failed streams
         * already raised. Fire-and-forget so a KV blip doesn't
         * delay the connection close. */
        if (streamCompleted) {
          void incrementMetric(METRIC_KEYS.LAB_IAM_COMPLETIONS_DAILY);
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
