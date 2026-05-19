"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

import {
  inferCognitionSignal,
  SESSION_PAGE_COUNTER_STORAGE_KEY,
} from "@/lib/v5/navigation/cognition";
import { bucketNavigationFlow } from "@/lib/v5/navigation/flow";
import { readConsentFromStorage } from "@/lib/v5/perception/consent";

/**
 * V5 Phase 6 Sub-PR 6.2 — cognition-aware navigation observer.
 *
 * The single client island the root layout mounts to feed the
 * perception layer with navigation-flow + cognition-signal events.
 * Renders null. Idle CPU is zero — the observer's only work is a
 * `useEffect` that reads sessionStorage + the consent flag and
 * fires `fetch` when the pathname changes.
 *
 * Event pipeline per pathname change:
 *
 *   1. Read perception consent from localStorage. If absent,
 *      stop — no telemetry fires.
 *   2. Bump the per-session page counter in sessionStorage.
 *   3. Infer the cognition signal (arrival / exploring / engaged)
 *      from the fresh counter.
 *   4. Fire `cognition-signal` to /api/v5/perception/event.
 *   5. If a prior pathname is recorded (i.e. this is not the
 *      initial mount of the session), also fire `navigation-flow`
 *      with the `from>to` bucket.
 *
 * Why the consent check is client-side here (in addition to the
 * server-side cookie gate at the endpoint):
 *   - It saves the HTTP round-trip when the visitor hasn't opted
 *     in. The endpoint would 204 anyway, but skipping the request
 *     entirely is cheaper.
 *   - It avoids leaking the navigation-flow signal in any tracing
 *     / debugging proxy the visitor might be running. Cookie-gated
 *     server drops are private to the operator's KV; HTTP requests
 *     are observable on the visitor's network.
 *
 * Hydration safety (V5 § 2.8):
 *   - Renders null on SSR and on the first client render.
 *   - The `useEffect` runs AFTER commit, so its sessionStorage /
 *     consent reads never contribute to the SSR snapshot.
 *   - The pathname value is the same on both sides
 *     (`usePathname()` is SSR-safe), so the effect's dependency
 *     array doesn't change identity across the hydration boundary.
 *
 * Reduced-motion / mobile / idle CPU:
 *   - No motion. No CSS animation. Nothing for the global guard to
 *     suppress.
 *   - Mobile: identical behavior. Pathname changes fire the same
 *     way; sessionStorage works on mobile browsers.
 *   - Idle CPU: 0%. The effect fires only on pathname change,
 *     which is a user action. No timers, no listeners outside the
 *     React lifecycle.
 *
 * Privacy posture:
 *   - Same fire-and-forget contract as Phase 5.4's playground
 *     events: `keepalive: true`, swallow failures, never block UI.
 *   - The endpoint validates category + bucket allow-list + the
 *     consent cookie BEFORE writing to KV. Even if a malicious
 *     actor crafted requests against the endpoint, no malformed
 *     payload would reach the aggregate.
 */

const EVENT_ENDPOINT = "/api/v5/perception/event";

function postEvent(category: string, bucket: string): void {
  void fetch(EVENT_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ category, bucket }),
    keepalive: true,
  }).catch(() => {
    /* swallow — perception telemetry never blocks */
  });
}

export default function CognitionAwareNavigationObserver() {
  const pathname = usePathname();
  /* Track the previous pathname across renders without re-firing
   * the effect on prevPath change. The ref starts null and gets
   * updated at the end of every effect run. */
  const prevPathRef = useRef<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (typeof pathname !== "string" || !pathname) return;

    /* Consent gate. The endpoint will also drop non-adoption
     * events without a granted cookie, but skipping the HTTP
     * round-trip here saves CPU + network when the visitor
     * hasn't opted in. */
    if (!readConsentFromStorage()) {
      /* Still record the prior path so a later opt-in mid-session
       * doesn't think the upcoming navigation is the first. */
      prevPathRef.current = pathname;
      return;
    }

    /* Increment-and-read the per-session page counter. Match the
     * logic in CognitionAwareProvider so the two stay in sync —
     * the counter is in sessionStorage; both readers see the same
     * value because both increment exactly once per pathname
     * mount. */
    let pageCount = 1;
    try {
      const raw = window.sessionStorage.getItem(
        SESSION_PAGE_COUNTER_STORAGE_KEY,
      );
      const prior = raw === null ? 0 : Math.max(0, Number(raw) || 0);
      pageCount = Math.min(prior + 1, 9999);
      window.sessionStorage.setItem(
        SESSION_PAGE_COUNTER_STORAGE_KEY,
        String(pageCount),
      );
    } catch {
      /* sessionStorage blocked — assume arrival */
    }

    const signal = inferCognitionSignal(pageCount);

    /* Always fire the cognition-signal event. Even on first mount
     * (arrival), recording the state of the session is the point. */
    postEvent("cognition-signal", signal);

    /* Fire navigation-flow only when a prior path exists AND the
     * helper produces a non-null bucket (self-loops, denylisted
     * routes, and unrecognisable paths all return null). */
    const prev = prevPathRef.current;
    if (prev !== null && prev !== pathname) {
      const bucket = bucketNavigationFlow(prev, pathname);
      if (bucket) {
        postEvent("navigation-flow", bucket);
      }
    }

    prevPathRef.current = pathname;
  }, [pathname]);

  return null;
}
