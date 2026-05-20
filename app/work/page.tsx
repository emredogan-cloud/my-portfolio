import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { Reveal } from "@/components/ui/Reveal";
import PageAtmosphere from "@/components/layout/PageAtmosphere";
import Pill from "@/components/ui/Pill";
import {
  WORK_ENTRIES,
  STATE_PILL,
  STATE_LABEL,
} from "./_data/work-entries";
import CwhFlagshipGlyph from "./_components/CwhFlagshipGlyph";
import OutcomesList from "./_components/OutcomesList";
import ArchitectureList from "./_components/ArchitectureList";
import WorkReadingMode from "./_components/WorkReadingMode";

export const metadata: Metadata = {
  title: "Work — Emre Doğan",
  description:
    "Five production systems, five architectures. Cloud Waste Hunter (FinOps SaaS on AWS), VibingCoderAI (LLM agent infrastructure), FormAI (edge ML on mobile), PawDoc (multimodal pet triage), Aevum (eldercare coordination). Switch between Outcomes and Architecture reading modes.",
};

/* ──────────────────────────────────────────────────────────────
 *  /work — V6 Sub-PR 14.1 (Phase 14 entry)
 *
 *  The unified work surface that replaces the redundant 2-col
 *  glass-card grid on /projects and the slight-variation card
 *  stack on /architecture. Audit §§ 5.1 + 5.2 + 5.4 (Projects
 *  blocker — generic portfolio grid, no hierarchy, recruiter
 *  perception risk) + § 6.1 (Architecture drag — generic
 *  side-by-side cards). Sub-PR 14.1 fix.
 *
 *  Composition:
 *    1. LEAD BLOCK — flagship CWH treatment on the left
 *       (large title, state-live pill, 64×64 topology glyph
 *       derived from HeroTopologyData, paragraph, two CTAs);
 *       4-row mono list of the other projects on the right.
 *       Communicates hierarchy in the first viewport — CWH
 *       reads as the production load-bearer, the other 4 as
 *       the orbit.
 *
 *    2. READING-MODE TOGGLE (Outcomes / Architecture) — single
 *       client island. Outcomes = wide editorial rows + metric
 *       + visit/github links. Architecture = constellation
 *       strips + walkthrough links. Pure client-side toggle;
 *       no URL mutation. The initial mode mirrors the URL
 *       hash so that /projects → /work#outcomes and
 *       /architecture → /work#architecture redirects land on
 *       the matching composition.
 *
 *    3. CLOSER — "How I work" — single paragraph drawn from
 *       About's Principles section, linking back to /about.
 *
 *  Flag-gated by `NEXT_PUBLIC_V6_WORK_HUB`. Off → 404; the
 *  existing /projects + /architecture hubs render verbatim.
 *  On → /projects + /architecture redirect to /work#outcomes
 *  and /work#architecture respectively.
 *
 *  Spec ref: PORTFOLYO_V6_UI_EXECUTION_SYSTEM.md § Sub-PR 14.1.
 *  Audit ref: PORTFOLYO_V6_UI_AUDIT.md §§ 5.1, 5.2, 5.4, 6.1.
 * ────────────────────────────────────────────────────────────── */

