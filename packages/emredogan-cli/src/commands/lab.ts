import { getApiBase } from "../api-base.js";

/**
 * `emredogan lab <experiment> "<input>"` — POST to a /lab
 * experiment endpoint and stream the reply to stdout.
 *
 * V4 Phase 2, CLI v0.1.1 expansion. Maps short slugs to the
 * actual route + payload key so callers don't have to know
 * the URL or JSON shape:
 *
 *   iam    | iam-translator    → POST /api/lab/iam-translate
 *                                  { policy: <input> }
 *   prompt | prompt-rescuer    → POST /api/lab/prompt-rescue
 *                                  { prompt: <input> }
 *   commit | commit-narrator   → POST /api/lab/narrate-commits
 *                                  { url: <input> }
 *
 * The backend's per-IP rate limit + per-day cost cap (see
 * `lib/lab/rate-limit.ts`) still apply transparently — the CLI
 * surfaces them as deterministic exit codes.
 *
 * Exit codes (parallel to `ask`):
 *   0  - clean stream completion
 *   1  - usage error (unknown experiment / missing input)
 *   2  - network / fetch error
 *   3  - rate-limited (429)
 *   4  - sandbox offline / cost cap (503)
 *   5  - unexpected upstream error
 */

interface ExperimentSpec {
  /** Route under /api/lab/ */
  path: string;
  /** Key inside the JSON body that holds the visitor input. */
  bodyKey: string;
  /** Human label for help / error messages. */
  label: string;
}

const EXPERIMENT_ALIASES: Record<string, ExperimentSpec> = {
  iam: {
    path: "iam-translate",
    bodyKey: "policy",
    label: "IAM Translator",
  },
  "iam-translator": {
    path: "iam-translate",
    bodyKey: "policy",
    label: "IAM Translator",
  },
  prompt: {
    path: "prompt-rescue",
    bodyKey: "prompt",
    label: "Prompt Rescuer",
  },
  "prompt-rescuer": {
    path: "prompt-rescue",
    bodyKey: "prompt",
    label: "Prompt Rescuer",
  },
  commit: {
    path: "narrate-commits",
    bodyKey: "url",
    label: "Commit Narrator",
  },
  "commit-narrator": {
    path: "narrate-commits",
    bodyKey: "url",
    label: "Commit Narrator",
  },
};

const ERROR_HINT: Record<string, string> = {
  "empty-policy": "Pass the IAM policy as a quoted JSON argument.",
  "policy-too-large": "Trim the policy under 4 KB and try again.",
  "policy-not-json": "The policy didn't parse as JSON. Check brackets + commas.",
  "empty-prompt": "Pass the vague prompt as a quoted argument.",
  "prompt-too-short": "The prompt is too thin to brief. Add a sentence of context.",
  "prompt-too-large": "Trim the prompt under 4 KB and try again.",
  "empty-url": "Pass the GitHub repo URL as a quoted argument.",
  "invalid-url": "The URL must point at a public github.com repo.",
  "url-too-long": "URL is too long. Use the canonical github.com form.",
  "commits-not-found": "No commits returned for that repo.",
  "rate-limited":
    "Per-IP rate limit reached for this hour. Try again in a bit.",
  "daily-cost-cap-reached":
    "Daily budget reached for this experiment. Try again tomorrow.",
  "sandbox-offline":
    "Sandbox is temporarily offline. The route can't reach the model.",
  "no-stream": "Upstream did not return a stream. Try again in a moment.",
};

function printUsage(): void {
  process.stderr.write(
    [
      "[emredogan] missing arguments.",
      "",
      'usage: emredogan lab <experiment> "<input>"',
      "",
      "experiments:",
      "  iam    | iam-translator    paste an IAM policy JSON",
      '  prompt | prompt-rescuer    paste a vague prompt in quotes',
      "  commit | commit-narrator   paste a public github.com repo URL",
      "",
      "examples:",
      "  emredogan lab iam '{\"Effect\":\"Allow\",\"Action\":\"*\",\"Resource\":\"*\"}'",
      "  emredogan lab prompt \"build a chat app with auth and payments\"",
      "  emredogan lab commit \"github.com/emredogan-cloud/my-portfolio\"",
      "",
    ].join("\n"),
  );
}

export async function runLab(
  experimentSlug: string | undefined,
  rawInput: string,
): Promise<number> {
  if (!experimentSlug) {
    printUsage();
    return 1;
  }
  const spec = EXPERIMENT_ALIASES[experimentSlug];
  if (!spec) {
    process.stderr.write(
      `[emredogan] unknown experiment: ${experimentSlug}\n`,
    );
    printUsage();
    return 1;
  }

  const input = rawInput.trim();
  if (!input) {
    process.stderr.write(
      `[emredogan] missing input for ${spec.label}.\n`,
    );
    printUsage();
    return 1;
  }

  const url = `${getApiBase()}/api/lab/${spec.path}`;
  const body = JSON.stringify({ [spec.bodyKey]: input });

  let res: Response;
  try {
    res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "User-Agent": "emredogan-cli",
      },
      body,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "unknown";
    process.stderr.write(`[emredogan] network error: ${msg}\n`);
    return 2;
  }

  if (!res.ok) {
    let code = "upstream-error";
    try {
      const errBody = (await res.json()) as { error?: string };
      if (errBody?.error) code = errBody.error;
    } catch {
      /* non-JSON body — keep the generic code */
    }
    const hint =
      ERROR_HINT[code] ?? `Upstream returned ${res.status}.`;
    process.stderr.write(`[emredogan] ${hint}\n`);
    if (res.status === 429) return 3;
    if (res.status === 503) return 4;
    return 5;
  }

  if (!res.body) {
    process.stderr.write(`[emredogan] ${ERROR_HINT["no-stream"]}\n`);
    return 5;
  }

  /* Drain the stream straight to stdout. The lab routes emit
   * plain UTF-8 text deltas via the same `content_block_delta`
   * projection used by `ask` — no protocol to parse. */
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

  /* Final newline so the next shell prompt lands cleanly. */
  process.stdout.write("\n");
  return 0;
}
