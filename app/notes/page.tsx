import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BookOpen, Clock } from "lucide-react";
import { Reveal } from "@/components/ui/Reveal";
import PageAtmosphere from "@/components/layout/PageAtmosphere";
import {
  notesData,
  formatMonthYear,
  type Note,
  type NoteCluster,
} from "@/data/notes";
import ChronicleColumn from "./_components/ChronicleColumn";
import NoteAtlas from "./_components/NoteAtlas";

export const metadata: Metadata = {
  title: "Notes — Emre Doğan",
  description:
    "Long-form writing on cloud architecture, AI systems, mobile engineering, and the discipline of self-taught production work.",
};

const CLUSTER_VALUES: readonly NoteCluster[] = [
  "cloud",
  "ai",
  "mobile",
  "discipline",
] as const;

function isCluster(value: string | undefined): value is NoteCluster {
  return typeof value === "string" && (CLUSTER_VALUES as readonly string[]).includes(value);
}

interface NotesPageProps {
  /* Next.js 16 forwards `searchParams` as a Promise — see
     docs/upgrade. We read it server-side in the page render and
     ignore the promise wrapper if no filter is set. */
  searchParams?: Promise<{ cluster?: string }>;
}

export default async function NotesPage({ searchParams }: NotesPageProps) {
  if (process.env.NEXT_PUBLIC_V6_NOTES_EDITORIAL === "1") {
    const resolved = (await searchParams) ?? {};
    const activeCluster = isCluster(resolved.cluster) ? resolved.cluster : null;
    return <V6NotesPage activeCluster={activeCluster} />;
  }
  return <LegacyNotesPage />;
}

/* ── Legacy /notes hub (V5 baseline) ──────────────────────────── */

