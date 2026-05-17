"use client";

import { useCallback, useState } from "react";

/**
 * PromptRescueSandbox — client island for /lab/prompt-rescuer.
 *
 * V4 Phase 2 — Sub-PR 2.2.
 *
 * Sibling to `IamTranslateSandbox` (Sub-PR 2.1). Same posture
 * (textarea + Analyze + streaming output + error mapper), three
 * deltas:
 *   1. Pre-fill is a deliberately-vague developer ask, not an
 *      over-permissive IAM policy.
 *   2. No JSON-parse precheck — the input is freeform prose.
 *   3. Different error code set (`empty-prompt` /
 *      `prompt-too-short` / `prompt-too-large` instead of the
 *      JSON-shaped codes).
 *
 * Why not extract a shared `LabSandbox` yet: V4 § 9.3 3-yer
 * rule. Two siblings is not yet a pattern. Sub-PR 2.3 (Commit
 * Narrator) will be the third, and at that point the extraction
 * is justified — but its input shape (a GitHub URL) is different
 * enough that the common surface may turn out narrower than it
 * looks here. Better to defer.
 */

const SAMPLE_PROMPT = `build a chat app with auth and payments`;

type ErrorCode =
  | "empty-prompt"
  | "prompt-too-short"
  | "prompt-too-large"
  | "rate-limited"
  | "daily-cost-cap-reached"
  | "sandbox-offline"
  | "bedrock-error"
  | "no-stream"
  | "network";

const ERROR_COPY: Record<ErrorCode, string> = {
  "empty-prompt": "Paste a one-paragraph prompt to rescue.",
  "prompt-too-short":
    "The prompt is too thin to brief. Add at least a sentence of context.",
  "prompt-too-large":
    "Prompt is too long for the sandbox. Trim it under 4 KB.",
  "rate-limited":
    "Per-IP rate limit reached for this hour. Try again in a bit.",
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

export default function PromptRescueSandbox() {
  const [promptText, setPromptText] = useState<string>(SAMPLE_PROMPT);
  const [output, setOutput] = useState<string>("");
  const [streaming, setStreaming] = useState<boolean>(false);
  const [error, setError] = useState<ErrorCode | null>(null);

  const handleAnalyze = useCallback(async () => {
    setError(null);
    setOutput("");
    setStreaming(true);
    try {
      const res = await fetch("/api/lab/prompt-rescue", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: promptText }),
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
  }, [promptText]);

  const handleReset = useCallback(() => {
    setPromptText(SAMPLE_PROMPT);
    setOutput("");
    setError(null);
  }, []);

  return (
    <div className="space-y-5">
      {/* INPUT — freeform prose textarea. The label intentionally
          calls it "vague prompt" so visitors know the experiment is
          designed for terse input, not polished briefs. */}
      <div>
        <label
          htmlFor="rescue-prompt"
          className="block font-mono uppercase tracking-[0.20em] text-[10px] text-[#00d2ff]/80 mb-2"
        >
          Vague prompt
        </label>
        <textarea
          id="rescue-prompt"
          name="rescue-prompt"
          rows={5}
          spellCheck={false}
          value={promptText}
          onChange={(e) => setPromptText(e.target.value)}
          disabled={streaming}
          className="w-full font-mono text-[12.5px] leading-[1.65] text-secondary bg-white/[0.02] border border-white/[0.08] rounded-2xl p-4 md:p-5 outline-none transition-colors duration-300 focus:border-[#00d2ff]/40 focus:bg-white/[0.03] disabled:opacity-60"
          style={{ resize: "vertical" }}
        />
        <p className="font-mono uppercase tracking-[0.18em] text-[9px] text-quiet mt-2 flex items-center gap-3">
          <span>{promptText.length.toLocaleString("en-US")} chars</span>
          <span className="text-faint">·</span>
          <span>Min 12 · Max 4,000</span>
          <span className="text-faint">·</span>
          <span>Streamed; not persisted</span>
        </p>
      </div>

      {/* ACTIONS */}
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={handleAnalyze}
          disabled={streaming || promptText.trim().length < 12}
          className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2 text-sm font-medium text-black transition-opacity duration-300 hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {streaming ? "Rescuing…" : "Rescue"}
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
          htmlFor="rescue-output"
          className="block font-mono uppercase tracking-[0.20em] text-[10px] text-[#00d2ff]/80 mb-2"
        >
          Engineering brief
        </label>
        <div
          id="rescue-output"
          aria-live="polite"
          aria-busy={streaming}
          className="rounded-2xl border border-white/[0.06] bg-white/[0.018] p-5 md:p-6 min-h-[180px]"
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
              Drafting the brief…
            </p>
          ) : (
            <p className="text-tertiary italic text-[14px]">
              The engineering brief will appear here, streamed live
              from Bedrock. Markdown headings; paste straight into
              Claude Code, Cursor, or Windsurf.
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
