/**
 * V5 Phase 7 Sub-PR 7.2 — temporal frame math.
 *
 * The lowest layer of the playback primitive. Pure functions over
 * `EvolutionEvent[]` that turn a chronologically-ordered registry
 * into an indexed frame list with deterministic interpolation
 * between adjacent frames.
 *
 * What a "frame" is in Phase 7
 *   A `TemporalFrame` is a position in the chronological event
 *   list — an integer index + the event at that index + a
 *   millisecond timestamp parsed from `event.date`. Subsequent
 *   sub-PRs (7.3 slider, 7.4 architecture-page integration, Phase
 *   8 cinematic topology) will pair frames with visual states;
 *   this module ships ONLY the temporal cursor math.
 *
 * What a "cursor" is
 *   A `TemporalCursor` represents a continuous position in time —
 *   a `fromIndex`, a `toIndex`, and a `progress` value in [0, 1].
 *   When `progress === 0` the cursor is snapped to `fromIndex`;
 *   when `progress === 1` it has reached `toIndex`; in between
 *   it sits at an interpolated `cursorT` between the two frames'
 *   timestamps. The cursor is the contract Phase 7+ consumers
 *   read.
 *
 * Determinism contract (V5 § 5.2 7.2 validation):
 *   - `buildTemporalFrames(events)` returns the same frames given
 *     the same events (stable ascending sort + tie-break on id).
 *   - `interpolateCursor(frames, fromIndex, toIndex, progress)`
 *     is a pure function of its four inputs. No Date.now(), no
 *     Math.random(), no global state.
 *   - `frameTimestamp(event)` is `Date.parse(<date>T00:00:00Z)`
 *     — the same value every call.
 *
 * Edge-safety: pure data + pure functions. No DOM, no
 * `process.env`, no I/O. Safe to import from any runtime.
 */

import type { EvolutionEvent } from "./schema";

/** A single point on the playback timeline. */
export interface TemporalFrame {
  /** 0-based index into the chronologically-sorted frame list. */
  index: number;
  /** The event at this position. */
  event: EvolutionEvent;
  /** UTC midnight of `event.date` as ms since epoch. The unit
   *  Phase 7+ consumers do their time math in. */
  t: number;
}

/**
 * A continuous position in time. The contract consumers read:
 *
 *   - `fromFrame` is the most recent frame on or before the
 *     cursor.
 *   - `toFrame` is the next frame after the cursor, or the same
 *     frame as `fromFrame` when the cursor is at or past the
 *     end.
 *   - `progress` is the linear fraction in [0, 1] between
 *     `fromFrame.t` and `toFrame.t`.
 *   - `cursorT` is the interpolated timestamp. Equals
 *     `fromFrame.t` when `progress === 0`, `toFrame.t` when
 *     `progress === 1`.
 *
 * Single-frame timelines collapse to `fromFrame === toFrame`,
 * `progress === 0`. Consumers should branch on `totalFrames` to
 * decide whether playback is meaningful at all.
 */
export interface TemporalCursor {
  fromIndex: number;
  toIndex: number;
  progress: number;
  fromFrame: TemporalFrame;
  toFrame: TemporalFrame;
  cursorT: number;
  totalFrames: number;
}

/**
 * Parse an `EvolutionEvent.date` (YYYY-MM-DD) into a UTC ms
 * timestamp. Treats every event as occurring at midnight UTC of
 * its declared date — finer granularity isn't editorial signal
 * the schema captures.
 *
 * Determinism: `Date.parse` is locale-independent for the
 * `YYYY-MM-DDTHH:mm:ssZ` shape, so the output is identical on
 * every runtime and every machine.
 */
export function frameTimestamp(event: EvolutionEvent): number {
  return Date.parse(`${event.date}T00:00:00Z`);
}

