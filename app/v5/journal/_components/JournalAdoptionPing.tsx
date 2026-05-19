"use client";

import { useEffect } from "react";

import type { JournalAdoptionEvent } from "@/lib/v5/journal/telemetry";

/**
 * V5 Phase 9 Sub-PR 9.3 — journal adoption ping.
 *
 * Tiny client island that fires one of the journal adoption
 * events on mount. Session-deduped per kind (per slug for
 * `entry_view`).
 *
 * Used by the journal index page (`/v5/journal`) to fire
 * `index_view` and by each week detail page
 * (`/v5/journal/<week>`) to fire `entry_view`.
 *
 * Privacy posture
 *   - No personal data. The endpoint accepts only the
 *     kind enum value.
 *   - sessionStorage drops on tab close.
 *
 * Edge-safety: client-only by `"use client"` directive.
 * Renders `null`.
 */

const ENDPOINT = "/api/v5/journal/event";
const STORAGE_PREFIX = "v5:journal:fired:";

interface JournalAdoptionPingProps {
  kind: JournalAdoptionEvent;
  /** Optional slug differentiator. When set, the
   *  sessionStorage key includes the slug so a visitor
   *  reading multiple week pages fires once per week (not
   *  just once per session globally). */
  slug?: string;
}

function fireOnce(kind: JournalAdoptionEvent, slug?: string): void {
  if (typeof window === "undefined") return;
  const slot = slug
    ? `${STORAGE_PREFIX}${kind}:${slug}`
    : `${STORAGE_PREFIX}${kind}`;
  try {
    if (window.sessionStorage.getItem(slot) === "1") return;
    window.sessionStorage.setItem(slot, "1");
  } catch {
    /* sessionStorage blocked — fall through, fire anyway. */
  }
  void fetch(ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ kind }),
    keepalive: true,
  }).catch(() => {
    /* swallow — telemetry never blocks */
  });
}

export default function JournalAdoptionPing({
  kind,
  slug,
}: JournalAdoptionPingProps) {
  useEffect(() => {
    fireOnce(kind, slug);
  }, [kind, slug]);
  return null;
}
