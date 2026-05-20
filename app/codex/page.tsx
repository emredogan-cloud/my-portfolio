import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, BookOpen, ExternalLink } from "lucide-react";
import { Reveal } from "@/components/ui/Reveal";
import PageAtmosphere from "@/components/layout/PageAtmosphere";
import { secondaryButton } from "@/lib/v6/glass";
import { codexBooks } from "@/data/codex";

export const metadata: Metadata = {
  title: "Codex — Emre Doğan",
  description:
    "A handcrafted archive of cinematic digital editions — three self-contained worlds, each shipped as a zero-dependency reader engineered from a single static folder.",
};

/* The codex index is deliberately NOT a card grid. Each book is an
 * editorial folio — a vertical block with sigil, title in Geist
 * tracking-tight, a cover crop pulled in from the live reader, an
 * intelligent synopsis, themes, and a single primary affordance.
 * The page reads top-to-bottom the way an illuminated codex's frontis
 * spread reads: one mark per double-page. */

const ATMOSPHERE_TINTS = [
  // Subtle radial accents per folio. Each is a translucent gold-ish or
  // ash-ish layer that does NOT compete with cyan — they live below the
  // cyan accent layer in z-stack and read as atmospheric breath.
  "rgba(168,132,44,0.10)",  // Mendiran — gold-amber
  "rgba(201,161,74,0.10)",  // Mythologica — illuminated parchment gold
  "rgba(118,84,60,0.10)",   // Solgun — ash-bone
] as const;

