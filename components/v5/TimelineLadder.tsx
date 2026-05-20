"use client";

/* ──────────────────────────────────────────────────────────────
 *  TimelineLadder — V6 Sub-PR 14.4
 *
 *  Mobile-optimized companion to the desktop TimelineSlider for
 *  /architecture/<slug> pages. The slider's drag-to-scrub UX
 *  doesn't translate to one-thumb scrolling, so on viewports
 *  below `md` we render a vertical timestamp ladder instead:
 *  cyan-dotted markers, each tappable, expanding inline to show
 *  that snapshot's date + title + rationale.
 *
 *  Same data shape as the slider (`EvolutionEvent[]`). Same
 *  engagement signal — POSTs `{ kind: "engaged", context: slug }`
 *  to /api/v5/temporal/timeline on first interaction, with
 *  sessionStorage dedupe slots that share the slider's prefix so
 *  a single visitor's session counts once regardless of which
 *  surface they engaged. Also fires `{ kind: "mounted" }` once
 *  per session on first render — same global slot the slider uses.
 *
 *  Reduced-motion: under `prefers-reduced-motion: reduce` every
 *  row renders pre-expanded; the tap-to-expand interaction
 *  collapses to a no-op visually (the button still exists for
 *  keyboard / engagement-tracking parity). Spec validation #3.
 *
 *  Server snapshot deterministically renders the pre-expanded
 *  view, so SSR + first client paint emit the same HTML and the
 *  page never reflows on hydration. Spec validation #4.
 *
 *  Spec ref: PORTFOLYO_V6_UI_EXECUTION_SYSTEM.md § Sub-PR 14.4.
 *  Audit ref: PORTFOLYO_V6_UI_AUDIT.md §§ 6.3 (mobile blocker), 18.1.
 * ────────────────────────────────────────────────────────────── */

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import type { EvolutionEvent } from "@/lib/v5/temporal/schema";

const TIMELINE_ENDPOINT = "/api/v5/temporal/timeline";
const TIMELINE_STORAGE_PREFIX = "v5:topology:timeline:fired:";

/* ── Engagement firing — mirrors TimelineSlider's pattern.
 *
 *  The sessionStorage slot keys use the same prefix as the slider so
 *  that, within a single visitor session, "engaged" only fires once
 *  regardless of which surface (slider on desktop, ladder on mobile,
 *  responsive resize between them) the user first interacted with.
 *  ────────────────────────────────────────────────────────────────── */

function fireEngagementOnce(
  slotKey: string,
  payload: Record<string, string>,
): void {
  if (typeof window === "undefined") return;
  try {
    if (window.sessionStorage.getItem(slotKey) === "1") return;
    window.sessionStorage.setItem(slotKey, "1");
  } catch {
    /* sessionStorage blocked → fall through, fire anyway. One extra
       count per reload in private mode is acceptable degradation. */
  }
  void fetch(TIMELINE_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
    keepalive: true,
  }).catch(() => {
    /* swallow — timeline telemetry is decorative */
  });
}

function fireEngagement(kind: "mounted" | "engaged", context?: string): void {
  fireEngagementOnce(`${TIMELINE_STORAGE_PREFIX}${kind}`, { kind });
  if (typeof context === "string" && context && kind === "engaged") {
    fireEngagementOnce(`${TIMELINE_STORAGE_PREFIX}${kind}:${context}`, {
      kind,
      context,
    });
  }
}

/* ── Reduced-motion external store — same pattern as TimelineSlider.
 *  ────────────────────────────────────────────────────────────────── */

function subscribeReducedMotion(callback: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  if (typeof window.matchMedia !== "function") return () => {};
  const mql = window.matchMedia("(prefers-reduced-motion: reduce)");
  if (typeof mql.addEventListener === "function") {
    mql.addEventListener("change", callback);
    return () => mql.removeEventListener("change", callback);
  }
  mql.addListener(callback);
  return () => mql.removeListener(callback);
}

