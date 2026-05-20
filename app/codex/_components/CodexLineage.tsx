import type { CodexBook } from "@/data/codex";

/* ──────────────────────────────────────────────────────────────
 *  CodexLineage — V6 Sub-PR 13.2
 *
 *  Horizontal cyan timeline rule that runs beneath the
 *  CodexShelf, anchoring each book to its in-world year via a
 *  labeled tick. The three books live in three different
 *  calendar systems (VS / MMXXVI / Yİ.) so the rule is a
 *  symbolic spine rather than a strict scaled axis — the visual
 *  reads as "these three works are kin without sharing a clock."
 *
 *  Mobile (`< lg`): collapses to a vertical timeline (a column
 *  of ticks with the books' titles + years stacked beneath each
 *  cover in the shelf grid above). Per spec: "Mobile: …lineage
 *  collapses to a vertical timeline."
 *
 *  Pure Server Component. No motion, no animation. The cyan
 *  rule uses a gradient that fades at both edges so it reads as
 *  typography (a horizontal hairline) rather than chrome.
 *
 *  Spec ref: PORTFOLYO_V6_UI_EXECUTION_SYSTEM.md § Sub-PR 13.2.
 * ────────────────────────────────────────────────────────────── */

export interface CodexLineageProps {
  readonly books: readonly CodexBook[];
}

export default function CodexLineage({ books }: CodexLineageProps) {
  return (
    <div className="mt-10 lg:mt-12">
      {/* ── lg+: horizontal lineage rule with labeled ticks ─── */}
      <div className="hidden lg:block">
        <div className="relative h-px max-w-4xl mx-auto">
          {/* The rule itself — gradient cyan hairline at 22 %
              opacity, fading at both edges. Sits at the vertical
              centre of this 1px-tall container. */}
          <div
            aria-hidden="true"
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(to right, transparent, rgba(0,210,255,0.22) 18%, rgba(0,210,255,0.22) 82%, transparent)",
            }}
          />

          {/* Ticks — one per book, evenly distributed across the
              rule. Each tick is a 1×8 px cyan rule perpendicular
              to the horizontal hairline, with the in-world year
              and book title rendered below the tick. */}
          {books.map((book, i) => {
            const left = `${((i + 0.5) / books.length) * 100}%`;
            return (
              <div
                key={book.slug}
                className="absolute top-0 -translate-x-1/2"
                style={{ left }}
              >
                {/* Vertical tick. */}
                <span
                  aria-hidden="true"
                  className="absolute left-1/2 -translate-x-1/2 -top-1 inline-block w-px h-2.5 bg-[#00d2ff]/60"
                />
                {/* Cyan node dot sitting on the rule. */}
                <span
                  aria-hidden="true"
                  className="absolute left-1/2 -translate-x-1/2 top-0 -translate-y-1/2 inline-block w-1.5 h-1.5 rounded-full bg-[#00d2ff]"
                />
                {/* Year + title labels below the rule. */}
                <div className="absolute left-1/2 -translate-x-1/2 top-3 whitespace-nowrap text-center">
                  <p className="font-mono uppercase tracking-[0.18em] text-[10px] text-[#00d2ff]/85">
                    {book.inWorldYear}
                  </p>
                  <p className="font-medium tracking-tight text-[12px] text-secondary mt-1">
                    {book.title}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
        {/* Spacer to give the labels below the rule their
            vertical breathing room — each label is ~46 px tall. */}
        <div className="h-16" aria-hidden="true" />
      </div>

      {/* ── < lg: vertical lineage list ──────────────────────── */}
      <ol className="lg:hidden mt-2 space-y-3">
        {books.map((book) => (
          <li
            key={book.slug}
            className="flex items-baseline gap-3 text-[12px] leading-tight"
          >
            <span
              aria-hidden="true"
              className="inline-block w-1.5 h-1.5 rounded-full bg-[#00d2ff] shrink-0 self-center"
            />
            <span className="font-mono uppercase tracking-[0.18em] text-[10px] text-[#00d2ff]/85 shrink-0">
              {book.inWorldYear}
            </span>
            <span className="font-medium tracking-tight text-secondary truncate">
              {book.title}
            </span>
          </li>
        ))}
      </ol>
    </div>
  );
}
