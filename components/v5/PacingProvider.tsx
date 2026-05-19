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
  inferCognitionSignal,
  SESSION_PAGE_COUNTER_STORAGE_KEY,
  type CognitionSignalBucket,
} from "@/lib/v5/navigation/cognition";
import {
  inferPacingMultiplier,
  type PacingInference,
} from "@/lib/v5/pacing/inference";
import {
  EASE_OUT_CURVE,
  PACING_MULTIPLIERS,
  pacedDuration,
  pacedSeconds,
  type PacingMultiplier,
} from "@/lib/v5/pacing/multipliers";
import {
  bucketTransitionsPerSession,
  PACING_TRANSITION_FIRED_STORAGE_KEY,
} from "@/lib/v5/pacing/telemetry";
import { readConsentFromStorage } from "@/lib/v5/perception/consent";

/**
 * V5 Phase 6 Sub-PR 6.3 — cinematic pacing provider.
 *
 * The Provider exposes the current pacing multiplier (and the
 * derived cognition + reduced-motion inputs) to any consumer
 * that wraps inside it. Sub-PR 6.3 mounts this at the root
 * layout; no consumer reads from it yet — that's deliberate
 * scope discipline (the Reveal retrofit, Phase 7+ surfaces, the
 * adaptive recruiter interface all defer their consumption
 * until subsequent sub-PRs).
 *
 * What the Provider does in 6.3:
 *   1. Reads the per-session page counter that Sub-PR 6.2's
 *      navigation observer maintains in sessionStorage.
 *   2. Reads the visitor's reduced-motion preference via
 *      `matchMedia`.
 *   3. Infers the pacing tier (FULL / MID / SNAPPY / STILL) and
 *      multiplier (1.0 / 0.85 / 0.65 / 0.0).
 *   4. Exposes the result via `usePacing()`.
 *   5. Fires the `pacing-transition` perception event ONCE per
 *      session on `visibilitychange → hidden`, with the bucketed
 *      transition count — gated on the visitor's perception
 *      consent. Uses `navigator.sendBeacon` so the event lands
 *      even if the tab closes.
 *
 * Spring physics ban (V5 § 2.5):
 *   The Provider's public API is a single scalar multiplier and
 *   a static ease-out cubic-bezier. There is no `damping`,
 *   `stiffness`, `mass`, or `velocity` field anywhere — these
 *   would require rewriting the module, which is the rollback
 *   boundary the V5 doc demands. Type-system enforcement.
 *
 * Hydration safety (V5 § 2.8):
 *   - SSR returns the neutral default: tier = "FULL",
 *     multiplier = 1.0, ready = false. The cinematic baseline
 *     is what the server renders.
 *   - First client effect resolves the real multiplier from
 *     sessionStorage + matchMedia and flips `ready` to true.
 *     Consumers SHOULD branch on `ready` only if they need to
 *     differentiate the SSR snapshot from the first client
 *     paint; for most consumers, the multiplier flip is
 *     subliminal and doesn't need branching.
 *   - The pathname is read via `usePathname()` — server-safe;
 *     re-running the effect on pathname change keeps the
 *     multiplier in step with the cognition signal that the
 *     navigation observer advances.
 *
 * Reduced-motion:
 *   - When `prefers-reduced-motion: reduce` is active, the
 *     inference helper returns STILL (multiplier = 0).
 *   - The CSS guard in `app/globals.css` is what actually
 *     collapses any animation to 0.01ms; this multiplier is
 *     the engine being HONEST about its own state so consumers
 *     that want to branch (e.g. show a static frame vs a
 *     transition) can.
 *
 * Idle CPU:
 *   - 0%. The only listener is `visibilitychange`, which fires
 *     on user action (tab background/foreground). No timers,
 *     no scroll listener, no intersection observer.
 *
 * Privacy posture:
 *   - The Provider reads `sessionStorage` + `matchMedia` only.
 *     No fingerprint, no identifier, no PII.
 *   - The visibility-fired event uses `sendBeacon`. The endpoint
 *     enforces the consent cookie + env switch; the client also
 *     skips the beacon entirely when consent is absent.
 *   - Once-per-session dedupe via a sessionStorage flag prevents
 *     the bucket from being recorded multiple times if the
 *     visitor switches tabs back and forth.
 */

