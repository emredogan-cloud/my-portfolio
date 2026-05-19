"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

import { classifyContactPattern } from "@/lib/v5/contact/classifier";
import {
  readClientSignals,
  recordVisitedPrefix,
} from "@/lib/v5/contact/signals";
import { type ContactPattern } from "@/lib/v5/contact/schema";

/**
 * V5 Phase 8 Sub-PR 8.5 — adaptive recruiter pattern provider.
 *
 * Combined observer + classifier client component. When
 * mounted, the Provider:
 *   1. Records every navigation into sessionStorage's
 *      visited-prefixes set (via `recordVisitedPrefix`).
 *      The recorder is itself filtered to the tracked
 *      prefixes from `signals.ts`.
 *   2. Reads aggregate signals when /contact mounts.
 *   3. Classifies the visitor's pattern.
 *   4. Applies a `data-pattern="..."` attribute to a host
 *      element so future CSS `order` rules can reorder
 *      sections by pattern.
 *   5. Fires session-deduped telemetry through
 *      `/api/v5/contact/event`.
 *
 * NOT MOUNTED IN 8.5
 *   The component lives in the codebase but `app/layout.tsx`
 *   and `app/contact/page.tsx` do NOT import it. The same
 *   foundation-only discipline 8.4 (aura unmounted) followed.
 *   Until a future sub-PR mounts the Provider + opts the
 *   /contact layout into reading the `data-pattern`
 *   attribute, the visitor sees the existing unchanged
 *   contact page.
 *
 * KIRMIZI ÇİZGİ enforcement (V5 future § 4.1)
 *   - The Provider NEVER renders pattern data visibly. Even
 *     when mounted (in a future sub-PR), the only output is
 *     a `data-pattern` attribute on a host element.
 *   - The pattern is NEVER written to a cookie, localStorage,
 *     or any persistent storage. Only sessionStorage (drops
 *     on tab close).
 *   - The pattern label is NEVER spoken back to the visitor.
 *   - Conservative classifier defaults to `"default"` when
 *     signals are absent; uncertainty produces the universal
 *     layout, not a guess.
 *
 * Privacy posture
 *   - No identifier is generated.
 *   - sessionStorage is the only persistence; tab close
 *     drops everything.
 *   - The visited-prefixes set is bounded by the closed
 *     allow-list (8 entries max).
 *   - Telemetry fires once per session per pathname change
 *     to /contact — at most 1 fire per session in practice.
 *
 * Phase 8 cognition note
 *   The Provider is the END of Phase 8's cognition chain.
 *   The brain (8.1) describes the system; the engine (8.2)
 *   renders it; the spectacle (8.3) mounts it; the aura
 *   (8.4) modulates its feeling; the adaptive recruiter
 *   (8.5) reorders the conversion surface based on session
 *   shape. Each piece consumes upstream signals without
 *   speaking back.
 *
 * Hydration safety
 *   The Provider renders `null` on both server and client.
 *   The useEffect runs after commit; the data attribute is
 *   set post-hydration. CSS rules reading the attribute
 *   see no value during SSR (the default layout renders);
 *   after hydration, the attribute appears and the CSS
 *   `order` rules apply — flicker is bounded to a single
 *   frame and only when the pattern is non-default.
 */

const CONTACT_EVENT_ENDPOINT = "/api/v5/contact/event";
const PATTERN_FIRED_STORAGE_KEY = "v5:contact:pattern-fired";

function fireContactPattern(pattern: ContactPattern): void {
  if (typeof window === "undefined") return;
  try {
    const prev = window.sessionStorage.getItem(PATTERN_FIRED_STORAGE_KEY);
    /* Session-dedupe per pattern label. A visitor whose
     * classification flips mid-session (e.g., they engage
     * deeper after first visiting /contact) fires once for
     * each new classification — up to 4 fires per session
     * in the pathological case. */
    if (prev === pattern) return;
    window.sessionStorage.setItem(PATTERN_FIRED_STORAGE_KEY, pattern);
  } catch {
    /* sessionStorage blocked — fall through, fire anyway. */
  }
  void fetch(CONTACT_EVENT_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ pattern }),
    keepalive: true,
  }).catch(() => {
    /* swallow — contact telemetry never blocks */
  });
}

export interface AdaptivePatternProviderProps {
  /** Optional ref-like callback that receives the host
   *  element to apply the `data-pattern` attribute to.
   *  Consumers that want to attribute the parent <main>
   *  pass a ref-style callback; consumers that don't care
   *  omit this and the Provider applies to
   *  `document.documentElement`. */
  applyTo?: HTMLElement | null;
  /** Optional callback for the parent that wants to know
   *  when the classification resolves. Receives the
   *  current pattern; called on first classification + on
   *  any subsequent reclassification (e.g. after the
   *  visitor navigates to more pages mid-session). */
  onPattern?: (pattern: ContactPattern) => void;
}

export default function AdaptivePatternProvider({
  applyTo,
  onPattern,
}: AdaptivePatternProviderProps = {}) {
  const pathname = usePathname();
  const lastPatternRef = useRef<ContactPattern | null>(null);

  /* Effect 1: record the current pathname into the visited
   * prefixes set. Runs on every navigation (the Provider
   * is meant to mount globally; if it's mounted locally,
   * only that mount's pathnames register). */
  useEffect(() => {
    if (typeof pathname !== "string" || !pathname) return;
    recordVisitedPrefix(pathname);
  }, [pathname]);

  /* Effect 2: read signals, classify, apply data attribute,
   * fire telemetry. Runs on every pathname change so the
   * classification stays current as the session evolves. */
  useEffect(() => {
    if (typeof window === "undefined") return;

    const signals = readClientSignals();
    const pattern = classifyContactPattern(signals);

    /* Apply the data-pattern attribute to the host element.
     * Falls back to documentElement when no explicit host
     * is provided — that lets stylesheets target globally
     * via `[data-pattern="..."]` selectors. */
    const host = applyTo ?? document.documentElement;
    try {
      host.setAttribute("data-pattern", pattern);
    } catch {
      /* setAttribute should never throw on an HTMLElement,
       * but defensive programming for non-standard hosts. */
    }

    /* Notify the consumer + fire telemetry only when the
     * pattern changes (or first resolves). */
    if (lastPatternRef.current === pattern) return;
    lastPatternRef.current = pattern;
    onPattern?.(pattern);
    fireContactPattern(pattern);
  }, [pathname, applyTo, onPattern]);

  return null;
}
