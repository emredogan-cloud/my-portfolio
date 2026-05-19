"use client";

import { useEffect, useState } from "react";

import {
  clearConsent,
  PERCEPTION_CONSENT_GRANTED,
  PERCEPTION_CONSENT_STORAGE,
  readConsentFromStorage,
  writeConsentGranted,
} from "@/lib/v5/perception/consent";

/**
 * V5 Phase 6 Sub-PR 6.1 — perception opt-in toggle.
 *
 * The single client island on the transparency page. Reads the
 * consent state from localStorage on mount, exposes a toggle the
 * visitor can flip, and records the decision via the adoption
 * category of the perception event endpoint.
 *
 * Hydration safety:
 *   - Server render: button shows "Loading…" in a neutral state.
 *     The visitor's actual consent state cannot be known at SSR
 *     time (it lives in client-side storage / cookie), so the
 *     button MUST default to a placeholder until the client
 *     effect resolves.
 *   - First client paint: the placeholder briefly shows before
 *     the useEffect mutates state. This is intentional and
 *     mirrors the Phase 5.2 capability pattern — never assume a
 *     state at SSR that the client could contradict.
 *
 * Opt-in flow:
 *   1. Visitor clicks "Opt in"
 *   2. localStorage flag set + cookie set (writeConsentGranted)
 *   3. POST adoption/opt_in_granted to the event endpoint
 *      (fire-and-forget; survives navigation via keepalive)
 *   4. UI flips to "Opted in" state
 *
 * Opt-out flow:
 *   1. Visitor clicks "Revoke"
 *   2. localStorage flag cleared + cookie cleared (clearConsent)
 *   3. POST adoption/opt_in_revoked to the event endpoint
 *   4. UI flips back to "Not opted in" state
 *
 * Privacy posture:
 *   - The adoption event fires without consent because it IS the
 *     consent decision. The endpoint enforces this exception.
 *   - No event payload includes any visitor identifier. The
 *     count records "an opt-in happened", not "Emre opted in".
 *   - If the visitor blocks JS, the toggle never renders. The
 *     transparency page text remains fully readable; perception
 *     simply stays in its default-OFF state.
 */

type ConsentState = "loading" | "granted" | "absent";

const EVENT_ENDPOINT = "/api/v5/perception/event";

function postAdoption(signal: "opt_in_granted" | "opt_in_revoked"): void {
  /* Fire-and-forget. keepalive lets the request complete if the
   * visitor navigates away mid-flight. Failures are silent —
   * perception telemetry never blocks the UI. */
  void fetch(EVENT_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ category: "adoption", bucket: signal }),
    keepalive: true,
  }).catch(() => {
    /* swallow */
  });
}

export default function OptInToggle() {
  const [state, setState] = useState<ConsentState>("loading");

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setState(readConsentFromStorage() ? "granted" : "absent");

    /* Listen for cross-tab updates: another tab toggling consent
     * should reflect here on next focus. Cheap; only fires on
     * storage events. */
    function onStorage(e: StorageEvent) {
      if (e.key !== PERCEPTION_CONSENT_STORAGE) return;
      setState(
        e.newValue === PERCEPTION_CONSENT_GRANTED ? "granted" : "absent",
      );
    }
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  function handleOptIn() {
    writeConsentGranted();
    setState("granted");
    postAdoption("opt_in_granted");
  }

  function handleRevoke() {
    clearConsent();
    setState("absent");
    postAdoption("opt_in_revoked");
  }

  if (state === "loading") {
    return (
      <div className="font-mono uppercase tracking-[0.18em] text-[10px] text-tertiary">
        Loading current state…
      </div>
    );
  }

  if (state === "granted") {
    return (
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <span
          className="inline-flex items-center gap-2 font-mono uppercase tracking-[0.18em] text-[10px] text-[#00d2ff]/80"
          aria-live="polite"
        >
          <span
            aria-hidden="true"
            className="inline-block w-1.5 h-1.5 rounded-full bg-[#00d2ff]/80"
          />
          Opted in for this browser
        </span>
        <button
          type="button"
          onClick={handleRevoke}
          className="font-mono uppercase tracking-[0.18em] text-[10px] text-tertiary hover:text-secondary underline underline-offset-4 decoration-white/[0.15] hover:decoration-white/40 transition-colors"
        >
          Revoke
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
      <span
        className="inline-flex items-center gap-2 font-mono uppercase tracking-[0.18em] text-[10px] text-tertiary"
        aria-live="polite"
      >
        <span
          aria-hidden="true"
          className="inline-block w-1.5 h-1.5 rounded-full bg-white/15"
        />
        Not opted in
      </span>
      <button
        type="button"
        onClick={handleOptIn}
        className="font-mono uppercase tracking-[0.18em] text-[10px] text-primary px-3 py-1.5 rounded-full border border-[#00d2ff]/30 hover:border-[#00d2ff]/60 hover:bg-[#00d2ff]/[0.04] transition-colors"
      >
        Opt in
      </button>
    </div>
  );
}
