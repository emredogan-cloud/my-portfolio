import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { Note } from "@/data/notes";

/* ──────────────────────────────────────────────────────────────
 *  ChronicleColumn — V6 Sub-PR 13.1
 *
 *  The post-lead notes list. Groups by year (sticky-cluster year
 *  label on the left margin) and renders each note as a single
 *  collapsed row — title + readtime — with a cyan tick expand
 *  affordance that opens an inline excerpt + "Read note" link.
 *
 *  Pure Server Component. Uses native <details>/<summary> for the
 *  expand/collapse so the chronicle ships zero client JS per V6
 *  § 13.1 spec ("No client JS for the chronicle (server-rendered)").
 *
 *  Tags are intentionally retired from the chronicle per audit
 *  § 7.3 — they exist in the data but don't render here. The note
 *  detail page may still surface them.
 *
 *  Audit ref: PORTFOLYO_V6_UI_AUDIT.md § 7.1.
 *  Spec ref:  PORTFOLYO_V6_UI_EXECUTION_SYSTEM.md § Sub-PR 13.1.
 * ────────────────────────────────────────────────────────────── */

function extractYear(iso: string): string {
  // YYYY-MM-DD → YYYY (V5 dates are ISO; no locale parsing needed)
  return iso.slice(0, 4);
}

interface YearGroup {
  year: string;
  notes: Note[];
}

function groupByYear(notes: readonly Note[]): YearGroup[] {
  const groups: YearGroup[] = [];
  let current: YearGroup | null = null;
  for (const note of notes) {
    const year = extractYear(note.date);
    if (!current || current.year !== year) {
      current = { year, notes: [] };
      groups.push(current);
    }
    current.notes.push(note);
  }
  return groups;
}

export interface ChronicleColumnProps {
  notes: readonly Note[];
  /** Optional cluster the chronicle is filtered to; rendered as a
   *  small badge above the list so the visitor sees which slice
   *  they're reading. */
  activeCluster?: string | null;
}

export default function ChronicleColumn({
  notes,
  activeCluster,
}: ChronicleColumnProps) {
  if (notes.length === 0) {
    return (
      <div className="border-t border-white/[0.06] pt-10">
        <p className="text-sm text-tertiary leading-relaxed max-w-md">
          No notes match this cluster yet.{" "}
          <Link
            href="/notes"
            className="text-[#00d2ff]/80 hover:text-[#00d2ff] underline-offset-2 hover:underline"
          >
            Clear the filter →
          </Link>
        </p>
      </div>
    );
  }

  const groups = groupByYear(notes);

  return (
    <div className="border-t border-white/[0.06]">
      {activeCluster ? (
        <div className="flex items-center gap-3 pt-6 pb-2">
          <span className="font-mono uppercase tracking-[0.18em] text-[10px] text-quiet">
            Filter
          </span>
          <span className="font-mono uppercase tracking-[0.18em] text-[10px] text-[#00d2ff]">
            {activeCluster}
          </span>
          <Link
            href="/notes"
            className="ml-auto font-mono uppercase tracking-[0.18em] text-[10px] text-tertiary hover:text-primary transition-colors"
          >
            Clear
          </Link>
        </div>
      ) : null}

      {groups.map((group, gi) => (
        <section
          key={group.year}
          className={`grid grid-cols-[3.5rem_1fr] sm:grid-cols-[5rem_1fr] gap-x-2 sm:gap-x-4 ${
            gi === 0 ? "pt-6" : "pt-10"
          }`}
        >
          {/* Sticky-cluster year label. Sticks to the top of the
              viewport while the visitor scrolls through the year's
              entries — anchors the temporal axis without repeating
              the year on every row. */}
          <p className="sticky top-20 self-start font-mono uppercase tracking-[0.18em] text-[10px] text-quiet pt-6">
            {group.year}
          </p>
          <ul className="divide-y divide-white/[0.05]">
            {group.notes.map((note) => (
              <li key={note.slug}>
                {/* Native <details> = no client JS. Click the
                    summary row to toggle the inline excerpt. The
                    cyan-tick visual (.margin-tick from V6 11.5)
                    sits inline before the title and brightens
                    when open via the [&[open]] arbitrary variant. */}
                <details className="group [&[open]_.chronicle-tick]:!bg-[#00d2ff]/80">
                  <summary className="flex items-baseline gap-4 cursor-pointer list-none py-5 hover:bg-white/[0.015] transition-colors -mx-2 px-2 rounded-sm">
                    <span
                      aria-hidden="true"
                      className="chronicle-tick inline-block w-px h-3 bg-[#00d2ff]/30 mt-2 shrink-0 transition-colors duration-300"
                    />
                    <h3 className="text-xl sm:text-2xl md:text-[1.625rem] font-medium tracking-[-0.01em] leading-tight text-secondary group-hover:text-primary transition-colors">
                      {note.title}
                    </h3>
                    <span className="ml-auto font-mono uppercase tracking-[0.18em] text-[10px] text-quiet whitespace-nowrap shrink-0 pt-1.5">
                      {note.readTime.replace(" read", "")}
                    </span>
                  </summary>
                  <div className="pl-4 pb-6 pt-1 max-w-2xl">
                    <p className="text-secondary text-[14.5px] leading-[1.85] mb-4">
                      {note.excerpt}
                    </p>
                    <Link
                      href={`/notes/${note.slug}`}
                      className="inline-flex items-center gap-1.5 text-[#00d2ff]/80 hover:text-[#00d2ff] font-mono uppercase tracking-[0.18em] text-[10px] transition-colors"
                    >
                      Read note
                      <ArrowRight className="w-3 h-3" aria-hidden="true" />
                    </Link>
                  </div>
                </details>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
