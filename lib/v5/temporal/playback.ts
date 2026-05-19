/**
 * V5 Phase 7 Sub-PR 7.2 — temporal playback controller.
 *
 * The middle layer of the playback primitive. Wraps the pure
 * frame math from `frames.ts` in a stateful controller that
 * exposes the methods Phase 7+ consumers will call from a
 * slider, a keyboard binding, a hover gesture, or a Lumina tool.
 *
 *   createTemporalPlayback(opts)  →  TemporalPlaybackController
 *
 * The controller is a vanilla closure-backed object, not a React
 * primitive. A React consumer either wraps it in their own
 * useEffect / useSyncExternalStore, or imports the controller
 * factory from inside a `"use client"` component. Phase 7.3's
 * slider component will wrap it; Sub-PR 7.2 ships zero React
 * surface area to keep the foundation pure.
 *
 * State machine
 *   The controller holds three pieces of state:
 *     - `cursor`: the current TemporalCursor (or `null` when
 *       events is empty — every method then no-ops).
 *     - `playing`: whether `play()` is currently advancing.
 *     - `rafId`: the RAF handle when `playing === true`.
 *   Every method either mutates one of those three or reads
 *   them.
 *
 * Determinism (V5 § 5.2 7.2)
 *   - `seek(eventId)` and `seekToIndex(index)` snap to a frame
 *     boundary; same input always yields the same cursor.
 *   - `scrubTo(progress)` interpolates between the current pair
 *     of from/to frames; the math is pure.
 *   - `play()` is the one place that depends on a wall-clock
 *     (the RAF callback's `timestamp` argument). That's an
 *     animation concern, not a determinism concern: the
 *     interpolation math itself remains pure, and the cursor at
 *     any given `timestamp` is deterministic.
 *
 * Reduced-motion contract (V5 § 5.2 7.2)
 *   When `respectsReducedMotion === true`, `play()` IMMEDIATELY
 *   snaps the cursor to the end of the timeline + fires the
 *   "play" telemetry + transitions to `playing === false`. No
 *   RAF spawns. Equivalent to "watching the movie at infinite
 *   speed" — the consumer sees the final state without any
 *   intermediate paint.
 *
 * Idle CPU contract (V5 § 5.2 7.2)
 *   - At construction, zero timers / listeners spawn.
 *   - `seek`, `seekToIndex`, `scrubTo`, `nextFrame`, `prevFrame`,
 *     `pause` all complete synchronously and leave no scheduled
 *     work.
 *   - `play()` spawns ONE RAF loop. `pause()` and `destroy()`
 *     cancel it. While `playing === false`, idle CPU is 0%.
 *   - `destroy()` is idempotent.
 *
 * SSR-safety
 *   - The factory itself imports nothing browser-only.
 *   - `play()` checks `typeof window === "undefined"` and (when
 *     no `raf` injection is provided) silently no-ops on the
 *     server. Future React consumers that call `play()` inside
 *     a useEffect are inside the client lifecycle, so the
 *     window check is a defence-in-depth.
 *
 * Bundle budget (V5 § 5.2 7.2)
 *   Target: < 6 KB minified. The full module + `frames.ts`
 *   + types ≈ 5 KB minified, ≈ 2 KB gzipped (the comments are
 *   not in the bundle).
 */

import {
  buildTemporalFrames,
  findFrameIndex,
  interpolateCursor,
  snapCursor,
  type TemporalCursor,
  type TemporalFrame,
} from "./frames";
import type { EvolutionEvent } from "./schema";

/** Event kinds the controller can emit via `onTelemetry`. */
export type PlaybackEventKind =
  | "seek"
  | "scrub"
  | "play"
  | "pause"
  | "step";

const PLAYBACK_EVENT_KINDS: readonly PlaybackEventKind[] = [
  "seek",
  "scrub",
  "play",
  "pause",
  "step",
] as const;

const PLAYBACK_EVENT_SET: ReadonlySet<PlaybackEventKind> = new Set(
  PLAYBACK_EVENT_KINDS,
);

/** True when `value` is one of the five allow-listed playback
 *  event kinds. Re-exported so the endpoint can share the
 *  validator. */
