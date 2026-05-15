import { kv } from "@vercel/kv";
import { InvokeModelWithResponseStreamCommand } from "@aws-sdk/client-bedrock-runtime";
import {
  getBedrockClient,
  CLAUDE_HAIKU_BEDROCK_ID,
  BEDROCK_ANTHROPIC_VERSION,
} from "@/lib/bedrock-client";

/**
 * Cloud Waste Hunter — public IAM-policy auditor demo.
 *
 * Mirrors what the production SaaS does end-to-end, scaled down to
 * a single policy and a single Bedrock streaming call:
 *   1. Visitor pastes an IAM policy JSON in the on-page textarea.
 *   2. /api/cwh-demo rate-limits the request (5 / IP / hr in KV).
 *   3. Forwards to Claude 3.5 Haiku on Bedrock with an auditor
 *      system prompt — same model CWH uses for remediation.
 *   4. Streams Bedrock's content_block_delta chunks back as plain
 *      text so the client can append tokens to the UI as they arrive.
 *
 * Cost control: rate-limit, hard policy-length cap, max_tokens=800,
 * temperature 0.3, and a clean 503 if AWS credentials are missing.
 *
 * Runtime: nodejs. The previous edge runtime crashed pre-flight —
 * @aws-sdk/client-bedrock-runtime's SigV4 signer + EventStream codec
 * depend on Node-only internals that don't fully resolve on Vercel's
 * v8 isolates, so client.send() threw before any outbound request
 * reached AWS ("External APIs: No outgoing requests" in the Vercel
 * function logs). The production CWH backend
 * (services/bedrock_advisor.py) runs boto3 on AWS Lambda — a
 * Node-equivalent — so this route matches that posture instead of
 * fighting the SDK on edge. maxDuration is sized to absorb a
 * worst-case streaming response under the no-retry config.
 */

export const runtime = "nodejs";
export const maxDuration = 30;

const RATE_LIMIT_MAX = 5;
const RATE_LIMIT_WINDOW_SECONDS = 3600;
const MAX_POLICY_LENGTH = 4000;

const SYSTEM_PROMPT = `You are an AWS IAM security auditor.

Audit the IAM policy provided by the user. For each problem you find, output:
1. The specific issue (action wildcard, missing Condition, resource scope, etc.).
2. The risk it creates in production.
3. The minimal fix — Terraform snippet or aws-cli command preferred.

Be terse. Use bullet points. No greeting, no closing summary.`;

const hasKv = Boolean(
  process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN,
);

function getClientIp(req: Request): string {
  const real = req.headers.get("x-real-ip");
  if (real) return real;
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0]?.trim() ?? "anonymous";
  return "anonymous";
}

async function consumeRateLimit(ip: string): Promise<"ok" | "blocked"> {
  if (!hasKv) return "ok";
  const key = `cwh-demo:rl:${ip}`;
  const count = (await kv.incr(key)) as number;
  if (count === 1) {
    await kv.expire(key, RATE_LIMIT_WINDOW_SECONDS);
  }
  return count > RATE_LIMIT_MAX ? "blocked" : "ok";
}

function jsonError(error: string, status: number, extra?: Record<string, unknown>) {
  return new Response(
    JSON.stringify({ error, ...(extra ?? {}) }),
    { status, headers: { "Content-Type": "application/json" } },
  );
}

export async function POST(req: Request) {
  let body: { policyJson?: unknown };
  try {
    body = await req.json();
  } catch {
    return jsonError("invalid-json", 400);
  }

  const policyJson =
    typeof body.policyJson === "string" ? body.policyJson.trim() : "";
  if (!policyJson) return jsonError("empty-policy", 400);
  if (policyJson.length > MAX_POLICY_LENGTH) {
    return jsonError("policy-too-large", 413, {
      limit_bytes: MAX_POLICY_LENGTH,
    });
  }
  try {
    JSON.parse(policyJson);
  } catch {
    return jsonError("policy-not-json", 400);
  }

  const ip = getClientIp(req);
  const limit = await consumeRateLimit(ip);
  if (limit === "blocked") {
    return jsonError("rate-limited", 429, {
      limit: RATE_LIMIT_MAX,
      window_seconds: RATE_LIMIT_WINDOW_SECONDS,
    });
  }

  let client;
  try {
    client = getBedrockClient();
  } catch (err) {
    // "bedrock-not-configured" → credentials env var missing. Anything
    // else is a programming error (bad region literal, etc.) and is
    // surfaced as 503 too so the client renders "sandbox-offline"
    // rather than a confusing 502.
    const msg = err instanceof Error ? err.message : "unknown";
    if (msg !== "bedrock-not-configured") {
      console.error("[cwh-demo] client construction failed:", msg);
    }
    return jsonError("sandbox-offline", 503);
  }

  const command = new InvokeModelWithResponseStreamCommand({
    modelId: CLAUDE_HAIKU_BEDROCK_ID,
    contentType: "application/json",
    accept: "application/json",
    body: JSON.stringify({
      anthropic_version: BEDROCK_ANTHROPIC_VERSION,
      max_tokens: 800,
      temperature: 0.3,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: `Audit this IAM policy:\n\n${policyJson}`,
        },
      ],
    }),
  });

  let response;
  try {
    response = await client.send(command);
  } catch (err) {
    // Surface the AWS error name + code in Vercel logs so the next
    // failure mode is diagnosable without re-deploying. The client
    // still receives a sanitized message — we don't want to leak
    // arn / accountId / region details into the public response.
    const e = err as { name?: string; $metadata?: { httpStatusCode?: number }; message?: string };
    console.error(
      "[cwh-demo] bedrock send failed:",
      JSON.stringify({
        name: e?.name,
        httpStatusCode: e?.$metadata?.httpStatusCode,
        message: e?.message,
      }),
    );

    // AccessDeniedException / ValidationException / ResourceNotFoundException →
    // IAM or model-access misconfiguration. 503 so the widget shows
    // "sandbox temporarily offline" instead of "Bedrock returned an
    // error, try again" (which would be misleading — retrying won't fix
    // an IAM problem).
    const accessDenied =
      e?.name === "AccessDeniedException" ||
      e?.name === "ValidationException" ||
      e?.name === "ResourceNotFoundException" ||
      e?.name === "UnauthorizedException";
    if (accessDenied) {
      return jsonError("sandbox-offline", 503);
    }

    return jsonError("bedrock-error", 502, {
      message: e?.message ?? "unknown",
    });
  }

  if (!response.body) return jsonError("no-stream", 502);

  const encoder = new TextEncoder();
  const decoder = new TextDecoder();
  const upstream = response.body;

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
          // Bedrock anthropic.* streaming events. We only forward the
          // text deltas — start/stop events and tool-use deltas are
          // irrelevant to the sandbox UI.
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
        controller.close();
      } catch (err) {
        console.error(
          "[cwh-demo] stream iteration failed:",
          err instanceof Error ? err.message : "unknown",
        );
        controller.error(err);
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-store",
      "x-rate-limit-max": String(RATE_LIMIT_MAX),
      "x-rate-limit-window": String(RATE_LIMIT_WINDOW_SECONDS),
    },
  });
}
