/**
 * Hand-rolled text formatters for the CLI commands.
 *
 * V4 Sub-PR 2.4 (CLI v0.1.0) shipped four commands without any
 * shared formatting code. v0.1.1 adds four more that each need
 * relative-time rendering, column alignment, or text wrapping —
 * so this module pulls those primitives into one place.
 *
 * **Strict constraint** (V4 § 5.2.4): the CLI ships with **zero
 * runtime dependencies**. No `chalk`, no `commander`, no
 * `wrap-ansi`. Everything here is pure ECMAScript + native String
 * methods.
 *
 * The functions are deliberately conservative: no Unicode width
 * heuristics, no CJK handling, no terminal-feature detection.
 * The CLI outputs ASCII text + a handful of Unicode box-drawing
 * characters; any reasonable terminal renders both correctly.
 */

/**
 * Render an ISO timestamp as a quiet relative-time label.
 *
 * Calm vocabulary — `3m ago`, `2h ago`, `4d ago`, never anything
 * fancier. Past the one-week mark we return the absolute YYYY-MM-DD
 * stamp instead of a wishy-washy "3w ago" — the absolute date is
 * more useful when the value is meant for a developer scanning
 * `emredogan changelog` output.
 *
 * Returns `"—"` for missing / unparseable input so the caller can
 * pass the result straight into a table cell.
 */
export function formatAgo(iso: string | null | undefined): string {
  if (!iso) return "—";
  const then = new Date(iso).getTime();
  if (!Number.isFinite(then)) return "—";
  const deltaSec = Math.max(0, Math.round((Date.now() - then) / 1000));
  if (deltaSec < 60) return `${deltaSec}s ago`;
  const minutes = Math.round(deltaSec / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  if (days < 7) return `${days}d ago`;
  /* Past the one-week mark, render the absolute UTC date.
   * Relative becomes noise at that resolution. */
  return new Date(then).toISOString().slice(0, 10);
}

/**
 * Soft word-wrap to a given column width. Used by `changelog`
 * to render the WHY paragraph with a 4-space indent under each
 * commit subject.
 *
 * Behaviour:
 *   - Splits on whitespace runs (any combination of spaces /
 *     newlines / tabs).
 *   - Words longer than `width - indent.length` aren't broken —
 *     they take a line of their own (a long URL stays clickable
 *     in most terminals).
 *   - Leading `indent` prefixes every line including the first,
 *     so the caller can pass `"    "` and just concatenate the
 *     returned lines with `\n`.
 *   - Empty / whitespace-only input → returns `[]`.
 */
export function wrapText(
  text: string,
  width: number,
  indent: string = "",
): string[] {
  const trimmed = text.trim();
  if (!trimmed) return [];
  const words = trimmed.split(/\s+/);
  const usableWidth = Math.max(1, width - indent.length);
  const lines: string[] = [];
  let current = "";

  for (const word of words) {
    if (current.length === 0) {
      current = word;
      continue;
    }
    if (current.length + 1 + word.length <= usableWidth) {
      current = `${current} ${word}`;
    } else {
      lines.push(`${indent}${current}`);
      current = word;
    }
  }
  if (current.length > 0) {
    lines.push(`${indent}${current}`);
  }
  return lines;
}

/**
 * Right-pad a string to a fixed column width with spaces. The
 * `String.prototype.padEnd` builtin already does this — this is
 * a tiny wrapper that also handles the common "value might be
 * longer than the column" case by truncating with an ellipsis.
 *
 * Used by `telemetry` for ASCII-table column alignment.
 */
export function padCell(value: string, width: number): string {
  if (value.length === width) return value;
  if (value.length < width) return value.padEnd(width, " ");
  /* Truncation only happens for overly-long metric labels;
   * one character of headroom for the ellipsis is enough. */
  if (width < 1) return "";
  return value.slice(0, width - 1) + "…";
}