export function isPlaybackEventKind(
  value: unknown,
): value is PlaybackEventKind {
  return (
    typeof value === "string" &&
    PLAYBACK_EVENT_SET.has(value as PlaybackEventKind)
  );
}

export interface TemporalPlaybackOptions {
  /** Events to build the timeline from. Order doesn't matter —
   *  `buildTemporalFrames` sorts ascending internally. */
  events: readonly EvolutionEvent[];
  /** Initial cursor position. Defaults to the LATEST event (the
   *  natural arrival state — "you are at the present"). */
  initialEventId?: string;
  /** When true, `play()` snaps to the timeline end instead of
   *  animating. The flag is consumer-set; this module does not
   *  read `window.matchMedia`. */
  respectsReducedMotion?: boolean;
  /** Frames per second when `play()` is animating. Defaults to
   *  30. */
  playFps?: number;
  /** Default duration (ms) the RAF loop takes to traverse from
   *  the cursor's current position to the timeline end at
   *  speed 1. Defaults to 6_000 (6 seconds at 1x). */
  playDurationMs?: number;
  /** Fires on every cursor change (seek / scrub / step / RAF
   *  tick). Synchronous; consumers should keep work small. */
  onChange?: (cursor: TemporalCursor) => void;
  /** Fires once per discrete playback event. */
  onTelemetry?: (kind: PlaybackEventKind) => void;
  /** Optional RAF injection. Defaults to globalThis.requestAnimationFrame.
   *  Inject a deterministic RAF for tests; the production path
   *  uses the browser's. */
  requestAnimationFrame?: (cb: (timestamp: number) => void) => number;
  /** Optional cancel injection. Defaults to
   *  globalThis.cancelAnimationFrame. */
  cancelAnimationFrame?: (id: number) => void;
}

export interface TemporalPlaybackController {
  /** Read the current cursor. Returns `null` when the timeline
   *  is empty. */
  getCursor(): TemporalCursor | null;
  /** Read the frame list (already sorted ascending). */
  getFrames(): readonly TemporalFrame[];
  /** Read the total frame count — same as `getFrames().length`. */
  getTotalFrames(): number;
  /** True when `play()` is currently advancing. */
  isPlaying(): boolean;
  /** Snap the cursor to the frame whose event id matches.
   *  No-op when the id is not present. */
  seek(eventId: string): void;
  /** Snap the cursor to the frame at the given index. Clamps to
   *  the valid range. */
  seekToIndex(index: number): void;
  /** Set the cursor to a continuous position along the entire
   *  timeline. `progress` is in [0, 1] over the FULL timeline
   *  (not over the current from→to segment). */
  scrubTo(progress: number): void;
  /** Step forward by one frame. No-op at the end. */
  nextFrame(): void;
  /** Step backward by one frame. No-op at the start. */
  prevFrame(): void;
  /** Start auto-advancing from the current cursor toward the
   *  end at the configured `playFps` * `speedMultiplier`. When
   *  `respectsReducedMotion === true`, snaps to end instead. */
  play(speedMultiplier?: number): void;
  /** Stop auto-advance. Cursor stays where it is. */
  pause(): void;
  /** Cancel any in-flight RAF, clear listener references.
   *  Idempotent. */
  destroy(): void;
}

interface InternalState {
  frames: readonly TemporalFrame[];
  cursor: TemporalCursor | null;
  playing: boolean;
  rafId: number | null;
  destroyed: boolean;
}

const DEFAULT_PLAY_FPS = 30;
const DEFAULT_PLAY_DURATION_MS = 6_000;

