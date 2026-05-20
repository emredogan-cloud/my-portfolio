import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BookOpen, Clock } from "lucide-react";
import { Reveal } from "@/components/ui/Reveal";
import PageAtmosphere from "@/components/layout/PageAtmosphere";
import { notesData, formatMonthYear } from "@/data/notes";

export const metadata: Metadata = {
  title: "Notes — Emre Doğan",
  description:
    "Long-form writing on cloud architecture, AI systems, mobile engineering, and the discipline of self-taught production work.",
};

export default function NotesPage() {
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
            <span className="block text-white/60">Production-grade.</span>
          </h1>
          <p className="text-gray-400 max-w-2xl mt-8 text-base md:text-lg leading-relaxed">
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
                  <div className="flex items-center gap-3 text-[11px] text-gray-500">
                    <time dateTime={note.date}>
                      {formatMonthYear(note.date)}
                    </time>
                    <span className="text-white/15">·</span>
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
                  <p className="text-gray-400 text-sm md:text-base leading-relaxed max-w-2xl">
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
          <p className="text-gray-500 text-sm leading-relaxed max-w-2xl inline-flex items-start gap-2">
            <BookOpen
              className="w-3.5 h-3.5 mt-0.5 text-white/30 flex-shrink-0"
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
