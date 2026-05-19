"use client";

import { useEffect } from "react";

/**
 * V5 Phase 7 Sub-PR 7.1 — temporal adoption beacon.
 *
 * The single client island on the /evolution page beyond the
 * existing `VisitPing`. Reads the URL on mount and fires up to
 * two adoption events through `/api/v5/temporal/adoption`:
 *
 *   - `category_view` when the URL carries `?category=<known>`.
 *     The producer is the link the visitor clicked; recording
 *     the arrival here lets the operator see which categories
 *     earn engagement.
 *   - `event_view` when the URL carries a hash that looks like
 *     a valid event id. The producer is either an external
 *     deep-link or the in-page `#<id>` anchor a visitor copied;
 *     either way, the signal is "someone arrived at a specific
 *     event".
 *
 * Both fires are session-deduped via sessionStorage so an F5
 * reload doesn't double-count. Different combinations of
 * category + hash each get their own sessionStorage key.
 *
 * Hydration safety
 *   - Renders null on SSR and on the first client render.
 *   - The `useEffect` runs AFTER commit; its window / location
 *     reads never contribute to the SSR snapshot.
 *
 * Privacy posture
 *   - Aggregate-only. Both events land in a KV hash by event
 *     kind; no per-visitor identifier, no URL string, no
 *     timestamp.
 *   - The endpoint has no consent gate (the temporal layer is
 *     a public archive — no per-visitor data exists in any of
 *     the three counters). This is intentional asymmetry with
 *     the perception layer, which IS per-visitor-derived and
 *     therefore consent-gated.
 *   - The beacon never sends the actual category / event id —
 *     only the boolean fact "a category filter was applied" or
 *     "an event was deep-linked". The operator sees only the
 *     count of arrivals per kind.
 *
 * Idle CPU
 *   - 0%. The effect runs once on mount per page; no timers,
 *     no listeners, no observers.
 */

const ENDPOINT = "/api/v5/temporal/adoption";
const STORAGE_PREFIX = "v5:temporal:adoption:fired:";

function alreadyFired(slot: string): boolean {
  try {
    return window.sessionStorage.getItem(`${STORAGE_PREFIX}${slot}`) === "1";
  } catch {
    return false;
  }
}

function markFired(slot: string): void {
  try {
    window.sessionStorage.setItem(`${STORAGE_PREFIX}${slot}`, "1");
  } catch {
    /* sessionStorage blocked — acceptable; worst case is one
     * extra count per reload in that edge case. */
  }
}

function postKind(kind: "view" | "category_view" | "event_view"): void {
  void fetch(ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ kind }),
    keepalive: true,
  }).catch(() => {
    /* swallow — temporal telemetry never blocks the page */
  });
}

export default function AdoptionBeacon() {
  useEffect(() => {
    if (typeof window === "undefined") return;

    /* view — fired once per session per pathname. This pairs
     * the V4 scalar visit count with the V5 hash counter so the
     * operator can correlate the two for drift detection. */
    const viewSlot = `view:${window.location.pathname}`;
    if (!alreadyFired(viewSlot)) {
      markFired(viewSlot);
      postKind("view");
    }

    /* category_view — fired once per session per category value
     * present in the URL. Different categories each get their own
     * slot so a visitor browsing several filters in one session
     * contributes one count per filter, not one for the session. */
    const params = new URLSearchParams(window.location.search);
    const category = params.get("category");
    if (category && /^[a-z0-9][a-z0-9-]{1,40}$/.test(category)) {
      const slot = `category_view:${category}`;
      if (!alreadyFired(slot)) {
        markFired(slot);
        postKind("category_view");
      }
    }

    /* event_view — fired once per session per hash value. The
     * hash is the `id` of an event in the registry; we don't
     * validate against the registry from the client (that would
     * require importing the data file into the bundle). Instead
     * we accept the same syntactic shape the schema's ID_PATTERN
     * permits — kebab-case, max 80 chars. */
    const hash = window.location.hash.replace(/^#/, "");
    if (hash && /^[a-z0-9][a-z0-9-]{1,79}$/.test(hash)) {
      const slot = `event_view:${hash}`;
      if (!alreadyFired(slot)) {
        markFired(slot);
        postKind("event_view");
      }
    }
  }, []);

  return null;
}
