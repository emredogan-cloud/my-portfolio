"use client";

import { useCallback, useState } from "react";

/**
 * IamTranslateSandbox — client island for the /lab/iam-translator
 * experiment. V4 Phase 2, Sub-PR 2.1.
 *
 * Posture:
 *   - The smallest possible interactive surface. Textarea, button,
 *     output region. No tabs, no settings panel, no model picker,
 *     no "advanced options".
 *   - Streaming via fetch + ReadableStream. No third-party SDK on
 *     the client — the /api route does the Bedrock call server-
 *     side, this island just consumes the text stream.
 *   - Pre-fills with a deliberately over-permissive admin policy
 *     so a first-time visitor can hit Analyze and see the
 *     experience without typing anything.
 *   - Error states render inline below the output region —
 *     rate-limit / cost-cap / sandbox-offline / generic. No
 *     toast library, no popup, no overlay.
 *   - prefers-reduced-motion isn't checked here because nothing
 *     animates; the global CSS guard collapses transitions
 *     elsewhere on the page.
 *
 * Privacy: the textarea content is sent verbatim to the server,
 * model, and back. We do not persist it. Visitors should not
 * paste production policies that contain account-specific ARNs
 * if that bothers them — the framing copy on the page calls
 * this out.
 */

const SAMPLE_POLICY = `{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "AdminEverything",
      "Effect": "Allow",
      "Action": "*",
      "Resource": "*"
    }
  ]
}`;

type ErrorCode =
  | "empty-policy"
  | "policy-too-large"
  | "policy-not-json"
  | "rate-limited"
  | "daily-cost-cap-reached"
  | "sandbox-offline"
  | "bedrock-error"
  | "no-stream"
  | "network";

const ERROR_COPY: Record<ErrorCode, string> = {
  "empty-policy": "Paste a policy to translate.",
  "policy-too-large":
    "Policy is too long for the sandbox. Trim it under 4 KB and try again.",
  "policy-not-json":
    "This doesn't parse as JSON. Check the brackets and commas.",
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
  network:
    "Network blip while reading the stream. Try again.",
};

export default function IamTranslateSandbox() {
  const [policy, setPolicy] = useState<string>(SAMPLE_POLICY);
  const [output, setOutput] = useState<string>("");
  const [streaming, setStreaming] = useState<boolean>(false);
  const [error, setError] = useState<ErrorCode | null>(null);

  const handleAnalyze = useCallback(async () => {
    setError(null);
    setOutput("");
    setStreaming(true);
    try {
      const res = await fetch("/api/lab/iam-translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ policy }),
      });
      if (!res.ok) {
        /* Structured error response from the route. We pull `error`
         * out so the inline message can be deterministic instead
         * of leaking raw upstream text. */
        let code: ErrorCode = "bedrock-error";
        try {
          const body = (await res.json()) as { error?: string };
          if (body?.error && body.error in ERROR_COPY) {
            code = body.error as ErrorCode;
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
      /* Pump chunks into output until the stream closes. The route
       * emits plain text deltas already — no SSE parsing needed. */
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
  }, [policy]);

  const handleReset = useCallback(() => {
    setPolicy(SAMPLE_POLICY);
    setOutput("");
    setError(null);
  }, []);

  return (
    <div className="space-y-5">
      {/* INPUT — textarea with the over-permissive sample
          pre-filled. Mono font so the JSON reads as JSON. */}
      <div>
        <label
          htmlFor="iam-policy"
          className="block font-mono uppercase tracking-[0.20em] text-[10px] text-[#00d2ff]/80 mb-2"
        >
          Policy
        </label>
        <textarea
          id="iam-policy"
          name="iam-policy"
          rows={10}
          spellCheck={false}
          value={policy}
          onChange={(e) => setPolicy(e.target.value)}
          disabled={streaming}
          className="w-full font-mono text-[12.5px] leading-[1.65] text-secondary bg-white/[0.02] border border-white/[0.08] rounded-2xl p-4 md:p-5 outline-none transition-colors duration-300 focus:border-[#00d2ff]/40 focus:bg-white/[0.03] disabled:opacity-60"
          style={{ resize: "vertical" }}
        />
        <p className="font-mono uppercase tracking-[0.18em] text-[9px] text-quiet mt-2 flex items-center gap-3">
          <span>{policy.length.toLocaleString("en-US")} chars</span>
          <span className="text-faint">·</span>
          <span>Max 4,000</span>
          <span className="text-faint">·</span>
          <span>Streamed; not persisted</span>
        </p>
      </div>

      {/* ACTIONS */}
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={handleAnalyze}
          disabled={streaming || policy.trim().length === 0}
          className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2 text-sm font-medium text-black transition-opacity duration-300 hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {streaming ? "Translating…" : "Analyze"}
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

      {/* OUTPUT — the streaming brief lands here. Pre-rendered as
          plain text in a glass-edged panel; the model uses
          Markdown-flavoured headings ("### WHAT IT GRANTS") but
          we render them as plain text to match the editorial
          "engineering notebook" feel. */}
      <div className="relative">
        <label
          htmlFor="iam-output"
          className="block font-mono uppercase tracking-[0.20em] text-[10px] text-[#00d2ff]/80 mb-2"
        >
          Translation
        </label>
        <div
          id="iam-output"
          aria-live="polite"
          aria-busy={streaming}
          className="rounded-2xl border border-white/[0.06] bg-white/[0.018] p-5 md:p-6 min-h-[160px]"
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
            <p className="text-tertiary italic text-[14px]">Reading the policy…</p>
          ) : (
            <p className="text-tertiary italic text-[14px]">
              The translation will appear here, streamed live from
              Bedrock.
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
