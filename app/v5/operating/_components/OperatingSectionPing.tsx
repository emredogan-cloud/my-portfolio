"use client";

import { useEffect, useRef } from "react";

import type { OperatingAdoptionEvent } from "@/lib/v5/operating/telemetry";

/**
 * V5 Phase 9 Sub-PR 9.2 — per-section inspection ping.
 *
 * Tiny client island that fires ONE adoption event when the
 * host element scrolls into the visitor's viewport. Wraps an
 * `IntersectionObserver` (single subscription per mount;
 * disconnect after the first fire).
 *
 * Session-deduped via sessionStorage. A visitor who scrolls
 * past a section, scrolls back up, then scrolls past it
 * again, fires once.
 *
 * Privacy posture
 *   - No personal data is read or written.
 *   - sessionStorage drops on tab close — no cross-session
 *     linking.
 *   - The fired event is one of 5 closed-allow-list values
 *     defined in `lib/v5/operating/telemetry.ts`.
 *
 * Performance posture
 *   - Zero rendered DOM. Returns `null`.
 *   - Single IntersectionObserver per mount; disconnects on
 *     first fire OR on unmount.
 *   - Idle CPU 0% — observer fires only when the visitor
 *     scrolls.
 *
 * Hydration safety
 *   - Renders `null` on both server and client.
 *   - useEffect runs after commit; observer attaches to the
 *     `host` ref's current element.
 *   - SSR has no observer; the ping never fires during build.
 *
 * Why this is a separate island from VisitPing
 *   VisitPing fires the V4 scalar visit counter (page-level).
 *   OperatingSectionPing fires the V5 per-section adoption
 *   event. Two different signals, two different KV writes —
 *   one V4 surface, one V5 hash. The split keeps the
 *   responsibilities aligned with how the rest of the
 *   ecosystem reads them.
 */

const EVENT_ENDPOINT = "/api/v5/operating/event";
const STORAGE_PREFIX = "v5:operating:section:fired:";

interface OperatingSectionPingProps {
  /** Which section is being observed. One of the five
   *  `section_*_inspected` allow-listed values. */
  kind: Extract<OperatingAdoptionEvent, `section_${string}_inspected`>;
  /** Optional intersection ratio threshold. Defaults to
   *  0.25 — quarter of the section needs to be visible
   *  before we count it as inspected. */
  threshold?: number;
}

function fireSectionInspect(kind: OperatingSectionPingProps["kind"]): void {
  if (typeof window === "undefined") return;
  const slot = `${STORAGE_PREFIX}${kind}`;
  try {
    if (window.sessionStorage.getItem(slot) === "1") return;
    window.sessionStorage.setItem(slot, "1");
  } catch {
    /* sessionStorage blocked — fall through, fire anyway. */
  }
  void fetch(EVENT_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ kind }),
    keepalive: true,
  }).catch(() => {
    /* swallow — telemetry never blocks */
  });
}

export default function OperatingSectionPing({
  kind,
  threshold = 0.25,
}: OperatingSectionPingProps) {
  /* Anchor element the observer watches. The host renders an
   * empty `<span>` so the wrapper has a measurable bounding
   * rect; the surrounding section's content lives in the
   * parent component. */
  const anchorRef = useRef<HTMLSpanElement | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (typeof IntersectionObserver !== "function") return;
    const target = anchorRef.current;
    if (!target) return;

    /* Session-dedupe: if the event has already fired this
     * session, skip mounting the observer entirely. */
    const slot = `${STORAGE_PREFIX}${kind}`;
    try {
      if (window.sessionStorage.getItem(slot) === "1") return;
    } catch {
      /* fall through — observer mounts even if storage is
       * blocked. */
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting && entry.intersectionRatio >= threshold) {
            fireSectionInspect(kind);
            observer.disconnect();
            return;
          }
        }
      },
      { threshold },
    );
    observer.observe(target);

    return () => observer.disconnect();
  }, [kind, threshold]);

  return (
    <span ref={anchorRef} aria-hidden="true" className="block h-0 w-0" />
  );
}
