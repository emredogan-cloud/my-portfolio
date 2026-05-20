import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { Reveal } from "@/components/ui/Reveal";
import PageAtmosphere from "@/components/layout/PageAtmosphere";
import { pulseEntries } from "@/data/pulse";

export const metadata: Metadata = {
  title: "Pulse — Emre Doğan",
  description:
    "On the hours that aren't code. Training, the motorcycle, the long-arc reading, the handcrafted codex — the operating-adjacent disciplines that keep the work calm.",
};

/* ──────────────────────────────────────────────────────────────
 *  /pulse — V6 Sub-PR 13.5
 *
 *  The audit § 4.2 identified "Outside The Terminal" as
 *  emotionally mis-positioned on /about — a lifestyle block
 *  interrupting engineering pacing. V6 § Sub-PR 13.5 moves it
 *  here as a dedicated route, operating-adjacent: the four
 *  disciplines (training, motorcycle, reading, codex) live on
 *  their own quiet surface.
 *
 *  The page renders with the `narrative` atmosphere variant per
 *  spec validation. Server Component, no client JS, no new
 *  dependencies.
 *
 *  Flag-gated: when `NEXT_PUBLIC_V6_PULSE_EXTRACTION` is unset,
 *  `notFound()` triggers Next.js's 404 surface. Per the spec
 *  rollback contract ("Flag off → block returns to /about;
 *  /pulse 404"), this guarantees that until the operator flips
 *  the flag on, no orphaned route lingers.
 *
 *  Spec ref: PORTFOLYO_V6_UI_EXECUTION_SYSTEM.md § Sub-PR 13.5.
 *  Audit ref: PORTFOLYO_V6_UI_AUDIT.md § 4.2.
 * ────────────────────────────────────────────────────────────── */

export default function PulsePage() {
  if (process.env.NEXT_PUBLIC_V6_PULSE_EXTRACTION !== "1") {
    notFound();
  }

  return (
    <main id="main" className="relative min-h-screen bg-black">
      {/* Narrative atmosphere — large cyan ellipse top-right. No
          sigil glyph (this is a quiet operator-adjacent surface,
          not a codex book). Legacy fallback preserves the
          editorial-family colours when the V6 atmosphere flag
          is off. */}
      <PageAtmosphere
        variant="narrative"
        legacy={{
          primary: {
            color: "rgba(0,210,255,0.06)",
            position: "top-right",
            size: "lg",
          },
          secondary: {
            color: "rgba(168,132,44,0.05)",
            position: "bottom-left",
            size: "md",
          },
        }}
      />

      <div className="relative z-10 max-w-3xl mx-auto px-6 pt-36 pb-32">

        {/* ───────── HERO ───────── */}
        <Reveal mode="mount" duration={0.8} className="mb-20">
          <span className="text-[10px] sm:text-xs uppercase tracking-widest text-primary/40">
            Pulse
          </span>
          <h1 className="text-5xl md:text-7xl font-medium tracking-[-0.04em] leading-[0.95] text-primary mt-5">
            <span className="block">On the hours</span>
            <span className="block text-tertiary">that aren&apos;t code.</span>
          </h1>
          <p className="text-secondary max-w-2xl mt-8 text-base md:text-lg leading-relaxed">
            Four operating-adjacent disciplines that keep the work
            calm. None of them are software, all of them feed the
            same posture toward time, attention, and consistency
            that the engineering depends on.
          </p>
        </Reveal>

        {/* ───────── ENTRIES ─────────
            Single-column list of four entries — short, observed,
            specific. Each entry that carries an `href` becomes a
            quiet link to the surface it leans on (the codex
            currently). Same composition the legacy /about page's
            "Outside The Terminal" section used, lifted into a
            dedicated route. */}
        <section className="space-y-12">
          {pulseEntries.map((entry, i) => {
            const inner = (
              <article className="relative pl-5 border-l border-[#00d2ff]/[0.18] group">
                <div className="flex items-baseline justify-between gap-3 mb-3">
                  <span className="font-mono uppercase tracking-[0.20em] text-[10px] text-[#00d2ff]/85">
                    {entry.eyebrow}
                  </span>
                  {entry.href ? (
                    <ArrowRight
                      className="w-3.5 h-3.5 text-quiet group-hover:text-primary transition-all duration-300 group-hover:translate-x-0.5 flex-shrink-0"
                      style={{ transform: "rotate(-45deg)" }}
                      aria-hidden="true"
                    />
                  ) : null}
                </div>
                <p className="text-secondary text-[15.5px] leading-[1.85] max-w-2xl">
                  {entry.body}
                </p>
              </article>
            );

            return (
              <Reveal
                key={entry.eyebrow}
                duration={0.6}
                delay={i * 0.08}
                y={14}
                margin="-60px"
              >
                {entry.href ? (
                  <Link
                    href={entry.href}
                    className="block transition-colors duration-300"
                    aria-label={`${entry.eyebrow} — open ${entry.href}`}
                  >
                    {inner}
                  </Link>
                ) : (
                  inner
                )}
              </Reveal>
            );
          })}
        </section>

        {/* ───────── BACK TO ABOUT ─────────
            Quiet closer — a single mono line that loops back to
            /about. The pulse is a side-route, not a destination
            in itself; the visitor returns to the main operating
            page. */}
        <Reveal
          duration={0.7}
          margin="-40px"
          className="mt-24 pt-10 border-t border-white/[0.06]"
        >
          <Link
            href="/about"
            className="inline-flex items-center gap-2 font-mono uppercase tracking-[0.20em] text-[10px] text-tertiary hover:text-primary transition-colors duration-300 group"
          >
            <ArrowRight
              className="w-3 h-3 rotate-180 transition-transform duration-300 group-hover:-translate-x-0.5"
              aria-hidden="true"
            />
            Back to about
          </Link>
        </Reveal>
      </div>
    </main>
  );
}
