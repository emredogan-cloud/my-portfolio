import Image from "next/image";
import Link from "next/link";
import type { CodexBook } from "@/data/codex";

/* ──────────────────────────────────────────────────────────────
 *  CodexShelf — V6 Sub-PR 13.2
 *
 *  Covers arranged in a horizontal sequence at uneven heights,
 *  like books leaning on a shelf. The bottom edges align
 *  (items-end on the flex container); the tops rise to
 *  different heights per the per-book height profile:
 *
 *    Tuzun Hafızası — shortest (the newest, most in-progress
 *                     acquisition; opens the shelf as the first
 *                     in display order)
 *    Mendîran       — tallest  (the elder volume)
 *    Mythologica    — mid      (the broadest in scope)
 *    Solgun         — short    (the most recent before Tuzun)
 *
 *  The render order (left-to-right on desktop, top-to-bottom on
 *  mobile) follows the data/codex.ts `codexBooks` array — the
 *  HEIGHT profile is decoupled from order, so the four covers
 *  read as an undulating skyline rather than a strict staircase.
 *
 *  Each cover carries the existing sigil ribbon at the bottom
 *  inset; on hover (desktop) the cover lifts ~4 px and a small
 *  cluster of atmosphere chips materializes beside it. Mobile
 *  (no hover) keeps the chips visible below each cover always —
 *  the spec's "tap to reveal" intent is met by the Link
 *  navigating into the book on tap.
 *
 *  Pure Server Component. Hover-lift uses Tailwind transform
 *  utilities with motion-reduce variants that collapse the lift
 *  to a static composition under prefers-reduced-motion.
 *
 *  Spec ref: PORTFOLYO_V6_UI_EXECUTION_SYSTEM.md § Sub-PR 13.2.
 *  Audit ref: PORTFOLYO_V6_UI_AUDIT.md § 8.1.
 * ────────────────────────────────────────────────────────────── */

interface ShelfEntry {
  readonly book: CodexBook;
  /** Tailwind classes for the cover wrapper's height + width on lg+ / md+ / mobile. */
  readonly heightClasses: string;
  /** Mobile horizontal offset class — small stagger per spec
   *  ("covers stack but staggered (small horizontal offset per cover)"). */
  readonly mobileOffsetClass: string;
}

/* Height profile per spec: Mendîran tallest, Mythologica mid,
 * Solgun and Tuzun shorter (newest acquisitions, most in-progress).
 * Width tracks the book cover aspect (~3:5 portrait), capped to
 * leave room for the chips column on lg+. */
const SHELF_HEIGHT: Record<string, string> = {
  "tuzun-hafizasi":
    "h-[185px] sm:h-[215px] md:h-[240px] lg:h-[260px] w-[133px] sm:w-[152px] md:w-[170px] lg:w-[188px]",
  "mendiran-vakayinamesi":
    "h-[260px] sm:h-[300px] md:h-[340px] lg:h-[360px] w-[160px] sm:w-[180px] md:w-[200px] lg:w-[220px]",
  "codex-mythologica":
    "h-[230px] sm:h-[265px] md:h-[300px] lg:h-[320px] w-[150px] sm:w-[170px] md:w-[190px] lg:w-[208px]",
  "solgun-kitabe":
    "h-[200px] sm:h-[235px] md:h-[260px] lg:h-[280px] w-[140px] sm:w-[160px] md:w-[180px] lg:w-[196px]",
};

/* Mobile staggers — small horizontal offsets per cover so the
 * stacked column doesn't read as a strict centred grid. */
const SHELF_OFFSET: Record<string, string> = {
  "tuzun-hafizasi": "self-start",
  "mendiran-vakayinamesi": "self-start",
  "codex-mythologica": "self-center",
  "solgun-kitabe": "self-end",
};

export interface CodexShelfProps {
  readonly books: readonly CodexBook[];
}

