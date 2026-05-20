"use client";

import { useRef, useState, type FormEvent } from "react";
import { motion } from "motion/react";
import { Play, Loader2, AlertCircle } from "lucide-react";

const EASE = [0.22, 1, 0.36, 1] as const;

const DEFAULT_POLICY = `{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": "*",
      "Resource": "*"
    }
  ]
}`;

const ERROR_LABEL: Record<string, string> = {
  "empty-policy": "Paste a policy first.",
  "invalid-json": "Request body is not valid JSON.",
  "policy-not-json": "That doesn't parse as JSON. Check braces and quotes.",
  "policy-too-large":
    "Policy is too long for the demo (4KB limit). Shrink and retry.",
  "rate-limited":
    "You've hit the sandbox limit (5 / hour). The production CWH SaaS has no such cap.",
  "sandbox-offline":
    "The sandbox is temporarily offline. The 3D topology and overview are still live.",
  "bedrock-error": "Bedrock returned an error. Try again in a moment.",
  "no-stream": "Upstream returned no body. Try again in a moment.",
};

const PLACEHOLDER = `Paste your IAM policy JSON here, or use the example above and hit Analyze.`;

interface Props {
  /** Hides decorative loop animations under prefers-reduced-motion;
   *  the parent already gates this at the page level for the topology
   *  scene, but the sandbox lives in the same section and should match. */
  reducedMotion?: boolean;
}

/**
 * CWH inline sandbox — pastes an IAM policy, streams Claude 3.5
 * Haiku's auditor response from /api/cwh-demo (Bedrock).
 *
 * Composition rules followed:
 *   - No new colors (cyan #00d2ff + the existing token palette).
 *   - Single motion engine (motion/react) — no extra animation libs.
 *   - Touch targets pass the 44px audit (Analyze button is 44px tall).
 *   - Reduced-motion: the streaming dots collapse to a static "Analyzing"
 *     pill via the existing global guard in globals.css.
 */
export default function CWHSandbox({ reducedMotion = false }: Props) {
  const [policy, setPolicy] = useState(DEFAULT_POLICY);
  const [output, setOutput] = useState("");
  const [status, setStatus] = useState<
    "idle" | "streaming" | "done" | "error"
  >("idle");
  const [errorCode, setErrorCode] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const isBusy = status === "streaming";

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (isBusy) return;

    setOutput("");
    setErrorCode(null);
    setStatus("streaming");

    const controller = new AbortController();
    abortRef.current = controller;

    let res: Response;
    try {
      res = await fetch("/api/cwh-demo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ policyJson: policy }),
        signal: controller.signal,
      });
    } catch {
      setStatus("error");
      setErrorCode("bedrock-error");
      return;
    }

    if (!res.ok) {
      try {
        const data = (await res.json()) as { error?: string };
        setErrorCode(data.error ?? "bedrock-error");
      } catch {
        setErrorCode("bedrock-error");
      }
      setStatus("error");
      return;
    }

    if (!res.body) {
      setStatus("error");
      setErrorCode("no-stream");
      return;
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    try {
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        if (value) setOutput((prev) => prev + decoder.decode(value));
      }
      setStatus("done");
    } catch {
      setStatus("error");
      setErrorCode("bedrock-error");
    }
  };

  return (
    <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-5 md:p-6">
      <form onSubmit={handleSubmit} className="space-y-4">
        <label htmlFor="cwh-policy-input" className="block">
          <span className="block text-xs font-medium text-quiet tracking-widest uppercase mb-2">
            IAM Policy JSON
          </span>
          <textarea
            id="cwh-policy-input"
            value={policy}
            onChange={(e) => setPolicy(e.target.value)}
            spellCheck={false}
            rows={10}
            disabled={isBusy}
            placeholder={PLACEHOLDER}
            aria-describedby="cwh-policy-hint"
            className="w-full rounded-xl border border-[#00d2ff]/15 bg-[#050505] px-4 py-3 text-xs sm:text-sm font-mono leading-relaxed text-primary placeholder-white/30 outline-none focus:border-[#00d2ff]/45 disabled:opacity-60 transition-colors"
            style={{
              boxShadow:
                "inset 0 1px 1px rgba(255,255,255,0.04), 0 0 14px rgba(0,210,255,0.10)",
            }}
          />
          <p id="cwh-policy-hint" className="mt-1.5 text-[11px] text-tertiary">
            4KB max. 5 analyses per visitor per hour. Pasted policies aren't stored.
          </p>
        </label>

        <div className="flex items-center justify-between gap-3 flex-wrap">
          <button
            type="submit"
            disabled={isBusy}
            className="inline-flex items-center justify-center gap-2 rounded-full bg-white text-black font-semibold text-sm px-6 min-h-[44px] transition-colors hover:bg-white/90 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isBusy ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                Analyzing
              </>
            ) : (
              <>
                <Play className="w-4 h-4" aria-hidden="true" />
                Analyze
              </>
            )}
          </button>
          <span className="text-[11px] uppercase tracking-[0.18em] text-quiet">
            Live · Claude 3.5 Haiku via AWS Bedrock
          </span>
        </div>
      </form>

      {/* Output region — always rendered for screen readers (aria-live).
          Visual content swaps between idle hint, streaming text, and
          error pill. */}
      <div className="mt-5">
        {status === "error" && errorCode && (
          <div
            role="alert"
            className="flex items-start gap-2 rounded-lg border border-amber-400/25 bg-amber-400/[0.07] px-3 py-2 text-xs text-amber-200/90"
          >
            <AlertCircle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" aria-hidden="true" />
            <span>{ERROR_LABEL[errorCode] ?? errorCode}</span>
          </div>
        )}

        {output && (
          <motion.div
            initial={reducedMotion ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4, ease: EASE }}
            className="rounded-xl border border-white/[0.08] bg-black/40 p-4"
          >
            <div className="flex items-center gap-2 mb-3 text-[10px] uppercase tracking-[0.18em] text-[#00d2ff]/80">
              {isBusy && (
                <span className="inline-flex gap-1" aria-hidden="true">
                  <span className="w-1 h-1 rounded-full bg-[#00d2ff] terminal-cursor-blink" />
                  <span
                    className="w-1 h-1 rounded-full bg-[#00d2ff] terminal-cursor-blink"
                    style={{ animationDelay: "0.25s" }}
                  />
                  <span
                    className="w-1 h-1 rounded-full bg-[#00d2ff] terminal-cursor-blink"
                    style={{ animationDelay: "0.5s" }}
                  />
                </span>
              )}
              Auditor output
            </div>
            <div
              role="status"
              aria-live="polite"
              className="text-sm leading-relaxed text-primary whitespace-pre-wrap font-mono"
            >
              {output}
            </div>
          </motion.div>
        )}

        {status === "idle" && !output && (
          <p className="text-[11px] text-quiet italic">
            Output appears here. The same model and prompt power the
            production CWH remediation feed.
          </p>
        )}
      </div>
    </div>
  );
}
