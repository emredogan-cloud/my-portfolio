import { getApiBase } from "../api-base.js";

/**
 * `emredogan ask "<question>"` — stream a reply from Lumina to
 * stdout. POSTs to the public `/api/cli/ask` endpoint, which uses
 * the same Lumina system prompt that powers the chat widget on
 * the live site, with a per-IP rate limit + per-day cost cap.
 *
 * The endpoint returns plain text (no SSE, no AI-SDK protocol),
 * so the consumer just needs to drain the response body chunk
 * by chunk and write each chunk to stdout. Zero parsing.
 *
 * Failure modes mapped to deterministic exit codes:
 *   0  - clean stream completion
 *   1  - usage error (missing question)
 *   2  - network / fetch error
 *   3  - rate-limited (429)
 *   4  - sandbox offline / cost cap (503)
 *   5  - unexpected upstream error
 */

const ERROR_HINT: Record<string, string> = {
  "empty-question": "Pass the question as a quoted argument.",
  "question-too-long":
    "The question is too long. Trim it under 2,000 characters.",
  "rate-limited":
    "Per-IP rate limit reached for this hour. Try again in a bit.",
  "daily-cost-cap-reached":
    "Daily budget reached for the public Lumina endpoint. Try again tomorrow.",
  "sandbox-offline":
    "Sandbox is temporarily offline. The route can't reach the model right now.",
  "no-stream": "Upstream did not return a stream. Try again in a moment.",
};

export async function runAsk(question: string): Promise<number> {
  const trimmed = question.trim();
  if (!trimmed) {
    process.stderr.write(
      `[emredogan] ${ERROR_HINT["empty-question"]}\n` +
        `usage: emredogan ask "<question>"\n`,
    );
    return 1;
  }

  const url = `${getApiBase()}/api/cli/ask`;

  let res: Response;
  try {
    res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "User-Agent": "emredogan-cli",
      },
      body: JSON.stringify({ question: trimmed }),
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "unknown";
    process.stderr.write(`[emredogan] network error: ${msg}\n`);
    return 2;
  }

  if (!res.ok) {
    let code = "upstream-error";
    try {
      const body = (await res.json()) as { error?: string };
      if (body?.error) code = body.error;
    } catch {
      /* non-JSON body — keep the generic code */
    }
    const hint = ERROR_HINT[code] ?? `Upstream returned ${res.status}.`;
    process.stderr.write(`[emredogan] ${hint}\n`);
    if (res.status === 429) return 3;
    if (res.status === 503) return 4;
    return 5;
  }

  if (!res.body) {
    process.stderr.write(`[emredogan] ${ERROR_HINT["no-stream"]}\n`);
    return 5;
  }

  /* Drain the stream straight to stdout. Each chunk is plain UTF-8
   * text; no parsing, no protocol. */
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  try {
    for (;;) {
      const { value, done } = await reader.read();
      if (done) break;
      if (value) process.stdout.write(decoder.decode(value));
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : "unknown";
    process.stderr.write(`\n[emredogan] stream interrupted: ${msg}\n`);
    return 2;
  }

  /* Final newline so the next shell prompt lands on a fresh line. */
  process.stdout.write("\n");
  return 0;
}