export default function CodexShelf({ books }: CodexShelfProps) {
  const entries: ShelfEntry[] = books.map((book) => ({
    book,
    heightClasses:
      SHELF_HEIGHT[book.slug] ??
      "h-[240px] md:h-[300px] lg:h-[320px] w-[160px] md:w-[200px] lg:w-[208px]",
    mobileOffsetClass: SHELF_OFFSET[book.slug] ?? "self-center",
  }));

  return (
    <div className="relative">
      {/* Shelf floor — a faint hairline beneath the covers on lg+
          that anchors them visually to a shared baseline. The
          CodexLineage component renders its own labeled timeline
          immediately below this; the two compose into a single
          "shelf + lineage" composition. */}
      <div
        aria-hidden="true"
        className="hidden lg:block pointer-events-none absolute left-0 right-0 bottom-0 h-px"
        style={{
          background:
            "linear-gradient(to right, transparent, rgba(255,255,255,0.06) 18%, rgba(255,255,255,0.06) 82%, transparent)",
        }}
      />

      {/* lg+: horizontal flex with items-end so covers lean on
          the shelf floor at different heights.
          < lg: flex column with per-cover horizontal offsets
          (self-start / self-center / self-end) to stagger the
          stack so it doesn't read as a strict centred grid. */}
      <ul className="flex flex-col lg:flex-row items-stretch lg:items-end gap-10 sm:gap-12 lg:gap-14 lg:justify-center lg:pb-1">
        {entries.map(({ book, heightClasses, mobileOffsetClass }, i) => (
          <li
            key={book.slug}
            className={`group relative flex flex-col lg:flex-row lg:items-end gap-5 lg:gap-6 ${mobileOffsetClass} lg:self-end`}
          >
            <Link
              href={`/codex/${book.slug}`}
              aria-label={`Open ${book.title}`}
              className="block relative shrink-0 transition-transform duration-500 ease-out motion-reduce:transition-none group-hover:-translate-y-1 motion-reduce:group-hover:translate-y-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00d2ff]/40 focus-visible:ring-offset-2 focus-visible:ring-offset-black rounded-md"
            >
              <div
                className={`relative overflow-hidden rounded-md border border-white/[0.08] bg-white/[0.015] ${heightClasses}`}
              >
                <Image
                  src={book.cover}
                  alt={`${book.title} — cover spread`}
                  fill
                  className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.02] motion-reduce:transition-none motion-reduce:group-hover:scale-100"
                  sizes="(max-width: 768px) 50vw, (max-width: 1024px) 30vw, 220px"
                  priority={i === 0}
                />

                {/* Bottom cinematic wash so the sigil ribbon
                    sits on a quiet ground, not on cover noise. */}
                <div
                  aria-hidden="true"
                  className="absolute inset-x-0 bottom-0 h-20 pointer-events-none bg-gradient-to-t from-black/85 via-black/40 to-transparent"
                />

                {/* Sigil ribbon — sigil glyph + in-world year.
                    Same vocabulary as the existing folio ribbon
                    but inset slightly tighter to fit the shelf
                    proportions. */}
                <div className="absolute left-2.5 bottom-2.5 inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-black/55 px-2 py-0.5">
                  <span
                    className="text-[#00d2ff] text-[13px] leading-none"
                    aria-hidden="true"
                  >
                    {book.sigil}
                  </span>
                  <span className="font-mono uppercase tracking-[0.18em] text-[9px] text-primary">
                    {book.inWorldYear}
                  </span>
                </div>
              </div>
            </Link>

            {/* Atmosphere chips — materialize beside the cover on
                lg+ hover (group-hover on the row); always visible
                below the cover on mobile so the chip data is
                still reachable without hover. Pure CSS reveal —
                no JS. */}
            <div className="flex flex-col gap-1.5 lg:max-w-[180px] lg:opacity-0 lg:-translate-x-1 lg:group-hover:opacity-100 lg:group-hover:translate-x-0 lg:transition-all lg:duration-500 motion-reduce:lg:transition-none">
              <p className="font-mono uppercase tracking-[0.18em] text-[9px] text-quiet lg:hidden">
                Atmospheres
              </p>
              {book.atmospheres.map((atm) => (
                <span
                  key={atm.name}
                  className="inline-flex items-baseline gap-1.5 font-mono uppercase tracking-[0.18em] text-[10px] text-[#00d2ff]/85"
                >
                  <span>{atm.name}</span>
                  <span aria-hidden="true" className="text-faint">·</span>
                  <span className="text-tertiary normal-case tracking-normal italic">
                    {atm.mood}
                  </span>
                </span>
              ))}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