export default function CodexIndex() {
  return (
    <main id="main" className="relative min-h-screen bg-black">
      {/* Ambient atmosphere — V6 11.1 typed variant.
          Narrative: large cyan ellipse top-right. The per-folio sigil
          accent lives inside the individual codex/[slug] page (book-
          specific glyph); the hub uses the variant without a sigil. */}
      <PageAtmosphere
        variant="narrative"
        legacy={{
          primary: {
            color: "rgba(0,210,255,0.06)",
            position: "top-right",
            size: "lg",
          },
          secondary: {
            color: "rgba(168,132,44,0.07)",
            position: "bottom-left",
            size: "md",
          },
        }}
      />

      <div className="relative z-10 max-w-5xl mx-auto px-6 pt-36 pb-32">

        {/* ───────── HERO ───────── */}
        <Reveal mode="mount" duration={0.8} className="mb-24">
          <span className="text-[10px] sm:text-xs uppercase tracking-widest text-primary/40">
            Codex
          </span>
          <h1 className="text-5xl md:text-7xl font-medium tracking-[-0.04em] leading-[0.95] text-primary mt-5">
            <span className="block">A handcrafted</span>
            <span className="block text-tertiary">archive of worlds.</span>
          </h1>
          <p className="text-secondary max-w-2xl mt-8 text-base md:text-lg leading-relaxed">
            Three self-contained digital editions, each engineered as a
            zero-dependency single-page reader and inhabited as a fully
            built world. Custom paginators, illuminated atlases, ambient
            audio synthesis, browser-native PDF export — and inside each
            engine, a finished narrative universe with its own houses,
            calendars, oaths, and grief.
          </p>
        </Reveal>

        {/* ───────── FOLIOS ───────── */}
        <div className="space-y-24 md:space-y-32">
          {codexBooks.map((book, i) => {
            const tint = ATMOSPHERE_TINTS[i] ?? ATMOSPHERE_TINTS[0];
            return (
              <Reveal
                key={book.id}
                duration={0.7}
                delay={i * 0.04}
                y={18}
                margin="-80px"
              >
                <article className="relative">
                  {/* Per-folio atmospheric tint — sits behind the cover
                      and feathers outward; never crosses the cyan layer. */}
                  <div
                    className="absolute -inset-x-8 -inset-y-12 -z-10 pointer-events-none"
                    style={{
                      background: `radial-gradient(ellipse 60% 50% at 30% 50%, ${tint} 0%, transparent 70%)`,
                    }}
                    aria-hidden="true"
                  />

                  <div className="grid md:grid-cols-12 gap-8 md:gap-12 items-start">
                    {/* ── LEFT: cover + sigil ── */}
                    <div className="md:col-span-5">
                      <Link
                        href={`/codex/${book.slug}`}
                        className="group block relative overflow-hidden rounded-xl border border-white/[0.06] bg-white/[0.015]"
                        aria-label={`Open ${book.title}`}
                      >
                        <Image
                          src={book.cover}
                          alt={`${book.title} — cover spread`}
                          width={1200}
                          height={760}
                          className="w-full h-auto object-cover transition-transform duration-[1200ms] ease-out group-hover:scale-[1.03]"
                          sizes="(max-width: 768px) 100vw, 40vw"
                          priority={i === 0}
                        />
                        {/* Bottom cinematic gradient so the sigil-pill sits
                            on a quiet wash, not on full image noise. */}
                        <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/85 via-black/35 to-transparent pointer-events-none" />
                        {/* In-image sigil pill */}
                        <div className="absolute left-3 bottom-3 inline-flex items-center gap-2 rounded-full border border-white/15 bg-black/55 px-2.5 py-1 backdrop-blur-sm">
                          <span
                            className="text-[#00d2ff] text-base leading-none"
                            aria-hidden="true"
                          >
                            {book.sigil}
                          </span>
                          <span className="font-mono uppercase tracking-[0.18em] text-[10px] text-primary">
                            {book.inWorldYear}
                          </span>
                        </div>
                      </Link>
                    </div>

                    {/* ── RIGHT: editorial copy ── */}
                    <div className="md:col-span-7 flex flex-col gap-5">
                      {/* Eyebrow */}
                      <div className="flex items-center gap-3 text-[11px] uppercase tracking-[0.22em] text-quiet">
                        <span>{`Folio ${String(i + 1).padStart(2, "0")}`}</span>
                        <span className="text-faint">·</span>
                        <span>{book.language}</span>
                        <span className="text-faint">·</span>
                        <span>{`Shipped ${book.shippedYear}`}</span>
                      </div>

                      <h2 className="text-3xl md:text-4xl lg:text-5xl font-medium tracking-[-0.03em] leading-[0.98] text-primary">
                        {book.title}
                      </h2>

                      <p className="text-[13px] sm:text-sm italic text-tertiary leading-relaxed max-w-xl">
                        {book.subtitle}
                      </p>

                      <p className="text-secondary text-[15px] leading-[1.8] max-w-2xl">
                        {book.tagline}
                      </p>

                      {/* Atmospheres — the book's own theme names rendered
                          as quiet mono chips. The mood word in tertiary
                          gives a one-syllable handhold for the reader. */}
                      <div className="flex flex-wrap gap-2 pt-1">
                        {book.atmospheres.map((atm) => (
                          <span
                            key={atm.name}
                            className="inline-flex items-baseline gap-1.5 px-2.5 py-1 rounded-full border border-white/[0.08] bg-white/[0.025] font-mono uppercase tracking-[0.18em] text-[10px]"
                          >
                            <span className="text-[#00d2ff]/90">{atm.name}</span>
                            <span className="text-tertiary">·</span>
                            <span className="text-tertiary normal-case tracking-normal italic">
                              {atm.mood}
                            </span>
                          </span>
                        ))}
                      </div>

                      {/* Affordances */}
                      <div className="flex flex-wrap items-center gap-3 pt-3">
                        <Link
                          href={`/codex/${book.slug}`}
                          className="group inline-flex items-center gap-2 rounded-full bg-white text-black font-medium text-sm px-5 py-2.5 transition-all hover:bg-white/90"
                        >
                          Enter the codex
                          <ArrowRight className="w-3.5 h-3.5 transition-transform duration-200 group-hover:translate-x-0.5" />
                        </Link>
                        <a
                          href={book.deployUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={`inline-flex items-center gap-2 rounded-full px-4 py-2 ${secondaryButton()} text-xs font-medium text-primary hover:text-primary transition-colors`}
                          aria-label={`Read ${book.title} on its live reader (opens in new tab)`}
                        >
                          <ExternalLink className="w-3 h-3" aria-hidden="true" />
                          Live reader
                        </a>
                      </div>
                    </div>
                  </div>
                </article>
              </Reveal>
            );
          })}
        </div>

        {/* ───────── COLOPHON ───────── */}
        <Reveal
          duration={0.7}
          margin="-50px"
          className="mt-24 pt-10 border-t border-white/[0.06]"
        >
          <p className="text-tertiary text-sm leading-relaxed max-w-2xl inline-flex items-start gap-2">
            <BookOpen
              className="w-3.5 h-3.5 mt-0.5 text-quiet flex-shrink-0"
              aria-hidden="true"
            />
            <span>
              Each codex is a static folder — no framework, no build step,
              no backend. The engines are mine and are themselves part of
              the work: paginators, atlases, ambient drones, print
              compositors. The worlds inside them are also mine.
            </span>
          </p>
        </Reveal>
      </div>
    </main>
  );
}