/**
 * Build an indexed, chronologically-ascending frame list from
 * a `readonly EvolutionEvent[]`.
 *
 * Sort:
 *   - Primary: `t` ascending (oldest first — opposite of the
 *     7.1 registry's default descending sort, which prefers
 *     newest-first for editorial display).
 *   - Tie-break: `id` ascending (stable order for events that
 *     share a calendar date).
 *
 * Events with non-finite timestamps (a malformed date the
 * schema validator missed) are dropped. The frame indices are
 * computed AFTER the filter, so they remain dense.
 */
export function buildTemporalFrames(
  events: readonly EvolutionEvent[],
): readonly TemporalFrame[] {
  /* Materialise [event, t] pairs, drop non-finite t. */
  const pairs: Array<{ event: EvolutionEvent; t: number }> = [];
  for (const event of events) {
    const t = frameTimestamp(event);
    if (Number.isFinite(t)) pairs.push({ event, t });
  }
  /* Ascending sort with id tie-break. */
  pairs.sort((a, b) => {
    if (a.t !== b.t) return a.t - b.t;
    return a.event.id < b.event.id ? -1 : a.event.id > b.event.id ? 1 : 0;
  });
  /* Assign dense indices. */
  return pairs.map(({ event, t }, index) => ({ index, event, t }));
}

/**
 * Build a cursor at the given `(fromIndex, toIndex, progress)`
 * triple. The function CLAMPS every input to a valid range:
 *
 *   - `fromIndex` clamps to `[0, frames.length - 1]`
 *   - `toIndex` clamps to `[fromIndex, frames.length - 1]`
 *   - `progress` clamps to `[0, 1]` and snaps to 0 when
 *     `fromIndex === toIndex` (no interpolation needed)
 *
 * Returns `null` when `frames` is empty — the only path that
 * cannot produce a valid cursor.
 *
 * The `cursorT` field is a linear interpolation; consumers that
 * want easing apply it on top of the linear progress in their
 * own render layer (V5 § 2.5 keeps spring physics banned, but
 * cubic-bezier easing remains the rendering layer's choice).
 */
export function interpolateCursor(
  frames: readonly TemporalFrame[],
  fromIndex: number,
  toIndex: number,
  progress: number,
): TemporalCursor | null {
  if (frames.length === 0) return null;

  const totalFrames = frames.length;
  const lastIndex = totalFrames - 1;

  const from = clampInt(fromIndex, 0, lastIndex);
  const to = clampInt(toIndex, from, lastIndex);
  let p = clampUnit(progress);
  if (from === to) p = 0;

  const fromFrame = frames[from];
  const toFrame = frames[to];
  const cursorT =
    from === to
      ? fromFrame.t
      : fromFrame.t + (toFrame.t - fromFrame.t) * p;

  return {
    fromIndex: from,
    toIndex: to,
    progress: p,
    fromFrame,
    toFrame,
    cursorT,
    totalFrames,
  };
}

/**
 * Build the canonical "snapped to frame N" cursor — the default
 * a consumer reads when no scrubbing is active. Equivalent to
 * `interpolateCursor(frames, index, index, 0)` with one
 * branch on empty `frames`.
 */
export function snapCursor(
  frames: readonly TemporalFrame[],
  index: number,
): TemporalCursor | null {
  return interpolateCursor(frames, index, index, 0);
}

/**
 * Resolve an event id to its frame index. Returns -1 when the
 * id is not in the list. Linear scan; the frame count in the
 * V5 registry is bounded by editorial discipline (a handful per
 * year), so a binary search would be premature.
 */
export function findFrameIndex(
  frames: readonly TemporalFrame[],
  eventId: string,
): number {
  if (typeof eventId !== "string" || !eventId) return -1;
  for (let i = 0; i < frames.length; i++) {
    if (frames[i].event.id === eventId) return i;
  }
  return -1;
}

/* ── Internal helpers ─────────────────────────────────────── */

function clampInt(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) return min;
  const v = Math.floor(value);
  if (v < min) return min;
  if (v > max) return max;
  return v;
}

function clampUnit(value: number): number {
  if (!Number.isFinite(value)) return 0;
  if (value < 0) return 0;
  if (value > 1) return 1;
  return value;
}
