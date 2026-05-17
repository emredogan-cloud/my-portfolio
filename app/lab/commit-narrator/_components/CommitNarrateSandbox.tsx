"use client";

import { useCallback, useState } from "react";

/**
 * CommitNarrateSandbox — client island for /lab/commit-narrator.
 *
 * V4 Phase 2 — Sub-PR 2.3.
 *
 * Cousin (not sibling) of `IamTranslateSandbox` (Sub-PR 2.1) and
 * `PromptRescueSandbox` (Sub-PR 2.2). All three share the same
 * streaming-output pattern, but this one differs at the *input*
 * shape: a single-line URL field instead of a multi-line
 * textarea. That delta is the entire reason we haven't yet
 * extracted a shared `LabSandbox` — see the Sub-PR 2.3 report
 * for the extraction analysis.
 *
 * Posture:
 *   - URL field pre-filled with the canonical example
 *     `github.com/emredogan-cloud/my-portfolio`, so a first-time
 *     visitor can hit Narrate and see real output without
 *     hunting for a repo.
 *   - `Reset to sample` mirrors the IAM + prompt-rescue sandboxes.
 *   - Streaming via fetch + ReadableStream + TextDecoder. No
 *     third-party SDK on the client.
 *   - Inline error mapper keyed by the route's structured 4xx /
 *     5xx codes — including the URL-specific ones
 *     (`invalid-url`, `url-too-long`, `commits-not-found`).
 *   - `aria-live="polite"` on the output region so screen readers
 *     announce the streamed annotations.
 */

const SAMPLE_URL = "https://github.com/emredogan-cloud/my-portfolio";

type ErrorCode =
  | "empty-url"
  | "invalid-url"
  | "url-too-long"
  | "commits-not-found"
  | "rate-limited"
  | "daily-cost-cap-reached"
  | "sandbox-offline"
  | "bedrock-error"
  | "no-stream"
  | "network";

const ERROR_COPY: Record<ErrorCode, string> = {
  "empty-url": "Paste a github.com repository URL to narrate.",
  "invalid-url":
    "The URL must point at a public github.com repo (owner/repo or full URL).",
  "url-too-long": "URL is too long. Try the canonical github.com form.",
  "commits-not-found":
    "No commits returned for that repo. It might be empty, private, or the URL might be off.",
  "rate-limited":
    "Per-IP rate limit reached for this hour (3 calls/hour — narrator is more expensive than the other experiments).",
  "daily-cost-cap-reached":
    "Sandbox quiet — the daily budget has been reached. Try again tomorrow.",
  "sandbox-offline":
    "Sandbox is temporarily offline. The route can't reach Bedrock.",
  "bedrock-error":
    "Bedrock returned an error. The detail was logged server-side.",
  "no-stream":
    "Upstream did not return a stream. Try again in a moment.",
  network: "Network blip while reading the stream. Try again.",
};

export default function CommitNarrateSandbox() {
  const [url, setUrl] = useState<string>(SAMPLE_URL);
  const [output, setOutput] = useState<string>("");
  const [streaming, setStreaming] = useState<boolean>(false);
  const [error, setError] = useState<ErrorCode | null>(null);

  const handleAnalyze = useCallback(async () => {
    setError(null);
    setOutput("");
    setStreaming(true);
    try {
      const res = await fetch("/api/lab/narrate-commits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
      if (!res.ok) {
        let code: ErrorCode = "bedrock-error";
        try {
          const errBody = (await res.json()) as { error?: string };
          if (errBody?.error && errBody.error in ERROR_COPY) {
            code = errBody.error as ErrorCode;
          }
        } catch {
          /* non-JSON 5xx — treat as generic Bedrock error */
        }
        setError(code);
        setStreaming(false);
        return;
      }
      if (!res.body) {
        setError("no-stream");
        setStreaming(false);
        return;
      }
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      for (;;) {
        const { value, done } = await reader.read();
        if (done) break;
        if (value) setOutput((prev) => prev + decoder.decode(value));
      }
      setStreaming(false);
    } catch {
      setError("network");
      setStreaming(false);
    }
  }, [url]);

  const handleReset = useCallback(() => {
    setUrl(SAMPLE_URL);
    setOutput("");
    setError(null);
  }, []);

  return (
    <div className="space-y-5">
      {/* INPUT — single-line URL field. The label vocab matches
          /telemetry and the other sandboxes; the input shape
          differs because the experiment is genuinely URL-based. */}
      <div>
        <label
          htmlFor="commit-narrator-url"
          className="block font-mono uppercase tracking-[0.20em] text-[10px] text-[#00d2ff]/80 mb-2"
        >
          GitHub repository URL
        </label>
        <input
          id="commit-narrator-url"
          name="commit-narrator-url"
          type="text"
          autoComplete="off"
          autoCapitalize="off"
          spellCheck={false}
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          disabled={streaming}
          placeholder="https://github.com/owner/repo"
          className="w-full font-mono text-[12.5px] leading-[1.65] text-secondary bg-white/[0.02] border border-white/[0.08] rounded-2xl px-4 py-3 outline-none transition-colors duration-300 focus:border-[#00d2ff]/40 focus:bg-white/[0.03] disabled:opacity-60"
        />
        <p className="font-mono uppercase tracking-[0.18em] text-[9px] text-quiet mt-2 flex flex-wrap items-center gap-x-3 gap-y-1">
          <span>Public repos only</span>
          <span className="text-faint">·</span>
          <span>Last 20 commits</span>
          <span className="text-faint">·</span>
          <span>3 calls/hour per IP</span>
          <span className="text-faint">·</span>
          <span>Streamed; not persisted</span>
        </p>
      </div>

      {/* ACTIONS */}
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={handleAnalyze}
          disabled={streaming || url.trim().length === 0}
          className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2 text-sm font-medium text-black transition-opacity duration-300 hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {streaming ? "Narrating…" : "Narrate"}
        </button>
        <button
          type="button"
          onClick={handleReset}
          disabled={streaming}
          className="font-mono uppercase tracking-[0.18em] text-[10px] text-tertiary hover:text-secondary transition-colors duration-300 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Reset to sample
        </button>
      </div>

      {/* OUTPUT */}
      <div className="relative">
        <label
          htmlFor="commit-narrator-output"
          className="block font-mono uppercase tracking-[0.20em] text-[10px] text-[#00d2ff]/80 mb-2"
        >
          Annotations
        </label>
        <div
          id="commit-narrator-output"
          aria-live="polite"
          aria-busy={streaming}
          className="rounded-2xl border border-white/[0.06] bg-white/[0.018] p-5 md:p-6 min-h-[200px]"
        >
          {output ? (
            <pre className="font-mono whitespace-pre-wrap break-words text-[13px] md:text-[13.5px] leading-[1.75] text-secondary">
              {output}
              {streaming && (
                <span
                  aria-hidden="true"
                  className="ml-1 inline-block w-2 h-3.5 align-middle bg-[#00d2ff]/70 animate-pulse"
                />
              )}
            </pre>
          ) : streaming ? (
            <p className="text-tertiary italic text-[14px]">
              Reading commits, drafting annotations…
            </p>
          ) : (
            <p className="text-tertiary italic text-[14px]">
              Per-commit WHY annotations will appear here, separated
              by{" "}
              <code className="font-mono text-primary/80">---</code>{" "}
              dividers. Paste any block back into the commit body
              when amending.
            </p>
          )}
        </div>
        {error && (
          <p className="font-mono uppercase tracking-[0.18em] text-[10px] text-[#00d2ff]/70 mt-3">
            {ERROR_COPY[error]}
          </p>
        )}
      </div>
    </div>
  );
}
