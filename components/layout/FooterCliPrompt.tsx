"use client";

import { useCallback, useEffect, useState } from "react";

/**
 * Footer CLI prompt — quiet `npx emredogan ask "Who is Emre?"`
 * one-liner with click-to-copy.
 *
 * Phase 2 polish (CLI discovery). Sits next to the existing
 * BuildBeacon + LiveCustomerCounter in the global footer.
 *
 * Posture decisions:
 *   - One-line monospace, lowercase, matte. NOT a CTA card.
 *     The visitor scans the footer and the line reads as a
 *     terminal session that someone forgot to close.
 *   - Click anywhere on the line copies the command to the
 *     clipboard. No floating clipboard icon — the whole
 *     element is the target.
 *   - "Copied" feedback is a brief 1.2s text swap on the right.
 *     No toasts, no overlays, no aria-live announcements that
 *     interrupt screen readers.
 *   - Reduced-motion / accessibility: the colour change on
 *     copy is a pure opacity transition. No animation needed.
 */

const COMMAND = `npx emredogan ask "Who is Emre?"`;

export default function FooterCliPrompt() {
  const [copied, setCopied] = useState<boolean>(false);

  /* Clear the "copied" state after 1.2s. setTimeout cleanup
   * guards against fast double-clicks leaving stale state if
   * the visitor navigates away mid-feedback. */
  useEffect(() => {
    if (!copied) return;
    const t = window.setTimeout(() => setCopied(false), 1200);
    return () => window.clearTimeout(t);
  }, [copied]);

  const handleCopy = useCallback(async () => {
    /* Older Safari + some mobile WebViews don't have
     * navigator.clipboard. Fall back to a hidden textarea +
     * execCommand("copy") path, which still works on every
     * browser the rest of the site supports. */
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(COMMAND);
        setCopied(true);
        return;
      }
    } catch {
      /* permissions denied — fall through to the textarea path */
    }
    try {
      const el = document.createElement("textarea");
      el.value = COMMAND;
      el.setAttribute("readonly", "");
      el.style.position = "absolute";
      el.style.left = "-9999px";
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
      setCopied(true);
    } catch {
      /* swallow — copy failed; the visitor can still
       * highlight + cmd-c the visible text. */
    }
  }, []);

  return (
    <button
      type="button"
      onClick={handleCopy}
      aria-label="Copy the emredogan CLI ask command to the clipboard"
      title="Click to copy"
      className="group inline-flex items-center gap-2.5 font-mono text-[11px] text-quiet hover:text-tertiary transition-colors duration-300"
    >
      <span aria-hidden="true" className="text-[#00d2ff]/70">
        {">_"}
      </span>
      <span className="text-tertiary/90 group-hover:text-secondary transition-colors duration-300">
        npx emredogan ask{" "}
        <span className="text-[#00d2ff]/80">&quot;Who is Emre?&quot;</span>
      </span>
      <span
        aria-live="polite"
        className="font-mono uppercase tracking-[0.18em] text-[9px] text-[#00d2ff]/70 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
      >
        {copied ? "copied" : "copy"}
      </span>
    </button>
  );
}
