"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";

import {
  createTemporalPlayback,
  type PlaybackEventKind,
  type TemporalPlaybackController,
} from "@/lib/v5/temporal/playback";
import type { EvolutionEvent } from "@/lib/v5/temporal/schema";
import type { TimelineEngagementKind } from "@/lib/v5/temporal/timeline-telemetry";

/**
 * V5 Phase 7 Sub-PR 7.3 — timeline slider.
 *
 * The first consumer of the Phase 7.2 playback primitive. A
 * horizontal slider that lets the visitor scrub through the
 * engineering memory registry — keyboard, mouse, and touch all
 * functional, WCAG 2.5.5 AAA hit targets, reduced-motion safe.
 *
 * Phase 7 voice: a small, calm instrument. NOT a video player.
 * The visual treatment is restrained — a thin track, a circular
 * thumb, three small icon controls. The current event title +
 * date display as prose, not as a dashboard widget.
 *
 * Reactivity model
 *   The 7.2 controller is a vanilla closure-backed object.
 *   This component bridges it into React via two hooks:
 *     - `useReducer` tick counter — forced re-render on every
 *       cursor change (the controller fires `onChange` from its
 *       method bodies; the tick re-reads `getCursor()` /
 *       `isPlaying()` synchronously)
 *     - `useSyncExternalStore` for the OS reduced-motion
 *       preference — SSR-safe by returning `false` on the
 *       server snapshot, subscribing to `matchMedia` on the
 *       client.
 *
 * Engagement telemetry
 *   `fireEngagement(kind)` is session-deduped via sessionStorage
 *   inside the helper itself. The component fires:
 *     - `mounted` once on first commit (a useEffect with no deps)
 *     - `engaged` on EVERY interaction telemetry event — the
 *       helper's sessionStorage gate keeps only the first one
 *       actually networking. No in-component ref needed.
 *
 * Playback telemetry
 *   `firePlaybackEvent(kind)` posts the controller's verb to
 *   `/api/v5/temporal/playback` with `keepalive: true`. Fire-
 *   and-forget; errors swallow.
 *
 * Accessibility (V5 § 5.2 7.3)
 *   - `role="slider"` with `aria-valuemin`, `aria-valuemax`,
 *     `aria-valuenow`, `aria-valuetext`, `aria-label`.
 *   - Keyboard nav per WAI-ARIA: ArrowLeft / ArrowDown → prev;
 *     ArrowRight / ArrowUp → next; PageDown / PageUp → ±5;
 *     Home → start; End → end; Space / Enter → toggle play.
 *   - WCAG 2.5.5 AAA hit targets: the slider track wrapper is
 *     44 CSS px tall; every control button is 44×44 minimum.
 *   - Focus indicator: `focus-visible:ring-2` on the track.
 *
 * Reduced-motion (V5 § 5.2 7.3)
 *   - The slider remains fully functional.
 *   - CSS transitions on the thumb + progress fill are removed
 *     (snap instead of animate).
 *   - The controller's `play()` snaps to end (handled by the
 *     7.2 primitive when `respectsReducedMotion: true`).
 *
 * Teardown
 *   `controller.destroy()` runs in the cleanup effect; cancels
 *   any in-flight RAF before garbage collection.
 */

interface TimelineSliderProps {
  events: readonly EvolutionEvent[];
  initialEventId?: string;
  className?: string;
}

const PLAYBACK_ENDPOINT = "/api/v5/temporal/playback";
const TIMELINE_ENDPOINT = "/api/v5/temporal/timeline";
const TIMELINE_STORAGE_PREFIX = "v5:topology:timeline:fired:";
const PAGE_STEP = 5;

function firePlaybackEvent(kind: PlaybackEventKind): void {
  if (typeof window === "undefined") return;
  void fetch(PLAYBACK_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ kind }),
    keepalive: true,
  }).catch(() => {
    /* swallow — playback telemetry never blocks the slider */
  });
}

function fireEngagement(kind: TimelineEngagementKind): void {
  if (typeof window === "undefined") return;
  const slot = `${TIMELINE_STORAGE_PREFIX}${kind}`;
  try {
    if (window.sessionStorage.getItem(slot) === "1") return;
    window.sessionStorage.setItem(slot, "1");
  } catch {
    /* sessionStorage blocked → fall through, fire anyway. One
     * extra count per reload in private mode is acceptable
     * degradation. */
  }
  void fetch(TIMELINE_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ kind }),
    keepalive: true,
  }).catch(() => {
    /* swallow */
  });
}