const EVENT_ENDPOINT = "/api/v5/perception/event";

export interface PacingContextValue extends PacingInference {
  /** True once the client effect has resolved the real
   *  multiplier. False during SSR and the first render. */
  ready: boolean;
  /** The cognition signal the inference is based on. Re-exposed
   *  so consumers don't need a separate Context. */
  cognition: CognitionSignalBucket;
  /** The visitor's reduced-motion preference. */
  prefersReducedMotion: boolean;
  /** The fixed ease-out cubic-bezier the pacing law mandates.
   *  Exposed as a stable readonly tuple for consumers that
   *  pass `transition.ease` directly. */
  ease: readonly [number, number, number, number];
  /** Bound helpers: apply the current multiplier to a base
   *  duration in ms or seconds. Saves consumers a double-import
   *  of the helper + multiplier. */
  pacedMs: (baseMs: number) => number;
  pacedSec: (baseSeconds: number) => number;
}

const SSR_DEFAULTS: PacingContextValue = {
  tier: "FULL",
  multiplier: PACING_MULTIPLIERS.FULL,
  ready: false,
  cognition: "arrival",
  prefersReducedMotion: false,
  ease: EASE_OUT_CURVE,
  pacedMs: (ms: number) =>
    pacedDuration(ms, PACING_MULTIPLIERS.FULL),
  pacedSec: (s: number) =>
    pacedSeconds(s, PACING_MULTIPLIERS.FULL),
};

const PacingContext = createContext<PacingContextValue>(SSR_DEFAULTS);

/** Read (without incrementing) the per-session page counter
 *  maintained by Sub-PR 6.2's CognitionAwareNavigationObserver.
 *  Defaults to 0 when storage is absent / blocked / corrupted. */
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

/** Read the reduced-motion preference via matchMedia. Defaults
 *  to `false` (motion allowed) when matchMedia is blocked or
 *  unavailable — same posture as
 *  `lib/playground/capabilities.ts`. */
function readReducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return (
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    );
  } catch {
    return false;
  }
}

/** Mark the once-per-session pacing-transition fire as done.
 *  Returns true on first call in the session, false on every
 *  subsequent call — used by the visibilitychange listener to
 *  dedupe. Storage-blocked browsers fall through to "always
 *  treat as first" which is the honest degradation. */
function claimFireSlot(): boolean {
  if (typeof window === "undefined") return false;
  try {
    if (
      window.sessionStorage.getItem(PACING_TRANSITION_FIRED_STORAGE_KEY) ===
      "fired"
    ) {
      return false;
    }
    window.sessionStorage.setItem(
      PACING_TRANSITION_FIRED_STORAGE_KEY,
      "fired",
    );
    return true;
  } catch {
    return true;
  }
}

/** Send the bucketed pacing-transition event via sendBeacon.
 *  Falls back to a keepalive fetch when sendBeacon is
 *  unavailable. Failures swallow silently — telemetry never
 *  blocks anything. */
function fireTransitionBeacon(bucket: string): void {
  const body = JSON.stringify({
    category: "pacing-transition",
    bucket,
  });
  if (typeof navigator !== "undefined" && "sendBeacon" in navigator) {
    try {
      const blob = new Blob([body], { type: "application/json" });
      const ok = navigator.sendBeacon(EVENT_ENDPOINT, blob);
      if (ok) return;
    } catch {
      /* fall through to fetch */
    }
  }
  /* sendBeacon unsupported or failed: best-effort keepalive
   * fetch. The browser may abort if the tab is unloading. */
  void fetch(EVENT_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
    keepalive: true,
  }).catch(() => {
    /* swallow */
  });
}