function LegacyNotesPage() {
  return (
    <main id="main" className="relative min-h-screen bg-black">
      {/* Ambient atmosphere — V6 11.1 typed variant.
          Editorial: two staggered black-on-black pools + off-canvas cyan tick. */}
      <PageAtmosphere
        variant="editorial"
        legacy={{
          primary: {
            color: "rgba(0,210,255,0.06)",
            position: "top-right",
            size: "lg",
          },
          secondary: {
            color: "rgba(147,51,234,0.06)",
            position: "bottom-left",
            size: "md",
          },
        }}
      />

      <div className="relative z-10 max-w-3xl mx-auto px-6 pt-36 pb-32">

        {/* ───────── HERO ───────── */}
        <Reveal mode="mount" duration={0.8} className="mb-20">
          <span className="text-[10px] sm:text-xs uppercase tracking-widest text-primary/40">
            Notes
          </span>
          <h1 className="text-5xl md:text-7xl font-medium tracking-[-0.04em] leading-[0.95] text-primary mt-5">
            <span className="block">Long-form.</span>
            <span className="block text-tertiary">Production-grade.</span>
          </h1>
          <p className="text-secondary max-w-2xl mt-8 text-base md:text-lg leading-relaxed">
            Working notes on cloud architecture, AI systems, and what it
            actually takes to ship production infrastructure as a self-taught
            engineer at 19. Each entry is a single deep idea — nothing padded,
            nothing speculative.
          </p>
        </Reveal>

        {/* ───────── ARTICLE LIST ───────── */}
        <div className="divide-y divide-white/[0.06] border-y border-white/[0.06]">
          {notesData.map((note, i) => (
            <Reveal
              key={note.slug}
              duration={0.6}
              delay={i * 0.08}
              y={14}
              margin="-40px"
            >
              <Link
                href={`/notes/${note.slug}`}
                className="group block py-10 -mx-4 px-4 rounded-lg hover:bg-white/[0.02] transition-colors duration-300"
              >
                <article className="grid gap-4">
                  {/* Meta row */}
                  <div className="flex items-center gap-3 text-[11px] text-tertiary">
                    <time dateTime={note.date}>
                      {formatMonthYear(note.date)}
                    </time>
                    <span className="text-faint">·</span>
                    <span className="inline-flex items-center gap-1">
                      <Clock className="w-3 h-3" aria-hidden="true" />
                      {note.readTime}
                    </span>
                  </div>

                  {/* Title with arrow affordance */}
                  <div className="flex items-start justify-between gap-4">
                    <h2 className="text-2xl md:text-3xl font-medium tracking-[-0.02em] text-primary leading-tight">
                      {note.title}
                    </h2>
                    <ArrowRight
                      className="w-4 h-4 text-quiet group-hover:text-primary transition-all duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 flex-shrink-0 mt-2"
                      style={{ transform: "rotate(-45deg)" }}
                    />
                  </div>

                  {/* Excerpt */}
                  <p className="text-secondary text-sm md:text-base leading-relaxed max-w-2xl">
                    {note.excerpt}
                  </p>

                  {/* Tags */}
                  <div className="flex flex-wrap gap-2 pt-1">
                    {note.tags.map((tag) => (
                      <span
                        key={tag}
                        className="px-2.5 py-1 rounded-full border border-white/10 bg-white/[0.03] text-[10px] uppercase tracking-wider text-primary/60"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </article>
              </Link>
            </Reveal>
          ))}
        </div>

        {/* ───────── FOOTER NOTE ───────── */}
        <Reveal
          duration={0.7}
          margin="-50px"
          className="mt-16 pt-10 border-t border-white/[0.06]"
        >
          <p className="text-tertiary text-sm leading-relaxed max-w-2xl inline-flex items-start gap-2">
            <BookOpen
              className="w-3.5 h-3.5 mt-0.5 text-quiet flex-shrink-0"
              aria-hidden="true"
            />
            <span>
              New essays drop when the work behind them is done — not before.
              Each note maps to a real production system or a real lived
              discipline.
            </span>
          </p>
        </Reveal>
      </div>
    </main>
  );
}

/* ── V6 /notes hub (Sub-PR 13.1 editorial composition) ────────── */

/**
 * Extracts the first sentence from a note's body. The body is
 * Markdown; we split on the first sentence terminator and trim.
 * Falls back to the excerpt if the first sentence is too long
 * (> 200 chars) — the lead block reads as a magazine pullout,
 * which favours short opening claims over long opening clauses.
 */
function leadSentence(note: Note): string {
  const stripped = note.body
    // Remove markdown bold/italic markers for the lead pullout.
    .replace(/\*\*/g, "")
    .replace(/\*/g, "")
    .trim();
  const match = stripped.match(/[^.!?]+[.!?]/);
  const first = match ? match[0].trim() : stripped;
  if (first.length === 0 || first.length > 200) {
    return note.excerpt;
  }
  return first;
}

function countByCluster(notes: readonly Note[]): Record<NoteCluster, number> {
  const counts: Record<NoteCluster, number> = {
    cloud: 0,
    ai: 0,
    mobile: 0,
    discipline: 0,
  };
  for (const note of notes) {
    if (note.cluster) counts[note.cluster] += 1;
  }
  return counts;
}

function V6NotesPage({ activeCluster }: { activeCluster: NoteCluster | null }) {
  const allNotes = notesData;
  const counts = countByCluster(allNotes);

  /* The lead block always shows the most-recent note across the
     full archive — it's the page's editorial anchor, not a
     filtered preview. The chronicle below is what filters. */
  const [leadNote, ...rest] = allNotes;

  const chronicleNotes = activeCluster
    ? rest.filter((n) => n.cluster === activeCluster)
    : rest;

  return (
    <main id="main" className="relative min-h-screen bg-black">
      <PageAtmosphere
        variant="editorial"
        legacy={{
          primary: {
            color: "rgba(0,210,255,0.06)",
            position: "top-right",
            size: "lg",
          },
          secondary: {
            color: "rgba(147,51,234,0.06)",
            position: "bottom-left",
            size: "md",
          },
        }}
      />

      <div className="relative z-10 max-w-6xl mx-auto px-6 pt-32 pb-32">

        {/* Eyebrow — small page label. The lead block below carries
            the visual weight; this row keeps the page identifiable
            without competing with the pullout. */}
        <p className="font-mono uppercase tracking-[0.22em] text-[10px] text-quiet mb-6">
          Notes · The Chronicle
        </p>

        {/* ───────── LEAD BLOCK ─────────
            Most-recent note's first sentence rendered at display
            size — a magazine pullout that doubles as a tap target
            into the note. Right-aligned mono "Latest · Nmin" beat
            anchors the temporal axis. */}
        {leadNote ? (
          <Reveal mode="mount" duration={0.8} className="mb-24">
            <Link
              href={`/notes/${leadNote.slug}`}
              className="group block -mx-4 px-4 py-6 rounded-sm hover:bg-white/[0.015] transition-colors"
            >
              <div className="flex flex-col gap-6">
                <p className="text-3xl md:text-5xl lg:text-[3.25rem] font-medium tracking-[-0.025em] leading-[1.1] text-primary max-w-4xl">
                  <span className="margin-tick inline-block mr-3 align-baseline" aria-hidden="true" />
                  {leadSentence(leadNote)}
                </p>
                <div className="flex items-center gap-3 text-quiet">
                  <span className="font-mono uppercase tracking-[0.18em] text-[10px] text-[#00d2ff]/80">
                    Latest
                  </span>
                  <span aria-hidden="true" className="text-faint">·</span>
                  <span className="font-mono uppercase tracking-[0.18em] text-[10px]">
                    {leadNote.readTime.replace(" read", "")}
                  </span>
                  <span aria-hidden="true" className="text-faint">·</span>
                  <time
                    dateTime={leadNote.date}
                    className="font-mono uppercase tracking-[0.18em] text-[10px]"
                  >
                    {formatMonthYear(leadNote.date)}
                  </time>
                  <span className="ml-auto inline-flex items-center gap-1.5 font-mono uppercase tracking-[0.18em] text-[10px] text-tertiary group-hover:text-primary transition-colors">
                    Read note
                    <ArrowRight className="w-3 h-3" aria-hidden="true" />
                  </span>
                </div>
              </div>
            </Link>
          </Reveal>
        ) : null}

        {/* ───────── CHRONICLE + ATLAS GRID ─────────
            lg+: atlas right of chronicle (8/4 col split).
            < lg: atlas (pill row) above chronicle. */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_240px] gap-10 lg:gap-16">
          <div className="order-2 lg:order-1 min-w-0">
            <ChronicleColumn
              notes={chronicleNotes}
              activeCluster={activeCluster}
            />
          </div>
          <div className="order-1 lg:order-2">
            <NoteAtlas counts={counts} activeCluster={activeCluster} />
          </div>
        </div>

        {/* ───────── FOOTER NOTE ─────────
            Editorial closer — same content as legacy, repositioned
            below the chronicle + atlas grid. */}
        <Reveal
          duration={0.7}
          margin="-50px"
          className="mt-20 pt-10 border-t border-white/[0.06] max-w-2xl"
        >
          <p className="text-tertiary text-sm leading-relaxed inline-flex items-start gap-2">
            <BookOpen
              className="w-3.5 h-3.5 mt-0.5 text-quiet flex-shrink-0"
              aria-hidden="true"
            />
            <span>
              New essays drop when the work behind them is done — not before.
              Each note maps to a real production system or a real lived
              discipline.
            </span>
          </p>
        </Reveal>
      </div>
    </main>
  );
}