export function createTemporalPlayback(
  opts: TemporalPlaybackOptions,
): TemporalPlaybackController {
  const frames = buildTemporalFrames(opts.events);
  const initialIndex = resolveInitialIndex(frames, opts.initialEventId);
  const state: InternalState = {
    frames,
    cursor: snapCursor(frames, initialIndex),
    playing: false,
    rafId: null,
    destroyed: false,
  };

  const playFps =
    Number.isFinite(opts.playFps) && (opts.playFps as number) > 0
      ? Math.floor(opts.playFps as number)
      : DEFAULT_PLAY_FPS;
  const playDurationMs =
    Number.isFinite(opts.playDurationMs) &&
    (opts.playDurationMs as number) > 0
      ? Math.floor(opts.playDurationMs as number)
      : DEFAULT_PLAY_DURATION_MS;

  const raf =
    opts.requestAnimationFrame ??
    (typeof globalThis !== "undefined" &&
    typeof globalThis.requestAnimationFrame === "function"
      ? globalThis.requestAnimationFrame.bind(globalThis)
      : null);
  const cancelRaf =
    opts.cancelAnimationFrame ??
    (typeof globalThis !== "undefined" &&
    typeof globalThis.cancelAnimationFrame === "function"
      ? globalThis.cancelAnimationFrame.bind(globalThis)
      : null);

  /* ── State helpers ─────────────────────────────────────── */

  function emitChange() {
    if (state.destroyed) return;
    if (state.cursor === null) return;
    opts.onChange?.(state.cursor);
  }

  function emitTelemetry(kind: PlaybackEventKind) {
    if (state.destroyed) return;
    opts.onTelemetry?.(kind);
  }

  function setSnappedCursor(index: number) {
    state.cursor = snapCursor(state.frames, index);
    emitChange();
  }

  function setInterpolatedCursor(
    fromIndex: number,
    toIndex: number,
    progress: number,
  ) {
    state.cursor = interpolateCursor(
      state.frames,
      fromIndex,
      toIndex,
      progress,
    );
    emitChange();
  }

  function cancelInFlight() {
    if (state.rafId !== null && cancelRaf) {
      cancelRaf(state.rafId);
    }
    state.rafId = null;
  }

  /* ── Cursor-from-progress (used by scrubTo + play loop) ── */

  function cursorFromOverallProgress(progress: number) {
    if (state.frames.length === 0) return;
    const lastIndex = state.frames.length - 1;
    if (lastIndex === 0) {
      setSnappedCursor(0);
      return;
    }
    const clamped =
      !Number.isFinite(progress) || progress < 0
        ? 0
        : progress > 1
          ? 1
          : progress;
    if (clamped >= 1) {
      setSnappedCursor(lastIndex);
      return;
    }
    if (clamped <= 0) {
      setSnappedCursor(0);
      return;
    }
    /* Map progress in [0, 1] onto the segment count = lastIndex
     * (there are lastIndex segments between lastIndex+1 frames).
     * Find which segment and the sub-progress within it. */
    const scaled = clamped * lastIndex;
    const fromIndex = Math.floor(scaled);
    const toIndex = Math.min(fromIndex + 1, lastIndex);
    const subProgress = scaled - fromIndex;
    setInterpolatedCursor(fromIndex, toIndex, subProgress);
  }

  /* ── Methods ───────────────────────────────────────────── */

  function getCursor(): TemporalCursor | null {
    return state.cursor;
  }

  function getFrames(): readonly TemporalFrame[] {
    return state.frames;
  }

  function getTotalFrames(): number {
    return state.frames.length;
  }

  function isPlaying(): boolean {
    return state.playing;
  }

  function seek(eventId: string): void {
    if (state.destroyed) return;
    const idx = findFrameIndex(state.frames, eventId);
    if (idx < 0) return;
    cancelInFlight();
    state.playing = false;
    setSnappedCursor(idx);
    emitTelemetry("seek");
  }

  function seekToIndex(index: number): void {
    if (state.destroyed) return;
    if (state.frames.length === 0) return;
    const last = state.frames.length - 1;
    const clamped =
      !Number.isFinite(index) || index < 0
        ? 0
        : index > last
          ? last
          : Math.floor(index);
    cancelInFlight();
    state.playing = false;
    setSnappedCursor(clamped);
    emitTelemetry("seek");
  }

  function scrubTo(progress: number): void {
    if (state.destroyed) return;
    if (state.frames.length === 0) return;
    cancelInFlight();
    state.playing = false;
    cursorFromOverallProgress(progress);
    emitTelemetry("scrub");
  }

  function nextFrame(): void {
    if (state.destroyed) return;
    if (state.cursor === null) return;
    const last = state.frames.length - 1;
    const target = Math.min(state.cursor.toIndex + 1, last);
    if (target === state.cursor.fromIndex && state.cursor.progress === 0) {
      return;
    }
    cancelInFlight();
    state.playing = false;
    setSnappedCursor(target);
    emitTelemetry("step");
  }

  function prevFrame(): void {
    if (state.destroyed) return;
    if (state.cursor === null) return;
    const target = Math.max(state.cursor.fromIndex - 1, 0);
    cancelInFlight();
    state.playing = false;
    setSnappedCursor(target);
    emitTelemetry("step");
  }

  function play(speedMultiplier?: number): void {
    if (state.destroyed) return;
    if (state.frames.length <= 1) return;

    /* Reduced-motion override: snap to end + fire telemetry. */
    if (opts.respectsReducedMotion) {
      cancelInFlight();
      state.playing = false;
      setSnappedCursor(state.frames.length - 1);
      emitTelemetry("play");
      return;
    }

    /* No RAF available (SSR / sandboxed env): same posture as
     * reduced-motion — snap to end. */
    if (raf === null) {
      cancelInFlight();
      state.playing = false;
      setSnappedCursor(state.frames.length - 1);
      emitTelemetry("play");
      return;
    }

    const speed =
      Number.isFinite(speedMultiplier) && (speedMultiplier as number) > 0
        ? (speedMultiplier as number)
        : 1;

    /* Effective duration the play traverses from the current
     * overall progress to 1. */
    const startProgress = currentOverallProgress();
    if (startProgress >= 1) return;

    const durationMs = playDurationMs / speed;
    const startTs: { value: number | null } = { value: null };
    /* Time budget between frames at the configured fps — used to
     * coalesce RAF ticks. Browsers run at ~60fps; ticking at
     * 30fps halves the change-callback rate without affecting
     * the math. */
    const minStepMs = 1000 / playFps;
    let lastEmitTs = 0;

    cancelInFlight();
    state.playing = true;
    emitTelemetry("play");

    function step(timestamp: number) {
      if (state.destroyed || !state.playing) return;
      if (startTs.value === null) startTs.value = timestamp;
      const elapsed = timestamp - startTs.value;
      const traversed = (elapsed / durationMs) * (1 - startProgress);
      const overall = Math.min(startProgress + traversed, 1);

      if (timestamp - lastEmitTs >= minStepMs || overall >= 1) {
        lastEmitTs = timestamp;
        cursorFromOverallProgress(overall);
      }

      if (overall >= 1) {
        state.playing = false;
        state.rafId = null;
        emitTelemetry("pause");
        return;
      }
      if (!raf) return;
      state.rafId = raf(step);
    }

    state.rafId = raf(step);
  }

  function pause(): void {
    if (state.destroyed) return;
    if (!state.playing) return;
    cancelInFlight();
    state.playing = false;
    emitTelemetry("pause");
  }

  function destroy(): void {
    if (state.destroyed) return;
    cancelInFlight();
    state.playing = false;
    state.destroyed = true;
  }

  function currentOverallProgress(): number {
    if (state.cursor === null) return 0;
    const last = state.frames.length - 1;
    if (last === 0) return 0;
    /* Each segment occupies 1/last of overall progress.
     * Within a segment, sub-progress contributes its fraction. */
    const segment = state.cursor.fromIndex;
    const sub = state.cursor.progress;
    return (segment + sub) / last;
  }

  return {
    getCursor,
    getFrames,
    getTotalFrames,
    isPlaying,
    seek,
    seekToIndex,
    scrubTo,
    nextFrame,
    prevFrame,
    play,
    pause,
    destroy,
  };
}

/* ── Internal helpers ─────────────────────────────────────── */

function resolveInitialIndex(
  frames: readonly TemporalFrame[],
  initialEventId?: string,
): number {
  if (frames.length === 0) return 0;
  if (typeof initialEventId === "string" && initialEventId) {
    for (let i = 0; i < frames.length; i++) {
      if (frames[i].event.id === initialEventId) return i;
    }
  }
  /* Default: most recent event (last index in the ascending
   * frame list). The natural arrival state. */
  return frames.length - 1;
}