export default function PacingProvider({
  children,
}: {
  children: ReactNode;
}) {
  const pathname = usePathname();
  const [state, setState] =
    useState<PacingContextValue>(SSR_DEFAULTS);

  /* Effect 1: keep the multiplier in step with the cognition
   * signal + reduced-motion preference. Re-runs on pathname
   * change so the cognition counter advance (Sub-PR 6.2) is
   * picked up. */
  useEffect(() => {
    const pageCount = readPageCounter();
    const cognition = inferCognitionSignal(pageCount);
    const prefersReducedMotion = readReducedMotion();
    const inference = inferPacingMultiplier(
      cognition,
      prefersReducedMotion,
    );
    const multiplier: PacingMultiplier = inference.multiplier;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setState({
      tier: inference.tier,
      multiplier,
      ready: true,
      cognition,
      prefersReducedMotion,
      ease: EASE_OUT_CURVE,
      pacedMs: (ms: number) => pacedDuration(ms, multiplier),
      pacedSec: (s: number) => pacedSeconds(s, multiplier),
    });
  }, [pathname]);

  /* Effect 2: subscribe to reduced-motion changes mid-session.
   * Visitors who toggle the OS preference while the tab is
   * open should see the multiplier flip immediately. */
  useEffect(() => {
    if (typeof window === "undefined") return;
    let media: MediaQueryList | null = null;
    let handler: ((e: MediaQueryListEvent) => void) | null = null;
    try {
      media = window.matchMedia("(prefers-reduced-motion: reduce)");
      handler = (e) => {
        const cognition = inferCognitionSignal(readPageCounter());
        const inference = inferPacingMultiplier(cognition, e.matches);
        const multiplier = inference.multiplier;
        setState({
          tier: inference.tier,
          multiplier,
          ready: true,
          cognition,
          prefersReducedMotion: e.matches,
          ease: EASE_OUT_CURVE,
          pacedMs: (ms: number) => pacedDuration(ms, multiplier),
          pacedSec: (s: number) => pacedSeconds(s, multiplier),
        });
      };
      media.addEventListener("change", handler);
    } catch {
      /* matchMedia blocked — no subscription, leave multiplier
       * at whatever Effect 1 resolved. */
    }
    return () => {
      if (media && handler) {
        try {
          media.removeEventListener("change", handler);
        } catch {
          /* ignore */
        }
      }
    };
  }, []);

  /* Effect 3: visibility:hidden observer for the once-per-
   * session pacing-transition beacon. Listener stays
   * subscribed for the Provider's lifetime (i.e. the whole
   * tab); idle CPU is zero — the handler only runs when
   * visibility actually changes. */
  useEffect(() => {
    if (typeof document === "undefined") return;

    function onVisibilityChange() {
      if (document.visibilityState !== "hidden") return;
      /* Consent gate: skip the beacon entirely if the visitor
       * hasn't opted in. The endpoint would 204 anyway, but
       * skipping is cheaper AND avoids leaking the signal to
       * any debugging proxy the visitor runs. */
      if (!readConsentFromStorage()) return;
      /* Dedupe: only fire on first visibility:hidden of the
       * session. */
      if (!claimFireSlot()) return;
      const count = readPageCounter();
      const bucket = bucketTransitionsPerSession(count);
      fireTransitionBeacon(bucket);
    }

    document.addEventListener("visibilitychange", onVisibilityChange);
    return () =>
      document.removeEventListener("visibilitychange", onVisibilityChange);
  }, []);

  /* Memoise so consumers don't re-render on identical state
   * objects. */
  const value = useMemo(() => state, [state]);

  return (
    <PacingContext.Provider value={value}>
      {children}
    </PacingContext.Provider>
  );
}

/** Hook for consumers that want to read the current pacing
 *  state. Returns SSR defaults when no Provider is mounted,
 *  so consumers behave reasonably without the wrapper. */
export function usePacing(): PacingContextValue {
  return useContext(PacingContext);
}
