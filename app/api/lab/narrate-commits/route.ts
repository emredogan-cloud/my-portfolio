import { InvokeModelWithResponseStreamCommand } from "@aws-sdk/client-bedrock-runtime";
import {
  getBedrockClient,
  CLAUDE_HAIKU_BEDROCK_ID,
  BEDROCK_ANTHROPIC_VERSION,
} from "@/lib/bedrock-client";
import { COMMIT_NARRATE_SYSTEM_PROMPT } from "@/lib/lab/prompts/commit-narrate";
import {
  consumeRateLimit,
  checkCostCap,
  recordEstimatedCost,
  getClientIp,
} from "@/lib/lab/rate-limit";
import {
  parseGitHubRepoUrl,
  fetchRecentCommits,
  type FetchedCommit,
} from "@/lib/lab/github";
import { incrementMetric, METRIC_KEYS } from "@/lib/telemetry/metrics";
import { captureRouteError } from "@/lib/sentry";

/**
 * `/lab/commit-narrator` backend — V4 Phase 2, Sub-PR 2.3.
 *
 * Pipeline:
 *   1. Validate the visitor's URL via `parseGitHubRepoUrl`.
 *      Reject anything that isn't `github.com/owner/repo`.
 *   2. Rate-limit + cost-cap check (3/hr per IP — lower than the
 *      other lab experiments because each call hits both GitHub
 *      AND Bedrock with a larger context).
 *   3. Octokit list-commits, capped at 20.
 *   4. Single Bedrock streaming call with the commit list flat-
 *      tened into the user prompt. One call > 20 calls — saves
 *      ~95% of the per-call cost and gives the visitor a unified
 *      streaming experience.
 *   5. Telemetry + cost recording on successful completion.
 *
 * Runtime decision: `nodejs`, NOT edge. Same constraint as
 * /api/lab/iam-translate (Bedrock SDK on edge isolates). The
 * `@octokit/rest` dep is also Node-friendly and bundle-large
 * enough that we don't want it on the edge cold start.
 *
 * Bundle posture: `@octokit/rest` is imported only here and in
 * `lib/lab/github.ts`. Both are server-only modules under the
 * route's `nodejs` runtime. Verified post-build that Octokit
 * does not land in any `.next/static/chunks/*.js`.
 */

export const runtime = "nodejs";
export const maxDuration = 30;

const EXPERIMENT_SLUG = "commit-narrator";
const RATE_LIMIT_PER_HOUR = 3;
const MAX_URL_LENGTH = 200;
const ESTIMATED_COST_PER_CALL_USD = 0.004;
const DAILY_COST_CAP_USD = 5;
const COMMIT_FETCH_LIMIT = 20;

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

/**
 * Flatten the commit list into the user-prompt body the model
 * consumes. Per-commit block: short SHA + subject + body
 * (truncated). The model's system prompt instructs it to output
 * one annotation per commit, separated by `---`.
 */
function buildUserPrompt(
  repoUrl: string,
  commits: readonly FetchedCommit[],
): string {
  const lines: string[] = [
    `Repository: ${repoUrl}`,
    `Commits to narrate (newest first, ${commits.length}):`,
    "",
  ];
  for (const c of commits) {
    lines.push(`[${c.shortSha}] ${c.subject}`);
    if (c.body) {
      /* Cap the body at ~600 chars per commit. Long monorepo
       * commits with multi-paragraph bodies otherwise eat the
       * Claude context. The model can still distinguish
       * "annotated commit" from "thin commit" with this much. */
      const trimmed = c.body.length > 600 ? `${c.body.slice(0, 599)}…` : c.body;
      lines.push(trimmed);
    }
    lines.push("");
  }
  return lines.join("\n");
}

export async function POST(req: Request) {
  /* ── Body validation ── */
  let body: { url?: unknown };
  try {
    body = await req.json();
  } catch {
    return jsonError("invalid-json", 400);
  }

  const url = typeof body.url === "string" ? body.url.trim() : "";
  if (!url) return jsonError("empty-url", 400);
  if (url.length > MAX_URL_LENGTH) {
    return jsonError("url-too-long", 413, { limit_bytes: MAX_URL_LENGTH });
  }
  const parsed = parseGitHubRepoUrl(url);
  if (!parsed) return jsonError("invalid-url", 400);

  /* ── Guards (custom 3/hr per V4 § 5.2.3) ── */
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

  void incrementMetric(METRIC_KEYS.LAB_COMMIT_NARRATOR_VISITS_DAILY);

  /* ── GitHub fetch ── */
  const commits = await fetchRecentCommits(parsed, COMMIT_FETCH_LIMIT);
  if (commits.length === 0) {
    return jsonError("commits-not-found", 404, {
      repo: parsed.url,
    });
  }

  /* ── Bedrock client ── */
  let client;
  try {
    client = getBedrockClient();
  } catch (err) {
    const msg = err instanceof Error ? err.message : "unknown";
    if (msg !== "bedrock-not-configured") {
      console.error(
        "[lab:commit-narrator] bedrock client construction failed:",
        msg,
      );
      captureRouteError(err, {
        route: "/api/lab/narrate-commits",
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
      max_tokens: 2400,
      temperature: 0.3,
      system: COMMIT_NARRATE_SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: buildUserPrompt(parsed.url, commits),
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
      "[lab:commit-narrator] bedrock send failed:",
      JSON.stringify({
        name: e?.name,
        httpStatusCode: e?.$metadata?.httpStatusCode,
        message: e?.message,
      }),
    );
    captureRouteError(err, {
      route: "/api/lab/narrate-commits",
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
      /* Stream a small header first — the visitor sees the
       * repo + commit count before the model's annotations
       * arrive, so the page reads as "I fetched something,
       * here's what I'm narrating" rather than a blank box.
       * Pure text; the client side concatenates verbatim. */
      const header = [
        `Repository: ${parsed.url}`,
        `Commits read: ${commits.length} (newest first)`,
        "",
        "",
      ].join("\n");
      controller.enqueue(encoder.encode(header));

      try {
        for await (const event of upstream) {
          const bytes = event.chunk?.bytes;
          if (!bytes) continue;
          let parsedEvent: unknown;
          try {
            parsedEvent = JSON.parse(decoder.decode(bytes));
          } catch {
            continue;
          }
          if (
            typeof parsedEvent === "object" &&
            parsedEvent !== null &&
            (parsedEvent as { type?: unknown }).type ===
              "content_block_delta"
          ) {
            const delta = (
              parsedEvent as { delta?: { text?: unknown } }
            ).delta;
            if (typeof delta?.text === "string") {
              controller.enqueue(encoder.encode(delta.text));
            }
          }
        }
        streamCompleted = true;
        controller.close();
      } catch (err) {
        console.error(
          "[lab:commit-narrator] stream iteration failed:",
          err instanceof Error ? err.message : "unknown",
        );
        captureRouteError(err, {
          route: "/api/lab/narrate-commits",
          tags: { phase: "stream" },
        });
        controller.error(err);
      } finally {
        if (streamCompleted) {
          void incrementMetric(
            METRIC_KEYS.LAB_COMMIT_NARRATOR_COMPLETIONS_DAILY,
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
