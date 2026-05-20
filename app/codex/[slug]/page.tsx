import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { ArrowRight, ExternalLink } from "lucide-react";
import { Reveal } from "@/components/ui/Reveal";
import PageAtmosphere from "@/components/layout/PageAtmosphere";
import { codexBooks, getCodexBookBySlug } from "@/data/codex";
import CodexTopology from "@/components/codex/CodexTopology";

/* ── Static-generation ───────────────────────────────────────── */

export async function generateStaticParams() {
  return codexBooks.map((b) => ({ slug: b.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const book = getCodexBookBySlug(slug);
  if (!book) return {};
  return {
    title: `${book.title} — Codex — Emre Doğan`,
    description: book.tagline,
  };
}

/* ── Page ────────────────────────────────────────────────────── */

export default async function CodexDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const book = getCodexBookBySlug(slug);
  if (!book) notFound();

  const paragraphs = book.synopsis.split("\n\n").filter(Boolean);

  return (
    <main id="main" className="relative min-h-screen bg-black">
      {/* Ambient atmosphere — V6 11.1 typed variant.
          Narrative: large cyan ellipse + book-specific sigil glyph at 4 %
          opacity in the corner. When the V6 flag is off, the legacy cyan
          + book-tint pair is preserved so each folio's atmosphere reads
          identically to V5. */}
      <PageAtmosphere
        variant="narrative"
        sigil={book.sigil}
        legacy={{
          primary: {
            color: "rgba(0,210,255,0.08)",
            position: "top-right",
            size: "lg",
          },
          secondary: {
            color: book.atmosphereTint,
            position: "bottom-left",
            size: "md",
          },
        }}
      />

      <div className="relative z-10 max-w-5xl mx-auto px-6 pt-36 pb-32">

        {/* ── Back link ── */}
        <Reveal mode="mount" duration={0.5} y={0}>
          <Link
            href="/codex"
            className="inline-flex items-center gap-2 text-tertiary hover:text-primary text-sm transition-colors duration-200 mb-16 group"
          >
            <ArrowRight
              size={14}
              className="rotate-180 transition-transform duration-200 group-hover:-translate-x-0.5"
            />
            All folios
          </Link>
        </Reveal>

        {/* ───────── HERO ───────── */}
        <Reveal mode="mount" duration={0.75} delay={0.1} y={24}>
          <div className="grid lg:grid-cols-12 gap-10 lg:gap-14 items-end">
            {/* LEFT — sigil + title + epigraph */}
            <div className="lg:col-span-7 flex flex-col gap-6">
              {/* Sigil ribbon — single Unicode glyph + in-world year +
                  category. Mirrors the "Project · Live" pill on the
                  projects/[slug] hero, transposed to a narrative key. */}
              <div className="flex items-center gap-3">
                <span
                  className="text-[#00d2ff] text-2xl leading-none"
                  aria-hidden="true"
                >
                  {book.sigil}
                </span>
                <span className="text-sm font-medium text-[#00d2ff] tracking-widest uppercase">
                  Codex
                </span>
                <span className="text-white/20">·</span>
                <span className="font-mono uppercase tracking-[0.18em] text-[10px] text-white/60">
                  {book.inWorldYear}
                </span>
                <span className="text-white/20">·</span>
                <span className="font-mono uppercase tracking-[0.18em] text-[10px] text-white/60">
                  {book.language}
                </span>
              </div>

              {/* Title — Geist medium tracking-[-0.04em] per the
                  cinematic identity rules. Larger than projects so it
                  reads as the chapter that it is. */}
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-medium tracking-[-0.04em] leading-[0.95] text-primary">
                {book.title}
              </h1>

              <p className="text-secondary text-base md:text-lg leading-relaxed max-w-2xl italic">
                {book.subtitle}
              </p>

              {/* Epigraph — left rule, italic, small. The book's own
                  voice speaking for itself. */}
              <blockquote className="border-l border-[#00d2ff]/40 pl-4 my-2 max-w-2xl">
                <p className="text-tertiary italic text-[15px] leading-relaxed">
                  {book.epigraph}
                </p>
              </blockquote>

              {/* CTA */}
              <div className="flex flex-wrap items-center gap-3 pt-2">
                <a
                  href={book.deployUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-full bg-white text-black font-semibold text-sm px-6 py-2.5 transition-colors hover:bg-white/90"
                  aria-label={`Open ${book.title} live reader in a new tab`}
                >
                  <ExternalLink size={14} />
                  Open the live reader
                </a>
                {book.githubUrl && (
                  <a
                    href={book.githubUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="glass-panel rounded-full inline-flex items-center gap-2 px-6 py-2.5 text-sm font-medium text-white/75 hover:text-white transition-colors duration-200"
                  >
                    Source
                  </a>
                )}
              </div>
            </div>

            {/* RIGHT — cover */}
            <div className="lg:col-span-5">
              <div className="relative rounded-xl overflow-hidden border border-white/[0.08] bg-white/[0.015]">
                <Image
                  src={book.cover}
                  alt={`${book.title} — cover spread`}
                  width={1200}
                  height={760}
                  className="w-full h-auto object-cover"
                  sizes="(max-width: 1024px) 100vw, 40vw"
                  priority
                />
                <div className="absolute inset-0 pointer-events-none bg-gradient-to-tr from-black/35 via-transparent to-transparent" />
              </div>
            </div>
          </div>
        </Reveal>

        {/* ── Atmospheres + themes ── */}
        <Reveal
          mode="mount"
          duration={0.65}
          delay={0.25}
          className="mt-14 pt-10 border-t border-white/[0.08]"
        >
          <p className="text-xs font-medium text-quiet tracking-widest uppercase mb-5">
            Atmospheres
          </p>
          <div className="flex flex-wrap gap-2 mb-8">
            {book.atmospheres.map((atm) => (
              <span
                key={atm.name}
                className="inline-flex items-baseline gap-1.5 px-2.5 py-1 rounded-full border border-white/[0.10] bg-white/[0.03] font-mono uppercase tracking-[0.18em] text-[10px]"
              >
                <span className="text-[#00d2ff]/90">{atm.name}</span>
                <span className="text-white/30">·</span>
                <span className="text-white/65 normal-case tracking-normal italic">
                  {atm.mood}
                </span>
              </span>
            ))}
          </div>

          <p className="text-xs font-medium text-quiet tracking-widest uppercase mb-4">
            Themes
          </p>
          <div className="flex flex-wrap gap-2">
            {book.themes.map((theme) => (
              <span
                key={theme}
                className="px-3 py-1 rounded-full border border-white/10 bg-white/5 text-xs text-white/70"
              >
                {theme}
              </span>
            ))}
          </div>
        </Reveal>

        {/* ── Synopsis ── */}
        <Reveal
          mode="mount"
          duration={0.65}
          delay={0.35}
          className="mt-14 pt-10 border-t border-white/[0.08] space-y-6"
        >
          <p className="text-xs font-medium text-quiet tracking-widest uppercase mb-6">
            Synopsis
          </p>
          {paragraphs.map((para, i) => (
            <p
              key={i}
              className="text-white/75 text-base leading-[1.85] max-w-2xl"
            >
              {para}
            </p>
          ))}
        </Reveal>

        {/* ── Narrative Topology ──
            Same engine family as the CWH AWS topology and the
            homepage hero constellation. Lazy-loaded — three.js never
            ships on routes that don't use it. */}
        <Reveal
          mode="view"
          duration={0.7}
          margin="-100px"
          className="mt-16 pt-10 border-t border-white/[0.08]"
        >
          <div className="flex items-center justify-between gap-3 mb-6 flex-wrap">
            <div>
              <p className="text-xs font-medium text-quiet tracking-widest uppercase">
                Narrative Constellation
              </p>
              <p className="text-tertiary text-[13px] mt-1.5 italic">
                {book.topology.centerLabel} — the axis everything else
                orbits.
              </p>
            </div>
            <span className="text-[10px] uppercase tracking-[0.18em] text-white/30">
              Drag to rotate · hover for context
            </span>
          </div>

          {/* Screen-reader fallback: same node + blurb data the visual
              presents, rendered as a flat list invisible to sighted
              visitors. Mirrors the AWSTopology accessibility pattern. */}
          <ul className="sr-only">
            {book.topology.nodes.map((n) => (
              <li key={n.id}>
                <strong>{n.label}.</strong>
                {n.blurb ? ` ${n.blurb}` : null}
              </li>
            ))}
          </ul>

          <div aria-hidden="true">
            <CodexTopology
              nodes={book.topology.nodes}
              edges={book.topology.edges}
            />
          </div>
        </Reveal>

        {/* ── Timeline ── */}
        <Reveal
          mode="view"
          duration={0.65}
          margin="-80px"
          className="mt-16 pt-10 border-t border-white/[0.08]"
        >
          <p className="text-xs font-medium text-quiet tracking-widest uppercase mb-8">
            Chronicle
          </p>
          <ol className="relative space-y-7 pl-6 border-l border-white/[0.08]">
            {book.timeline.map((t) => (
              <li key={t.label} className="relative">
                <span
                  className="absolute -left-[29px] top-2 w-2.5 h-2.5 rounded-full bg-[#00d2ff]/80 ring-2 ring-black"
                  aria-hidden="true"
                />
                <div className="flex flex-wrap items-baseline gap-3">
                  <span className="font-mono uppercase tracking-[0.18em] text-[10px] text-[#00d2ff]">
                    {t.era}
                  </span>
                  <span className="text-white/15">·</span>
                  <span className="text-primary text-sm font-medium">
                    {t.label}
                  </span>
                </div>
                <p className="mt-1.5 text-tertiary text-[14px] leading-relaxed max-w-2xl">
                  {t.blurb}
                </p>
              </li>
            ))}
          </ol>
        </Reveal>

        {/* ── Factions / Civilisations / Categories ── */}
        <Reveal
          mode="view"
          duration={0.65}
          margin="-80px"
          className="mt-16 pt-10 border-t border-white/[0.08]"
        >
          <p className="text-xs font-medium text-quiet tracking-widest uppercase mb-8">
            {book.factionsLabel}
          </p>
          <div className="grid sm:grid-cols-2 gap-4">
            {book.factions.map((f) => (
              <div
                key={f.id}
                className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 hover:border-white/[0.10] transition-colors duration-300"
              >
                <div className="flex items-center gap-2 mb-2">
                  {f.sigil && (
                    <span
                      className="text-[#00d2ff] text-base leading-none"
                      aria-hidden="true"
                    >
                      {f.sigil}
                    </span>
                  )}
                  <h3 className="text-primary font-medium text-[15px]">
                    {f.name}
                  </h3>
                </div>
                <p className="text-tertiary text-[13px] leading-relaxed">
                  {f.oneLine}
                </p>
              </div>
            ))}
          </div>
        </Reveal>

        {/* ── Characters ── */}
        <Reveal
          mode="view"
          duration={0.65}
          margin="-80px"
          className="mt-16 pt-10 border-t border-white/[0.08]"
        >
          <p className="text-xs font-medium text-quiet tracking-widest uppercase mb-8">
            {book.charactersLabel}
          </p>
          <div className="grid sm:grid-cols-2 gap-x-10 gap-y-6">
            {book.characters.map((c) => (
              <div key={c.id} className="space-y-1.5">
                <h3 className="text-primary text-base font-medium leading-snug">
                  {c.name}
                </h3>
                <p className="text-[#00d2ff]/80 text-[11px] uppercase tracking-[0.18em] font-mono">
                  {c.role}
                </p>
                <p className="text-tertiary text-[13.5px] leading-relaxed">
                  {c.blurb}
                </p>
              </div>
            ))}
          </div>
        </Reveal>

        {/* ── Arcs ── */}
        <Reveal
          mode="view"
          duration={0.65}
          margin="-80px"
          className="mt-16 pt-10 border-t border-white/[0.08]"
        >
          <p className="text-xs font-medium text-quiet tracking-widest uppercase mb-8">
            {book.arcsLabel}
          </p>
          <div className="space-y-8">
            {book.arcs.map((arc) => (
              <div key={arc.id}>
                <h3 className="text-primary text-lg font-medium tracking-[-0.01em] mb-3">
                  {arc.name}
                </h3>
                <ul className="space-y-2">
                  {arc.beats.map((beat, i) => (
                    <li
                      key={i}
                      className="text-tertiary text-[14px] leading-relaxed pl-4 relative max-w-2xl"
                    >
                      <span
                        className="absolute left-0 top-[0.55em] w-1.5 h-px bg-[#00d2ff]/40"
                        aria-hidden="true"
                      />
                      {beat}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </Reveal>

        {/* ── Engineering note ──
            Reminds the reader: this is also a software artifact.
            Sits at the bottom on purpose — the lore comes first. */}
        <Reveal
          mode="view"
          duration={0.65}
          margin="-80px"
          className="mt-16 pt-10 border-t border-white/[0.08]"
        >
          <p className="text-xs font-medium text-quiet tracking-widest uppercase mb-4">
            Engine
          </p>
          <p className="text-secondary text-[14.5px] leading-[1.8] max-w-2xl">
            {book.engineeringNote}
          </p>
        </Reveal>

        {/* ── Closing CTA ── */}
        <Reveal
          mode="view"
          duration={0.65}
          margin="-80px"
          className="mt-16 pt-10 border-t border-white/[0.08]"
        >
          <div className="flex flex-wrap items-center justify-between gap-4">
            <p className="text-tertiary text-[14px] leading-relaxed max-w-xl italic">
              The codex above is a description. The reader is a place.
            </p>
            <a
              href={book.deployUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="group inline-flex items-center gap-2 rounded-full bg-white text-black font-semibold text-sm px-6 py-2.5 transition-colors hover:bg-white/90"
            >
              Enter {book.title}
              <ArrowRight className="w-3.5 h-3.5 transition-transform duration-200 group-hover:translate-x-0.5" />
            </a>
          </div>
        </Reveal>
      </div>
    </main>
  );
}