export default function WorkPage() {
  if (process.env.NEXT_PUBLIC_V6_WORK_HUB !== "1") {
    notFound();
  }

  const flagship = WORK_ENTRIES[0];
  const others = WORK_ENTRIES.slice(1);

  return (
    <main id="main" className="relative min-h-screen bg-black">
      {/* Ambient atmosphere — V6 11.1 typed variant.
          Signal: cyan blob top-right + diagonal hairline rule.
          Continues the same atmospheric family /projects used in V5,
          so the unified hub reads as evolution of the work surface
          rather than a separate page. */}
      <PageAtmosphere
        variant="signal"
        legacy={{
          primary: {
            color: "rgba(0,210,255,0.085)",
            position: "top-right",
            size: "lg",
          },
          secondary: {
            color: "rgba(0,210,255,0.04)",
            position: "bottom-left",
            size: "md",
          },
        }}
      />

      <div className="relative z-10 max-w-6xl mx-auto px-6 pt-36 pb-32">

        {/* ───────── HERO HEADER ───────── */}
        <Reveal mode="mount" duration={0.7} className="mb-20">
          <span className="text-[10px] sm:text-xs font-mono uppercase tracking-[0.22em] text-[#00d2ff]/85">
            Work
          </span>
          <h1 className="text-5xl md:text-7xl font-semibold tracking-[-0.04em] leading-[0.95] text-primary mt-5">
            Five systems.
            <br />
            <span className="text-tertiary">One operator.</span>
          </h1>
          <p className="mt-8 text-secondary text-base md:text-lg max-w-2xl leading-relaxed">
            Production-grade SaaS, AI agent infrastructure, edge ML on
            mobile, and two systems in draft. Read for outcomes — what
            shipped, where it lives, what it does — or read for
            architecture — what the topology looks like and how to walk
            it.
          </p>
        </Reveal>

        {/* ───────── LEAD BLOCK ─────────
            Left half: flagship CWH treatment. Right half: vertical
            mono list of the other four projects. Mobile: stacks
            CWH first, list below.

            The flagship treatment is intentionally distinct from
            the right-hand list — large title, full paragraph, the
            mini topology glyph, two CTAs — to communicate
            hierarchy at first read. Audit § 5.2's "CWH demoted to
            peer-equal with FormAI" is what this layout fixes. */}
        <Reveal mode="mount" duration={0.8} delay={0.1} className="mb-28">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-12 md:gap-10">

            {/* ── Flagship: CWH ── */}
            <div className="md:col-span-7 relative">
              <span
                aria-hidden="true"
                className="absolute top-0 left-0 w-20 h-px bg-[#00d2ff]/40"
              />
              <div className="pt-10 space-y-6">
                <div className="flex items-center gap-3">
                  <span className="font-mono uppercase tracking-[0.20em] text-[10px] text-[#00d2ff]/85">
                    Flagship · {flagship.index}
                  </span>
                  <Pill
                    kind={STATE_PILL[flagship.state]}
                    pulse={flagship.state === "live"}
                  >
                    {STATE_LABEL[flagship.state]}
                  </Pill>
                </div>

                <h2 className="text-4xl md:text-5xl font-semibold tracking-[-0.03em] leading-[1.05] text-primary">
                  {flagship.title}
                </h2>

                <div className="flex items-start gap-5">
                  <CwhFlagshipGlyph />
                  <p className="text-secondary text-[15.5px] leading-[1.8] flex-1 max-w-xl">
                    {flagship.oneLine}
                  </p>
                </div>

                <p className="font-mono uppercase tracking-[0.20em] text-[10px] text-tertiary">
                  {flagship.metric}
                </p>

                <div className="flex flex-wrap items-center gap-x-6 gap-y-3 pt-2">
                  <Link
                    href={`/projects/${flagship.projectSlug}`}
                    className="inline-flex items-center gap-1.5 font-mono uppercase tracking-[0.18em] text-[10px] text-[#00d2ff]/85 hover:text-[#00d2ff] transition-colors group"
                  >
                    Open case study
                    <ArrowRight
                      className="w-3 h-3 transition-transform duration-200 group-hover:translate-x-0.5"
                      aria-hidden="true"
                    />
                  </Link>
                  {flagship.architectureSlug ? (
                    <Link
                      href={`/architecture/${flagship.architectureSlug}`}
                      className="inline-flex items-center gap-1.5 font-mono uppercase tracking-[0.18em] text-[10px] text-tertiary hover:text-primary transition-colors group"
                    >
                      Walk the architecture
                      <ArrowRight
                        className="w-3 h-3 transition-transform duration-200 group-hover:translate-x-0.5"
                        aria-hidden="true"
                      />
                    </Link>
                  ) : null}
                  {flagship.liveUrl ? (
                    <a
                      href={flagship.liveUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 font-mono uppercase tracking-[0.18em] text-[10px] text-tertiary hover:text-primary transition-colors group"
                    >
                      Visit
                      <ArrowRight
                        className="w-3 h-3 transition-transform duration-200 group-hover:translate-x-0.5"
                        style={{ transform: "rotate(-45deg)" }}
                        aria-hidden="true"
                      />
                    </a>
                  ) : null}
                </div>
              </div>
            </div>

            {/* ── Vertical mono list of the other four projects ──
                Each row is a single Link → /projects/{slug}, presented
                in mono uppercase with index + title + state pill. The
                hover affordance is a subtle text colour swap; no card
                container, no glass shell. The point is that these
                four projects sit in CWH's orbit — visually subordinate,
                navigationally first-class. */}
            <div className="md:col-span-5 relative">
              <span
                aria-hidden="true"
                className="absolute top-0 left-0 w-12 h-px bg-white/15"
              />
              <p className="font-mono uppercase tracking-[0.22em] text-[10px] text-tertiary pt-10 mb-6">
                In the same orbit
              </p>
              <ol className="space-y-2 list-none">
                {others.map((entry) => (
                  <li key={entry.projectSlug}>
                    <Link
                      href={`/projects/${entry.projectSlug}`}
                      className="group flex items-baseline gap-3 py-3 border-b border-white/[0.05] hover:border-[#00d2ff]/30 transition-colors"
                    >
                      <span className="font-mono uppercase tracking-[0.20em] text-[10px] text-quiet shrink-0 w-6">
                        {entry.index}
                      </span>
                      <span className="text-primary group-hover:text-[#00d2ff] transition-colors duration-200 flex-1 leading-tight">
                        {entry.title}
                      </span>
                      <Pill
                        kind={STATE_PILL[entry.state]}
                        className="shrink-0"
                      >
                        {STATE_LABEL[entry.state]}
                      </Pill>
                    </Link>
                  </li>
                ))}
              </ol>
            </div>

          </div>
        </Reveal>

        {/* ───────── MID BLOCK — READING-MODE TOGGLE ─────────
            Single client island. Outcomes and Architecture are
            server-rendered as JSX and passed in as props; the
            toggle just swaps which one renders. Initial mode is
            mirrored from the URL hash so /projects → #outcomes
            and /architecture → #architecture land correctly. */}
        <Reveal duration={0.7} margin="-80px">
          <WorkReadingMode
            outcomesView={<OutcomesList />}
            architectureView={<ArchitectureList />}
          />
        </Reveal>

        {/* ───────── CLOSER — HOW I WORK ─────────
            Quiet single-paragraph closer drawn from About's
            Principles section. Links back to /about for the full
            principles + specializations. Keeps /work scoped to
            "what shipped" without re-litigating "why" — that's
            About's job. */}
        <Reveal
          duration={0.7}
          margin="-40px"
          className="mt-32 pt-12 border-t border-white/[0.06] max-w-3xl"
        >
          <p className="font-mono uppercase tracking-[0.22em] text-[10px] text-[#00d2ff]/85 mb-5">
            How I work
          </p>
          <p className="text-secondary text-[15px] leading-[1.85]">
            Production-first systems, infrastructure as code, cost-aware
            architecture, AI as leverage — never as substitute. The five
            projects above are what those principles look like in
            shipped form.
          </p>
          <Link
            href="/about"
            className="mt-6 inline-flex items-center gap-1.5 font-mono uppercase tracking-[0.18em] text-[10px] text-tertiary hover:text-primary transition-colors group"
          >
            Full principles
            <ArrowRight
              className="w-3 h-3 transition-transform duration-200 group-hover:translate-x-0.5"
              aria-hidden="true"
            />
          </Link>
        </Reveal>

      </div>
    </main>
  );
}
