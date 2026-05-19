"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { usePathname } from "next/navigation";

import {
  type CognitionSignalBucket,
  inferCognitionSignal,
  SESSION_PAGE_COUNTER_STORAGE_KEY,
} from "@/lib/v5/navigation/cognition";
import { readConsentFromStorage } from "@/lib/v5/perception/consent";

/**
 * V5 Phase 6 Sub-PR 6.2 — cognition context provider.
 *
 * Exposes the current cognition signal (arrival / exploring /
 * engaged), the per-session page counter, and the visitor's
 * perception consent state via a React Context. Sub-PR 6.2 ships
 * ZERO consumers of this hook — the provider exists as a
 * primitive that future sub-PRs (6.5+) and Phase 7-10 surfaces
 * will wrap their components in to read the cognition state for
 * ambient context.
 *
 * Sole-writer contract:
 *   - The COMPANION observer
 *     (`CognitionAwareNavigationObserver`) is the SOLE writer
 *     of the per-session page counter in sessionStorage.
 *   - This provider only READS the counter and infers the state.
 *     It never increments — that would double-count when both
 *     the provider and the observer mount together.
 *   - The observer mounts in the root layout (Sub-PR 6.2). The
 *     provider is wired by future sub-PRs to wrap children where
 *     cognition-aware behavior is wanted.
 *
 * Hydration safety (V5 § 2.8):
 *   - SSR returns the neutral defaults: signal = "arrival",
 *     pageCount = 0, ready = false. The visitor's actual
 *     cognition state cannot be known at SSR time —
 *     sessionStorage and the consent cookie are both client-only
 *     inputs.
 *   - First client effect resolves the real state and flips
 *     `ready` to true. Consumers should branch on `ready` rather
 *     than acting on `signal` directly during the first render.
 *   - The pathname is read via `usePathname()` — server-safe;
 *     returns the current path on both sides. The effect re-runs
 *     on every pathname change so the provider's state stays in
 *     step with the observer.
 *
 * Read ordering note:
 *   The observer's `useEffect` and this provider's `useEffect`
 *   both fire after the pathname commit. React does NOT guarantee
 *   the order between sibling effects, so the provider may
 *   occasionally read a stale counter (the value before the
 *   observer's increment landed). This is acceptable for a
 *   foundation sub-PR — the next pathname change brings them
 *   back in sync. Consumers should treat the signal as an
 *   approximate ambient cue, not a precise event count.
 *
 * Privacy posture:
 *   - The provider reads consent state but never reports the
 *     cognition signal to anything — no telemetry firing here.
 *     The observer is the only HTTP caller.
 *   - When consent is NOT granted, the provider still reads the
 *     counter (which the observer also doesn't increment without
 *     consent) and reports "arrival". No data leaves the device.
 */

export interface CognitionContextValue {
  /** The inferred cognition state for the current session. */
  signal: CognitionSignalBucket;
  /** Number of route mounts the observer has counted this
   *  session. Exposed for consumers that want to display
   *  "n pages explored" affordances; never itself persisted
   *  to KV. */
  pageCount: number;
  /** Whether the perception consent cookie / localStorage flag
   *  is granted in this browser. Sub-PR 6.5+ surfaces can use
   *  this to know whether to render cognition-aware affordances. */
  consentGranted: boolean;
  /** True once the client effect has resolved the real state.
   *  False during SSR and the brief first-render window. */
  ready: boolean;
}

const SSR_DEFAULTS: CognitionContextValue = {
  signal: "arrival",
  pageCount: 0,
  consentGranted: false,
  ready: false,
};

const CognitionContext = createContext<CognitionContextValue>(SSR_DEFAULTS);

/** Read (without incrementing) the per-session page counter.
 *  Defaults to 0 on absent / blocked / corrupted storage. */
function readPageCounter(): number {
  if (typeof window === "undefined") return 0;
  try {
    const raw = window.sessionStorage.getItem(
      SESSION_PAGE_COUNTER_STORAGE_KEY,
    );
    if (raw === null) return 0;
    const n = Number(raw);
    if (!Number.isFinite(n) || n < 0) return 0;
    return Math.min(Math.floor(n), 9999);
  } catch {
    return 0;
  }
}

export default function CognitionAwareProvider({
  children,
}: {
  children: ReactNode;
}) {
  const pathname = usePathname();
  const [state, setState] =
    useState<CognitionContextValue>(SSR_DEFAULTS);

  useEffect(() => {
    const pageCount = readPageCounter();
    const signal = inferCognitionSignal(pageCount);
    const consentGranted = readConsentFromStorage();
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setState({ signal, pageCount, consentGranted, ready: true });
  }, [pathname]);

  /* Memoise to avoid re-rendering every consumer on identical
   * state objects. */
  const value = useMemo(
    () => state,
    [state],
  );

  return (
    <CognitionContext.Provider value={value}>
      {children}
    </CognitionContext.Provider>
  );
}

/** Hook for consumers that want to read the current cognition
 *  state. Returns the SSR defaults when no provider is mounted —
 *  consumers should always behave reasonably under the defaults
 *  (signal = "arrival", ready = false). */
export function useCognition(): CognitionContextValue {
  return useContext(CognitionContext);
}
