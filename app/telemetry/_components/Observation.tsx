/* ──────────────────────────────────────────────────────────────
 *  Observation — V6 Sub-PR 15.1
 *
 *  An "inline observation" — a single sentence where the number
 *  IS the load-bearing element, rendered at display size, and the
 *  rest of the sentence flows around it in normal body type. The
 *  composition reads as prose, not a metric card.
 *
 *  Example output:
 *
 *    Lumina answers in about  ╳420 ms╳  at the 95th percentile,
 *    measured against the last 100 conversations.
 *
 *  Where ╳420 ms╳ is text-4xl tabular-nums cyan, and the rest is
 *  text-base secondary. The visitor reads it as a sentence, not as
 *  a dashboard tile.
 *
 *  Renders inline (no card chrome, no border, no background). When
 *  the snapshot is `null` (no data yet), the placeholder slot
 *  takes the number's typographic position so the line still reads
 *  as a complete sentence — the number is replaced by an italic
 *  tertiary phrase like "no data yet".
 *
 *  Server Component. No client JS. No motion. Reduced-motion safe
 *  by construction.
 *
 *  Spec ref: PORTFOLYO_V6_UI_EXECUTION_SYSTEM.md § Sub-PR 15.1.
 *  Audit ref: PORTFOLYO_V6_UI_AUDIT.md § 11.1 ("compose 18 tiles
 *             into 4-6 observations with narrative weight, place
 *             each metric inside a sentence").
 * ────────────────────────────────────────────────────────────── */

import type { ReactNode } from "react";

interface Props {
  /** Text that comes before the inline value. */
  prefix: string;
  /** Formatted value to render at display size. When `null` the
   *  placeholder text fills the slot in italic tertiary. */
  value: string | null;
  /** Optional unit token rendered immediately after the value
   *  (e.g. "ms", "USD") in mono uppercase. */
  unit?: string;
  /** Text after the inline value/unit. Closes the sentence. */
  suffix: string;
  /** Optional italic placeholder when value is null. */
  placeholder?: string;
  /** When true, applies a slightly tighter line-height for sections
   *  where multiple observations stack closely. */
  dense?: boolean;
}

export default function Observation({
  prefix,
  value,
  unit,
  suffix,
  placeholder,
  dense,
}: Props) {
  const hasValue = value !== null && value !== undefined && value !== "";

  /* The inline number rendering. When data is present, the value is
     `text-4xl text-[#00d2ff] tabular-nums` so it visually anchors the
     sentence. When data is absent, the placeholder slot uses italic
     tertiary at a smaller size — the line still reads as a sentence
     but the visitor sees "no data yet" instead of a fake zero. */
  let inline: ReactNode;
  if (hasValue) {
    inline = (
      <span className="inline-flex items-baseline gap-1 mx-1 align-baseline">
        <span className="text-3xl sm:text-4xl font-medium text-[#00d2ff] tabular-nums tracking-[-0.02em] leading-none">
          {value}
        </span>
        {unit ? (
          <span className="font-mono uppercase tracking-[0.18em] text-[10px] sm:text-xs text-tertiary">
            {unit}
          </span>
        ) : null}
      </span>
    );
  } else {
    inline = (
      <span className="inline-flex items-baseline mx-1 align-baseline">
        <span className="text-xl sm:text-2xl italic text-tertiary tracking-[-0.01em] leading-none">
          {placeholder ?? "no data yet"}
        </span>
      </span>
    );
  }

  return (
    <p
      className={
        dense
          ? "text-secondary text-[15px] leading-[1.7] max-w-2xl"
          : "text-secondary text-[15px] sm:text-base leading-[1.85] max-w-2xl"
      }
    >
      {prefix}
      {inline}
      {suffix}
    </p>
  );
}
