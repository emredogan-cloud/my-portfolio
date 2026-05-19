import {
  inferCognitionSignal,
  SESSION_PAGE_COUNTER_STORAGE_KEY,
} from "@/lib/v5/navigation/cognition";

import {
  type ContactSignals,
  NEUTRAL_SIGNALS,
} from "./schema";

/**
 * V5 Phase 8 Sub-PR 8.5 — client-side signal readers.
 *
 * Pure helpers that read CLIENT-ONLY session state. The
 * server side has no access to these signals; the
 * AdaptivePatternProvider (when eventually mounted) is the
 * sole consumer.
 *
 * Signal sources (all client-only, all session-scoped):
 *
 *   1. cognitionSignal — derived from the Phase 6.2 page
 *      counter (`v5:perception:navigation:page-count` in
 *      sessionStorage). The Phase 6.2 navigation observer
 *      maintains the counter; we read it as-is and run the
 *      same inferCognitionSignal helper the rest of the
 *      perception layer uses.
 *
 *   2. pageCount — the same counter as above, surfaced
 *      separately so classifiers can use raw count too
 *      (e.g., > 8 pages = highly engaged regardless of
 *      cognition bucket).
 *
 *   3. referrer — `document.referrer`. Preserved for the
 *      lifetime of the tab; the recruiter classifier reads
 *      it for LinkedIn detection.
 *
 *   4. visitedPrefixes — Set of kebab-case route prefixes
 *      the visitor has touched during this session. Tracked
 *      in sessionStorage at `v5:contact:visited-prefixes`
 *      as a JSON-encoded string[]. Updated by a future
 *      observer (not mounted in 8.5). Read here as a Set
 *      for O(1) membership lookups.
 *
 * Privacy posture
 *   - All reads are SESSION-SCOPED. sessionStorage drops on
 *     tab close — no cross-session linking.
 *   - No identifier is read or written. The page counter is
 *     a small integer; visited prefixes are public route
 *     names; referrer is the standard browser-exposed value.
 *   - No mouse-position, no scroll-velocity, no dwell-time
 *     histograms, no click-sequence patterns. The schema
 *     stays minimal.
 *
 * SSR-safety: each read guards against `typeof window ===
 * "undefined"` and returns the neutral default. The server
 * always classifies to "default" because every signal is
 * absent.
 */

/** sessionStorage key for the visited-prefixes set. The
 *  future observer writes JSON-encoded `string[]`; this
 *  module reads + parses on demand. */
export const VISITED_PREFIXES_STORAGE_KEY = "v5:contact:visited-prefixes";

/** The list of route prefixes the classifier cares about.
 *  The observer (future) only records visits to these
 *  prefixes — visiting / or /contact itself doesn't matter
 *  for pattern detection. Closed allow-list keeps the
 *  recorded data semantically meaningful + storage cost
 *  bounded. */
export const TRACKED_VISIT_PREFIXES = [
  "/architecture",
  "/lumina/brain",
  "/v5/topology",
  "/v5/perception",
  "/projects",
  "/evolution",
  "/lab",
  "/notes",
] as const;

/** Read the cognition signal from the Phase 6.2 page
 *  counter. Returns null when the counter is missing /
 *  invalid; never falls back to "arrival" because that
 *  could mask "no signal". */
function readCognitionSignal(): {
  signal: "arrival" | "exploring" | "engaged" | null;
  pageCount: number;
} {
  if (typeof window === "undefined") return { signal: null, pageCount: 0 };
  try {
    const raw = window.sessionStorage.getItem(
      SESSION_PAGE_COUNTER_STORAGE_KEY,
    );
    if (raw === null) return { signal: null, pageCount: 0 };
    const count = Math.max(0, Number(raw) || 0);
    if (count === 0) return { signal: null, pageCount: 0 };
    return { signal: inferCognitionSignal(count), pageCount: count };
  } catch {
    return { signal: null, pageCount: 0 };
  }
}

/** Read the referrer. Returns null when document is
 *  unavailable or the referrer is empty (direct visit). */
function readReferrer(): string | null {
  if (typeof document === "undefined") return null;
  const ref = document.referrer;
  return typeof ref === "string" && ref.length > 0 ? ref : null;
}

/** Read the visited-prefixes set from sessionStorage.
 *  Returns an empty Set when the key is missing, malformed,
 *  or sessionStorage is unavailable. */
function readVisitedPrefixes(): ReadonlySet<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = window.sessionStorage.getItem(VISITED_PREFIXES_STORAGE_KEY);
    if (raw === null) return new Set();
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return new Set();
    const out = new Set<string>();
    for (const p of parsed) {
      if (typeof p === "string" && p.length > 0) out.add(p);
    }
    return out;
  } catch {
    return new Set();
  }
}

/**
 * Aggregate all signals into a `ContactSignals`. Returns
 * `NEUTRAL_SIGNALS` on SSR.
 *
 * Cheap: 3 sessionStorage reads + 1 document.referrer read.
 * < 1 ms in practice. Safe to call from any client effect.
 */
export function readClientSignals(): ContactSignals {
  if (typeof window === "undefined") return NEUTRAL_SIGNALS;
  const { signal, pageCount } = readCognitionSignal();
  return {
    cognitionSignal: signal,
    pageCount,
    referrer: readReferrer(),
    visitedPrefixes: readVisitedPrefixes(),
  };
}

/**
 * Record a visited prefix into sessionStorage. Used by the
 * future observer; included here as a helper so the
 * observer + the reader agree on the storage shape.
 *
 *   1. The prefix must be in TRACKED_VISIT_PREFIXES — any
 *      other path is ignored. Closed allow-list.
 *   2. The Set is JSON-serialised on every write
 *      (small — at most 8 entries).
 *   3. SSR-safe: returns silently when sessionStorage is
 *      unavailable.
 */
export function recordVisitedPrefix(pathname: string): void {
  if (typeof window === "undefined") return;
  /* Find the matching tracked prefix (longest-prefix
   * match — same convention the aura registry uses). */
  let matched: string | null = null;
  for (const prefix of TRACKED_VISIT_PREFIXES) {
    if (pathname === prefix || pathname.startsWith(prefix + "/")) {
      if (matched === null || prefix.length > matched.length) {
        matched = prefix;
      }
    }
  }
  if (matched === null) return;

  try {
    const existing = readVisitedPrefixes();
    if (existing.has(matched)) return;
    const next = [...existing, matched];
    window.sessionStorage.setItem(
      VISITED_PREFIXES_STORAGE_KEY,
      JSON.stringify(next),
    );
  } catch {
    /* sessionStorage blocked — silent. The classifier will
     * see an empty visited-prefixes set + classify to a
     * less-specific pattern. Honest degradation. */
  }
}
