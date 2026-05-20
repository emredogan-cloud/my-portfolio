import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, Clock } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { Reveal } from "@/components/ui/Reveal";
import PageAtmosphere from "@/components/layout/PageAtmosphere";
import NotesTabs from "@/components/notes/NotesTabs";
import { notesData, formatMonthYear } from "@/data/notes";

/* ── Static-generation enablement ─────────────────────────── */

export async function generateStaticParams() {
  return notesData.map((n) => ({ slug: n.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const note = notesData.find((n) => n.slug === slug);
  if (!note) return {};
  return {
    title: `${note.title} — Emre Doğan`,
    description: note.excerpt,
  };
}

/* ── Page ─────────────────────────────────────────────────── */

export default async function NoteDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const note = notesData.find((n) => n.slug === slug);

  if (!note) notFound();

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

        {/* Back link */}
        <Reveal mode="mount" duration={0.5} y={0}>
          <Link
            href="/notes"
            className="inline-flex items-center gap-2 text-tertiary hover:text-primary text-sm transition-colors duration-200 mb-16 group"
          >
            <ArrowRight
              size={14}
              className="rotate-180 transition-transform duration-200 group-hover:-translate-x-0.5"
            />
            All Notes
          </Link>
        </Reveal>

        {/* ── Article header ── */}
        <Reveal mode="mount" duration={0.75} delay={0.1} y={20}>
          <span className="text-[10px] sm:text-xs uppercase tracking-widest text-primary/40">
            Note
          </span>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-medium tracking-[-0.035em] leading-[1.05] text-primary mt-5">
            {note.title}
          </h1>

          {/* Meta row */}
          <div className="flex items-center gap-3 text-[11px] text-tertiary mt-6">
            <time dateTime={note.date}>{formatMonthYear(note.date)}</time>
            <span className="text-faint">·</span>
            <span className="inline-flex items-center gap-1">
              <Clock className="w-3 h-3" aria-hidden="true" />
              {note.readTime}
            </span>
          </div>

          {/* Tags */}
          <div className="flex flex-wrap gap-2 mt-5">
            {note.tags.map((tag) => (
              <span
                key={tag}
                className="px-2.5 py-1 rounded-full border border-white/10 bg-white/[0.03] text-[10px] uppercase tracking-wider text-primary/60"
              >
                {tag}
              </span>
            ))}
          </div>
        </Reveal>

        {/* ── Article body ──
            Sub-PR 2.5: when a note declares `formats.audio` or
            `formats.diagram`, NotesTabs wraps the article with a
            Read / Listen / Diagram tab strip. Notes without
            `formats` render exactly as the V3 layout — NotesTabs
            short-circuits to the read content when only the Read
            tab is available. */}
        <Reveal mode="mount" duration={0.7} delay={0.25} y={16}>
          <div className="mt-14 pt-10 border-t border-white/[0.08]">
            <NotesTabs
              slug={note.slug}
              audio={note.formats?.audio}
              diagram={note.formats?.diagram}
              readContent={
                <article
                  className="
                    prose prose-invert max-w-none
                    prose-headings:font-medium prose-headings:tracking-tight prose-headings:text-primary
                    prose-p:text-primary prose-p:leading-[1.85]
                    prose-strong:text-primary prose-strong:font-semibold
                    prose-em:text-primary
                    prose-li:text-primary prose-li:leading-[1.7] prose-li:my-1
                    prose-ol:my-6 prose-ul:my-6
                    prose-a:text-[#00d2ff] prose-a:no-underline hover:prose-a:underline
                    prose-code:text-[#00d2ff] prose-code:bg-white/[0.04] prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:before:content-none prose-code:after:content-none
                    prose-hr:border-white/[0.08]
                  "
                >
                  <ReactMarkdown>{note.body}</ReactMarkdown>
                </article>
              }
            />
          </div>
        </Reveal>

        {/* ── Footer / next steps ── */}
        <Reveal
          duration={0.7}
          margin="-50px"
          className="mt-20 pt-10 border-t border-white/[0.06]"
        >
          <Link
            href="/notes"
            className="group inline-flex items-center gap-2 text-sm text-tertiary hover:text-primary transition-colors"
          >
            <ArrowRight
              size={14}
              className="rotate-180 transition-transform duration-200 group-hover:-translate-x-0.5"
            />
            Back to all notes
          </Link>
        </Reveal>
      </div>
    </main>
  );
}