/* ── External-store wiring for the reduced-motion preference ─
 *
 * useSyncExternalStore is the React 18 pattern for SSR-safe
 * external subscriptions. The server snapshot returns `false`
 * (the deterministic default for the initial render); on the
 * client, the snapshot reads `matchMedia` and the subscriber
 * receives change events.
 *
 * The `subscribe` function is a no-op on SSR; only the client
 * actually wires the listener. */

function subscribeReducedMotion(callback: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  if (typeof window.matchMedia !== "function") return () => {};
  const mql = window.matchMedia("(prefers-reduced-motion: reduce)");
  if (typeof mql.addEventListener === "function") {
    mql.addEventListener("change", callback);
    return () => mql.removeEventListener("change", callback);
  }
  /* Older Safari shim. The deprecated addListener API is the
   * only option in pre-Safari 14 contexts; tsc's typings still
   * expose it. */
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

export default function TimelineSlider({
  events,
  initialEventId,
  className,
}: TimelineSliderProps) {
  const trackRef = useRef<HTMLDivElement | null>(null);

  /* Tick state used to force re-renders when the controller's
   * cursor changes. A plain counter keeps the re-render
   * lightweight — no object allocation per tick. */
  const [, forceRender] = useReducer((n: number) => n + 1, 0);

  /* OS reduced-motion preference. SSR returns `false`; client
   * subscription updates after hydration without a setState-in-
   * effect violation. */
  const reducedMotion = useSyncExternalStore(
    subscribeReducedMotion,
    getReducedMotionSnapshot,
    getReducedMotionServerSnapshot,
  );

  /* Pointer scrubbing state. Lives outside the controller because
   * it's a UI concern — the controller doesn't know whether the
   * user is dragging vs jumping. */
  const [scrubbing, setScrubbing] = useState(false);

  /* Stable telemetry adapter — captures no refs, only function
   * references. Reads / writes go through `firePlaybackEvent` +
   * `fireEngagement` which handle their own sessionStorage
   * gating. Safe to pass through useMemo without lint trouble. */
  const handleControllerTelemetry = useCallback((kind: PlaybackEventKind) => {
    firePlaybackEvent(kind);
    if (
      kind === "seek" ||
      kind === "scrub" ||
      kind === "play" ||
      kind === "step"
    ) {
      /* `fireEngagement` is itself session-deduped — the first
       * call posts to /api/v5/temporal/timeline, every later
       * call no-ops. No in-component ref required. */
      fireEngagement("engaged");
    }
  }, []);

  /* Controller construction. Recreates when:
   *   - events array reference changes (parent re-passed a new
   *     events list; rare — the page renders the same list on
   *     every ISR generation).
   *   - reducedMotion toggles (the controller's play() behaviour
   *     depends on this; recreating ensures consistency).
   *   - initialEventId changes (parent navigated to a different
   *     anchor).
   * Destroy is called in the cleanup effect below. */
  const controller: TemporalPlaybackController = useMemo(() => {
    return createTemporalPlayback({
      events,
      initialEventId,
      respectsReducedMotion: reducedMotion,
      onChange: () => forceRender(),
      onTelemetry: handleControllerTelemetry,
    });
  }, [events, initialEventId, reducedMotion, handleControllerTelemetry]);

  /* Tear down the controller on unmount or before recreating. */
  useEffect(() => {
    return () => controller.destroy();
  }, [controller]);

  /* Fire `mounted` once on first commit. fireEngagement's
   * sessionStorage gate keeps this to one network call per
   * session even if the component remounts. */
  useEffect(() => {
    fireEngagement("mounted");
  }, []);

  /* Pointer handling helpers — declared inside the render so
   * they close over the latest controller reference. */
  const seekFromPointer = useCallback(
    (clientX: number) => {
      const track = trackRef.current;
      if (!track) return;
      const rect = track.getBoundingClientRect();
      if (rect.width <= 0) return;
      const x = clientX - rect.left;
      const ratio = Math.max(0, Math.min(1, x / rect.width));
      controller.scrubTo(ratio);
    },
    [controller],
  );

  const handlePointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      /* Only handle primary pointer button (left mouse, single
       * touch). Right-clicks and middle-clicks fall through to
       * default browser behaviour. */
      if (e.button !== undefined && e.button !== 0) return;
      e.preventDefault();
      const track = trackRef.current;
      if (track) {
        try {
          track.setPointerCapture(e.pointerId);
        } catch {
          /* setPointerCapture can throw in some test environments;
           * fall through and rely on bubbled pointermove. */
        }
      }
      setScrubbing(true);
      seekFromPointer(e.clientX);
    },
    [seekFromPointer],
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (!scrubbing) return;
      seekFromPointer(e.clientX);
    },
    [scrubbing, seekFromPointer],
  );

  const handlePointerEnd = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (!scrubbing) return;
      setScrubbing(false);
      const track = trackRef.current;
      if (track) {
        try {
          track.releasePointerCapture(e.pointerId);
        } catch {
          /* ignore */
        }
      }
    },
    [scrubbing],
  );

  /* Keyboard handling — WAI-ARIA slider pattern. */
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      const cursor = controller.getCursor();
      if (cursor === null) return;
      const total = cursor.totalFrames;
      if (total === 0) return;
      const last = total - 1;
      const current = cursor.fromIndex;

      switch (e.key) {
        case "ArrowLeft":
        case "ArrowDown":
          e.preventDefault();
          controller.prevFrame();
          return;
        case "ArrowRight":
        case "ArrowUp":
          e.preventDefault();
          controller.nextFrame();
          return;
        case "PageDown":
          e.preventDefault();
          controller.seekToIndex(Math.max(0, current - PAGE_STEP));
          return;
        case "PageUp":
          e.preventDefault();
          controller.seekToIndex(Math.min(last, current + PAGE_STEP));
          return;
        case "Home":
          e.preventDefault();
          controller.seekToIndex(0);
          return;
        case "End":
          e.preventDefault();
          controller.seekToIndex(last);
          return;
        case " ":
        case "Enter":
          e.preventDefault();
          if (controller.isPlaying()) controller.pause();
          else controller.play();
          return;
      }
    },
    [controller],
  );

  /* Click on a tick = seek to that event. Same effect as
   * pressing Tab to focus the track + ArrowRight to navigate,
   * but mouse-friendly. */
  const handleTickClick = useCallback(
    (index: number) => {
      controller.seekToIndex(index);
    },
    [controller],
  );

  /* Render-time reads of controller state. The controller is
   * synchronous; both reads are stable within a single render. */
  const cursor = controller.getCursor();
  const isPlaying = controller.isPlaying();
  const frames = controller.getFrames();

  /* Empty timeline — no frames to scrub. The slider renders
   * nothing rather than a degenerate degraded state. The page
   * around it continues to render the events. */
  if (cursor === null || frames.length === 0) {
    return null;
  }

  const totalFrames = cursor.totalFrames;
  const lastIndex = totalFrames - 1;
  const currentEvent = cursor.fromFrame.event;
  /* Overall progress 0..1 across the entire timeline. */
  const overallProgress =
    lastIndex === 0
      ? 0
      : (cursor.fromIndex + cursor.progress) / lastIndex;

  /* Compose the ARIA value text — verbose for screen readers. */
  const ariaValueText =
    `Event ${cursor.fromIndex + 1} of ${totalFrames}: ` +
    `${currentEvent.title}, ${currentEvent.date}`;

  /* CSS transition timing — only applied when motion is allowed.
   * Reduced-motion gets snap semantics. */
  const thumbTransition = reducedMotion
    ? "none"
    : "left 200ms cubic-bezier(0.22, 1, 0.36, 1)";
  const fillTransition = reducedMotion
    ? "none"
    : "width 200ms cubic-bezier(0.22, 1, 0.36, 1)";

  return (
    <div className={`${className ?? ""}`.trim()}>
      {/* Header strip: current event title + date. Reads as
          prose — not a movie player's "title bar". */}
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 mb-4">
        <p className="text-secondary text-[14px] leading-relaxed">
          <span className="font-mono uppercase tracking-[0.18em] text-[10px] text-[#00d2ff]/80 mr-2">
            cursor
          </span>
          {currentEvent.title}
        </p>
        <time
          dateTime={currentEvent.date}
          className="font-mono text-[11px] text-tertiary tabular-nums"
        >
          {currentEvent.date}
        </time>
      </div>

      {/* Track wrapper — gives the pointer-active area a 44px
          tall hit zone (WCAG 2.5.5 AAA) while keeping the visible
          track itself thin. */}
      <div
        ref={trackRef}
        role="slider"
        aria-label="Engineering memory timeline"
        aria-valuemin={0}
        aria-valuemax={lastIndex}
        aria-valuenow={cursor.fromIndex}
        aria-valuetext={ariaValueText}
        tabIndex={0}
        className="relative w-full h-11 flex items-center cursor-pointer select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00d2ff]/50 focus-visible:ring-offset-2 focus-visible:ring-offset-black rounded-full"
        style={{ touchAction: "none" }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerEnd}
        onPointerCancel={handlePointerEnd}
        onKeyDown={handleKeyDown}
      >
        {/* Visible track line — thin, neutral. */}
        <div
          aria-hidden="true"
          className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-0.5 bg-white/[0.10] rounded-full"
        />
        {/* Progress fill — from the start of the track to the
            current cursor position. */}
        <div
          aria-hidden="true"
          className="absolute left-0 top-1/2 -translate-y-1/2 h-0.5 bg-[#00d2ff]/40 rounded-full pointer-events-none"
          style={{
            width: `${overallProgress * 100}%`,
            transition: fillTransition,
          }}
        />
        {/* Tick marks per event. Each tick is a small clickable
            dot — the keyboard already covers navigation; the tick
            is for mouse users that want a one-click jump. */}
        {frames.map((frame, idx) => {
          const tickProgress = lastIndex === 0 ? 0 : idx / lastIndex;
          const isCurrent = idx === cursor.fromIndex;
          return (
            <button
              key={frame.event.id}
              type="button"
              tabIndex={-1}
              aria-hidden="true"
              onClick={(ev) => {
                ev.stopPropagation();
                handleTickClick(idx);
              }}
              className={`absolute top-1/2 -translate-y-1/2 -translate-x-1/2 rounded-full transition-colors pointer-events-auto ${
                isCurrent
                  ? "w-2 h-2 bg-[#00d2ff]"
                  : "w-1.5 h-1.5 bg-white/30 hover:bg-white/60"
              }`}
              style={{ left: `${tickProgress * 100}%` }}
              title={`${frame.event.date} — ${frame.event.title}`}
            />
          );
        })}
        {/* The thumb — visible cursor position. */}
        <div
          aria-hidden="true"
          className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-3.5 h-3.5 rounded-full bg-white border-2 border-[#00d2ff] shadow-[0_0_12px_rgba(0,210,255,0.5)] pointer-events-none"
          style={{
            left: `${overallProgress * 100}%`,
            transition: thumbTransition,
          }}
        />
      </div>

      {/* Controls — play/pause + prev + next. Below the track,
          centred. Each button is 44×44 to satisfy WCAG 2.5.5
          AAA. The genesis ↔ present date labels frame the
          track's ends verbally. */}
      <div className="mt-4 flex items-center justify-between gap-3">
        <span className="font-mono uppercase tracking-[0.18em] text-[9px] text-tertiary">
          {frames[0].event.date}
        </span>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => controller.prevFrame()}
            aria-label="Previous event"
            className="w-11 h-11 rounded-full flex items-center justify-center text-secondary hover:text-primary hover:bg-white/[0.04] transition-colors"
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 14 14"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
            >
              <path
                d="M9 11L4 7L9 3"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
          <button
            type="button"
            onClick={() =>
              isPlaying ? controller.pause() : controller.play()
            }
            aria-label={isPlaying ? "Pause playback" : "Play timeline"}
            className="w-11 h-11 rounded-full flex items-center justify-center text-[#00d2ff] hover:bg-[#00d2ff]/[0.08] transition-colors"
          >
            {isPlaying ? (
              <svg
                width="14"
                height="14"
                viewBox="0 0 14 14"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden="true"
              >
                <rect
                  x="3.5"
                  y="3"
                  width="2.5"
                  height="8"
                  rx="0.5"
                  fill="currentColor"
                />
                <rect
                  x="8"
                  y="3"
                  width="2.5"
                  height="8"
                  rx="0.5"
                  fill="currentColor"
                />
              </svg>
            ) : (
              <svg
                width="14"
                height="14"
                viewBox="0 0 14 14"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden="true"
              >
                <path
                  d="M4 3L11 7L4 11V3Z"
                  fill="currentColor"
                  strokeWidth="0"
                />
              </svg>
            )}
          </button>
          <button
            type="button"
            onClick={() => controller.nextFrame()}
            aria-label="Next event"
            className="w-11 h-11 rounded-full flex items-center justify-center text-secondary hover:text-primary hover:bg-white/[0.04] transition-colors"
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 14 14"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
            >
              <path
                d="M5 3L10 7L5 11"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>
        <span className="font-mono uppercase tracking-[0.18em] text-[9px] text-tertiary">
          {frames[lastIndex].event.date}
        </span>
      </div>
    </div>
  );
}