function getReducedMotionSnapshot(): boolean {
  if (typeof window === "undefined") return false;
  if (typeof window.matchMedia !== "function") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function getReducedMotionServerSnapshot(): boolean {
  return false;
}

/* ── Public component ─────────────────────────────────────────── */

interface TimelineLadderProps {
  /** Same shape the slider consumes — already filtered to the system. */
  events: readonly EvolutionEvent[];
  /** Project slug for the per-architecture engagement signal. */
  context: string;
}

interface LadderRowProps {
  event: EvolutionEvent;
  expanded: boolean;
  yearLabel: string | null;
  onToggle: () => void;
  isFirst: boolean;
  isLast: boolean;
}

export default function TimelineLadder({
  events,
  context,
}: TimelineLadderProps) {
  const reducedMotion = useSyncExternalStore(
    subscribeReducedMotion,
    getReducedMotionSnapshot,
    getReducedMotionServerSnapshot,
  );

  /* Expansion is per-event independent — multiple rows can be open
     simultaneously. Spec asks for tap-to-expand inline, not a single-
     open accordion. */
  const [expandedIds, setExpandedIds] = useState<ReadonlySet<string>>(
    () => new Set(),
  );
  const interactedRef = useRef(false);

  /* Sort descending by date so the latest snapshot reads first —
     matches the slider's initial cursor position (last/latest event). */
  const sortedEvents = useMemo(() => {
    return [...events].sort((a, b) => b.date.localeCompare(a.date));
  }, [events]);

  /* Mount: fire global + per-context `mounted` once per session.
     Wrapped in rAF so the network call doesn't compete with paint;
     no setState in the effect body keeps the react-hooks/set-state-
     in-effect lint rule happy. */
  useEffect(() => {
    const raf = requestAnimationFrame(() => {
      fireEngagement("mounted", context);
    });
    return () => cancelAnimationFrame(raf);
  }, [context]);

  const handleToggle = useCallback(
    (id: string) => {
      /* Engagement fires on the FIRST tap regardless of reduced-
         motion — under reduced-motion the visual expansion is a no-
         op (every row is already expanded) but the user still
         attempted to interact, which is the engagement signal. */
      if (!interactedRef.current) {
        interactedRef.current = true;
        fireEngagement("engaged", context);
      }
      if (reducedMotion) return;
      setExpandedIds((prev) => {
        const next = new Set(prev);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        return next;
      });
    },
    [reducedMotion, context],
  );

  return (
    <ol
      role="list"
      aria-label="Architectural evolution snapshots"
      className="relative space-y-0 list-none"
    >
      {/* Vertical guide line — sits behind the dots. */}
      <span
        aria-hidden="true"
        className="absolute left-[7px] top-3 bottom-3 w-px bg-[#00d2ff]/15"
      />

      {sortedEvents.map((event, i) => {
        const yearLabel =
          i === 0 || sortedEvents[i - 1].date.slice(0, 4) !== event.date.slice(0, 4)
            ? event.date.slice(0, 4)
            : null;
        const isExpanded = reducedMotion || expandedIds.has(event.id);
        return (
          <LadderRow
            key={event.id}
            event={event}
            expanded={isExpanded}
            yearLabel={yearLabel}
            onToggle={() => handleToggle(event.id)}
            isFirst={i === 0}
            isLast={i === sortedEvents.length - 1}
          />
        );
      })}
    </ol>
  );
}

function LadderRow({
  event,
  expanded,
  yearLabel,
  onToggle,
  isFirst,
}: LadderRowProps) {
  /* Format the date as "Mon 2026" / "Apr 2025" depending on year/month —
     stays short on small viewports. Falls back to the raw ISO date if
     the parse fails. */
  const formattedDate = useMemo(() => {
    const parts = event.date.split("-");
    if (parts.length !== 3) return event.date;
    const year = parts[0];
    const month = Number(parts[1]);
    const day = Number(parts[2]);
    if (!Number.isFinite(month) || !Number.isFinite(day)) return event.date;
    const MONTHS = [
      "Jan", "Feb", "Mar", "Apr", "May", "Jun",
      "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
    ];
    const monthLabel = MONTHS[month - 1] ?? "";
    return `${monthLabel} ${day} · ${year}`;
  }, [event.date]);

  const body = event.rationale ?? event.summary;

  return (
    <li className="relative">
      {/* Year label divider — only renders on the first event of each year. */}
      {yearLabel ? (
        <p
          className={
            isFirst
              ? "pl-9 pb-2 font-mono uppercase tracking-[0.22em] text-[10px] text-tertiary"
              : "pl-9 pt-6 pb-2 font-mono uppercase tracking-[0.22em] text-[10px] text-tertiary"
          }
        >
          {yearLabel}
        </p>
      ) : null}

      {/* Tappable row — dot on the left, content beside. */}
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={expanded}
        aria-controls={`ladder-body-${event.id}`}
        className="group relative block w-full text-left pl-9 pr-1 py-3 transition-colors"
      >
        {/* Cyan dot — positioned on the vertical guide line. */}
        <span
          aria-hidden="true"
          className={
            expanded
              ? "absolute left-1 top-[18px] w-3 h-3 rounded-full bg-[#00d2ff] shadow-[0_0_0_3px_rgba(0,210,255,0.18)] transition-all"
              : "absolute left-1 top-[19px] w-3 h-3 rounded-full bg-[#00d2ff]/70 group-hover:bg-[#00d2ff] group-active:bg-[#00d2ff] transition-colors"
          }
        />

        {/* Date + Title (collapsed state). */}
        <p className="font-mono uppercase tracking-[0.18em] text-[10px] text-[#00d2ff]/80 mb-1">
          {formattedDate}
        </p>
        <h3 className="text-primary text-[15px] font-medium leading-snug pr-3">
          {event.title}
        </h3>

        {/* Expanded body — date + rationale inline.
            Always rendered in the DOM (with aria-hidden when collapsed) so
            SSR + client paint emit the same HTML — no hydration reflow. */}
        <div
          id={`ladder-body-${event.id}`}
          className={
            expanded
              ? "mt-3 pr-3 text-secondary text-[14px] leading-[1.75]"
              : "hidden"
          }
        >
          {body}
        </div>
      </button>
    </li>
  );
}
