import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Reveal } from "@/components/ui/Reveal";
import PageAtmosphere from "@/components/layout/PageAtmosphere";
import { cardSurface, secondaryButton } from "@/lib/v6/glass";
import { isMarginTickEnabled } from "@/lib/v6/marginTick";
import Pill from "@/components/ui/Pill";
import GithubActivity from "./_components/GithubActivity";
import PhilosophyTiles from "./_components/PhilosophyTiles";
import { pulseEntries, type PulseEntry } from "@/data/pulse";

export const metadata: Metadata = {
  title: "About — Emre Doğan",
  description:
    "Cloud and SaaS operator from Adana. Long-arc builder of production AWS infrastructure and AI-native systems. Disciplined practice, hand-built tooling, quiet hours.",
};

/* ──────────────────────────────────────────────────────────────
 *  About — operator framing.
 *
 *  V3 roadmap, ledger entry 745, mapped this page's evolution
 *  away from a present-tense "01:30 bakery shifts" credentialing
 *  story toward an operator manifesto. The bakery and the absence
 *  of a CS degree stay part of the record, but in past tense and
 *  in one quiet line — not as the headline.
 *
 *  Section weight is deliberately uneven. Some blocks are dense
 *  (specializations, principles), some are a single paragraph
 *  (the cinematic break, closing transmission). The asymmetry is
 *  the spatial breathing the brief asked for.
 * ────────────────────────────────────────────────────────────── */

const PHILOSOPHY = [
  {
    eyebrow: "Long arcs",
    body: "Most decisions here are made on a five-year horizon. The right system rarely ships this quarter. The wrong one always does.",
  },
  {
    eyebrow: "The quiet hours",
    body: "The first work block lands before any notification does. Architecture decisions belong to the quietest part of the morning; the rest of the day owes them less.",
  },
  {
    eyebrow: "Hand-built",
    body: "Every production resource provisioned in Terraform. No console-clicked surprises. If it can't be re-created from a repo, it doesn't exist yet.",
  },
  {
    eyebrow: "Body and code",
    body: "The same operating system runs both. Strength training in the early evening, code in the build window after. One discipline keeps the other honest.",
  },
] as const;

/* V6 13.5 — the lifestyle entries moved to `data/pulse.ts` so the
   new `/pulse` route (V6_PULSE_EXTRACTION) and this LegacyAboutPage
   share the same data. The type + the array re-exposed here as
   `LIFESTYLE` so the inline references below continue to work. */
type LifestyleEntry = PulseEntry;
const LIFESTYLE: readonly LifestyleEntry[] = pulseEntries;

const PRINCIPLES = [
  {
    label: "01",
    title: "Production-first.",
    body: "Every system designed for real users from day one. No prototypes wearing the costume of products.",
  },
  {
    label: "02",
    title: "Infrastructure as code.",
    body: "Reproducible. Version-controlled. Re-creatable from a git clone — or it does not count as deployed.",
  },
  {
    label: "03",
    title: "Cost-aware engineering.",
    body: "Every architectural decision considers $/request. At scale, those choices compound faster than feature velocity.",
  },
  {
    label: "04",
    title: "AI as leverage.",
    body: "Augment with AI; never replace engineering rigor. Models hallucinate. Types and tests don't.",
  },
] as const;

const SPECIALIZATIONS = [
  {
    title: "Cloud Architecture",
    body: "Production AWS infrastructure provisioned through Terraform. Multi-region patterns, IAM hardening, CUR-driven cost analytics, cross-account scanning via STS AssumeRole. From single-VPC SaaS to platforms that operate inside customer accounts.",
    keywords: [
      "AWS",
      "Terraform",
      "Lambda",
      "DynamoDB",
      "API Gateway",
      "CloudFront",
      "IAM",
    ],
  },
  {
    title: "AI Systems",
    body: "LLM orchestration with Claude on AWS Bedrock. Streaming chat over Lambda Function URLs to bypass API Gateway timeouts. Master-prompt engineering for autonomous agents and structured remediation pipelines that ground model output in real data.",
    keywords: [
      "Claude",
      "Anthropic SDK",
      "AWS Bedrock",
      "Streaming",
      "Prompt Engineering",
    ],
  },
  {
    title: "Production SaaS",
    body: "End-to-end products. Auth, billing, scanning engines, observability. Lemon Squeezy + Cognito + Sentry + PostHog. Customers see outcomes and dashboards; the infrastructure stays out of the way.",
    keywords: [
      "Lemon Squeezy",
      "AWS Cognito",
      "Sentry",
      "PostHog",
      "FastAPI",
      "Next.js",
    ],
  },
] as const;

/* "Currently" fragments. Static on purpose — these are operator
 * state, not telemetry. Updated by hand when they change. The
 * real-time build status already lives in the global footer's
 * BuildBeacon; this section adds quiet adjacent context. */
const CURRENTLY = [
  {
    label: "Building",
    body: "Cloud Waste Hunter v2 — cross-account scanner with Bedrock-grounded remediation pipelines.",
  },
  {
    label: "Reading",
    body: "Designing Data-Intensive Applications — Kleppmann. Slowly, and with notes.",
  },
  {
    label: "Operating from",
    body: "Adana, Türkiye · GMT+3. Coast roads and quiet rooms.",
  },
  {
    label: "Training",
    body: "Strength block, week four of an eight-week cycle. The deadlift is the gauge.",
  },
] as const;

const FEATURED = [
  {
    id: "aws-waste-hunter",
    title: "Cloud Waste Hunter",
    role: "Founder · Engineer",
    blurb:
      "Production FinOps SaaS that scans AWS accounts and delivers LLM-powered remediation.",
  },
  {
    id: "vibing-coder-ai",
    title: "VibingCoderAI",
    role: "Founder · Engineer",
    blurb:
      "Prompt engineering as a service for developers building with AI agents.",
  },
  {
    id: "sixpack-ai",
    title: "FormAI — Fitness Koçu",
    role: "Lead Engineer",
    blurb:
      "Flutter fitness coach with real-time pose detection and AI voice guidance.",
  },
] as const;

export default function AboutPage() {
  if (process.env.NEXT_PUBLIC_V6_ABOUT_RESTRUCTURE === "1") {
    return <V6AboutPage />;
  }
  return <LegacyAboutPage />;
}

/* ── Legacy /about (V5 baseline, rollback path) ───────────────── */

function LegacyAboutPage() {
  /* V6 11.5 — margin tick. Server-side env read; the className is
     emitted only when V6_MARGIN_TICK=1, otherwise the about page
     renders its V5-style hairline-rule decor only. */
  const tickEnabled = isMarginTickEnabled();

  return (
    <main id="main" className="relative min-h-screen bg-black">
      {/* Ambient atmosphere — V6 11.1 typed variant.
          Editorial composition (two staggered black-on-black radial pools
          + off-canvas right-edge cyan tick) reads as the same atmospheric
          family as /notes and /codex without recolouring the page when
          the V6 flag is on. With the flag off the legacy cyan + gold
          pair is preserved verbatim. */}
      <PageAtmosphere
        variant="editorial"
        legacy={{
          primary: {
            color: "rgba(0,210,255,0.07)",
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

      <div className="relative z-10 max-w-5xl mx-auto px-6 pt-36 pb-32">

        {/* ───────── HERO ─────────
            Two-line statement, lifted from "credentials" to "stance".
            The closing line of the lead paragraph carries the bakery
            in past tense — present once, never again on the page. */}
        <Reveal mode="mount" duration={0.8} className="mb-32 md:mb-36">
          <span className="text-[10px] sm:text-xs uppercase tracking-widest text-primary/40">
            About
          </span>
          <h1 className="text-5xl md:text-7xl font-medium tracking-[-0.04em] leading-[0.95] text-primary mt-5">
            <span className="block">Built slowly.</span>
            <span className="block text-tertiary">On purpose.</span>
          </h1>
          <p className="text-secondary max-w-2xl mt-8 text-base md:text-lg leading-relaxed">
            I&apos;m Emre Doğan. I design and operate production AWS
            infrastructure, AI-native tooling, and full-stack systems —
            from a small, quiet desk in Adana, on time horizons measured
            in years. The work began behind early bakery shifts and
            finished after school days; two years on, what remains is the
            discipline. A slower kind of build, made daily.
          </p>
        </Reveal>

        {/* ─────────  CINEMATIC PAUSE — single line, larger, italic,
                       carries the operating thesis without ornament.
                       Reads as a quiet break before the section grid
                       begins.

                       Phase 1: bumped to text-3xl/4xl so it rhymes
                       with the "What keeps the noise low" breath
                       moment mid-page; added a hairline cyan rule
                       beneath so both breath beats share the same
                       cinematic vocabulary.

                       V6 11.5: introduces the margin-tick second
                       motif — a 1px × 12px vertical cyan rule anchored
                       to the left of the italic paragraph. Co-equal
                       to the cyan hairline-on-card-top motif; identity
                       becomes multi-axis. Renders only when
                       V6_MARGIN_TICK=1.  ───────── */}
        <Reveal duration={0.8} margin="-50px" className="mb-28 md:mb-32">
          <div className="flex items-start gap-5 max-w-3xl">
            {tickEnabled ? (
              <span aria-hidden="true" className="margin-tick mt-4" />
            ) : null}
            <p className="text-2xl md:text-3xl lg:text-[2.1rem] font-medium tracking-[-0.02em] leading-[1.4] text-tertiary italic">
              The system that builds the system matters more than the
              system that ships this quarter.
            </p>
          </div>
          <span
            aria-hidden="true"
            className="block mt-10 h-px w-24 bg-gradient-to-r from-[#00d2ff]/40 via-white/10 to-transparent"
          />
        </Reveal>

        {/* ───────── OPERATING PHILOSOPHY ─────────
            Replaces the bakery-anchored hour-by-hour timeline. Same
            spirit — discipline as design — recast as observed clauses
            rather than a schedule. The 'Quiet hours' tile is the only
            place the early-morning history surfaces, in one poetic line.
        */}
        <section className="mb-32">
          <Reveal duration={0.7}>
            <span className="text-[10px] sm:text-xs uppercase tracking-widest text-primary/40">
              Monk Mode
            </span>
            <h2 className="text-3xl md:text-4xl font-medium tracking-[-0.03em] text-primary mt-5 mb-4">
              The discipline is the design.
            </h2>
            <p className="text-tertiary text-sm md:text-base max-w-xl leading-[1.85] mb-12">
              Less a regimen than a rhythm. Calm repetition; same desk,
              same chair, same first hour. What gets shipped is the
              residue of what gets done quietly, day after day.
            </p>
          </Reveal>

          {/* Asymmetric layout — two-column on md+, but the first tile
              spans both rows on lg so the rhythm is not a uniform 2×2.
              Spatial composition per the brief: same content, less
              boxed-grid energy. */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 lg:gap-6">
            {PHILOSOPHY.map((p, i) => (
              <Reveal
                key={p.eyebrow}
                duration={0.6}
                delay={i * 0.07}
                y={14}
                margin="-60px"
                className={
                  // First tile takes the full left column on lg, the
                  // other three stack in the right pair.
                  i === 0
                    ? "lg:row-span-2 lg:col-span-1"
                    : "lg:col-span-2 lg:max-w-full"
                }
              >
                <div
                  className={`relative rounded-2xl border border-white/[0.06] bg-white/[0.015] p-6 md:p-7 h-full transition-colors duration-500 hover:border-white/[0.10] hover:bg-white/[0.025] ${
                    i === 0 ? "flex flex-col justify-between min-h-[240px]" : ""
                  }`}
                >
                  <span className="font-mono uppercase tracking-[0.20em] text-[10px] text-[#00d2ff]/80 block mb-3">
                    {p.eyebrow}
                  </span>
                  <p className="text-secondary text-[15px] leading-[1.75]">
                    {p.body}
                  </p>
                </div>
              </Reveal>
            ))}
          </div>
        </section>

        {/* ───────── OUTSIDE THE TERMINAL ─────────
            New section: lifestyle as part of the operating identity.
            Restrained, specific, observed. Cross-link out to the Codex
            from inside one of the tiles so the work pattern feeds into
            the work surface.  */}
        <section className="mb-28">
          <Reveal duration={0.7}>
            <span className="text-[10px] sm:text-xs uppercase tracking-widest text-primary/40">
              Outside the terminal
            </span>
            <h2 className="text-3xl md:text-4xl font-medium tracking-[-0.03em] text-primary mt-5 mb-12">
              Systems beyond software.
            </h2>
          </Reveal>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {LIFESTYLE.map((l, i) => {
              const card = (
                <div className="relative h-full rounded-2xl border border-white/[0.06] bg-white/[0.015] p-6 md:p-7 transition-colors duration-500 hover:border-white/[0.10] hover:bg-white/[0.025]">
                  <div className="flex items-baseline justify-between gap-3 mb-3">
                    <span className="font-mono uppercase tracking-[0.20em] text-[10px] text-[#00d2ff]/80">
                      {l.eyebrow}
                    </span>
                    {l.href && (
                      <ArrowRight
                        className="w-3.5 h-3.5 text-quiet flex-shrink-0"
                        style={{ transform: "rotate(-45deg)" }}
                      />
                    )}
                  </div>
                  <p className="text-secondary text-[15px] leading-[1.75]">
                    {l.body}
                  </p>
                </div>
              );

              return (
                <Reveal
                  key={l.eyebrow}
                  duration={0.6}
                  delay={i * 0.08}
                  y={14}
                  margin="-60px"
                >
                  {l.href ? (
                    <Link
                      href={l.href}
                      className="group block h-full"
                      aria-label={`${l.eyebrow} — open codex`}
                    >
                      {card}
                    </Link>
                  ) : (
                    card
                  )}
                </Reveal>
              );
            })}
          </div>
        </section>

        {/* ───────── ATMOSPHERIC BREATH ─────────
            A deliberate quiet between the lifestyle grid and the
            principles grid — the brief asked for "large quiet moments"
            and "asymmetrical spacing". One paragraph, larger type, no
            tiles, no card. The hairline rule beneath is the only
            ornament; it carries the cinematic-pause vocabulary from
            higher up the page so the two breath moments rhyme.

            The text picks up the "solitude / decisions made outside"
            beat that previously lived as a tile in the lifestyle grid,
            so this is a recompose, not new content.

            V6 11.5: margin-tick mounts to the left of the eyebrow,
            the second deployment of the new motif. The two breath
            beats share the tick + hairline-beneath composition so
            they rhyme structurally. Renders only when
            V6_MARGIN_TICK=1. */}
        <section className="mb-32 md:mb-36">
          <Reveal duration={0.8} margin="-80px">
            <div className="flex items-start gap-5 max-w-3xl">
              {tickEnabled ? (
                <span
                  aria-hidden="true"
                  className="margin-tick mt-1.5"
                />
              ) : null}
              <div>
                <span className="text-[10px] sm:text-xs uppercase tracking-widest text-primary/40">
                  What keeps the noise low
                </span>
                <p className="mt-7 text-2xl md:text-3xl lg:text-[2.1rem] font-medium tracking-[-0.02em] leading-[1.4] text-primary/85">
                  A walk before the keyboard sees a problem. Long
                  stretches with no input. The day&apos;s most useful
                  sentence is usually the one written down at the end
                  of one of those walks — solitude isn&apos;t the
                  goal, it&apos;s the operating condition.
                </p>
              </div>
            </div>
            <span
              aria-hidden="true"
              className="block mt-12 h-px w-24 bg-gradient-to-r from-[#00d2ff]/40 via-white/10 to-transparent"
            />
          </Reveal>
        </section>

        {/* ───────── PRINCIPLES ─────────
            Atmospheric depth pass: hairline cyan top-rule and inner
            cyan glow retained; added a darker custom card surface (no
            glassmorphism blur) plus a layered radial highlight in the
            top-left, a left-edge cyan accent that emerges on hover,
            and a softly enlarging label number. The whole grid sits
            on a wide ambient cyan blur so the section reads as one
            atmospheric stage rather than four free-floating cards.
            All transitions are CSS-only, GPU-cheap, and collapse to
            ~0ms under the global reduced-motion guard. */}
        <section className="relative mb-28">
          {/* Ambient cyan stage glow behind the whole grid. Wide,
              very low opacity; sits below the cards so the grid
              reads as one atmospheric surface, not four detached
              tiles. Static — no animation, no RAF cost. */}
          <span
            aria-hidden="true"
            className="pointer-events-none absolute left-1/2 -translate-x-1/2 top-32 w-[120%] h-[420px] rounded-full blur-[140px]"
            style={{
              background:
                "radial-gradient(ellipse, rgba(0,210,255,0.06) 0%, transparent 70%)",
            }}
          />
          <Reveal duration={0.7}>
            <span className="text-[10px] sm:text-xs uppercase tracking-widest text-primary/40">
              Principles
            </span>
            <h2 className="text-3xl md:text-4xl font-medium tracking-[-0.03em] text-primary mt-5 mb-12">
              Four rules I build by.
            </h2>
            <div className="relative grid grid-cols-1 md:grid-cols-2 gap-4">
              {PRINCIPLES.map((p, i) => (
                <Reveal
                  key={p.label}
                  duration={0.6}
                  delay={i * 0.08}
                  y={16}
                  margin="-60px"
                >
                  <div className="group relative overflow-hidden rounded-2xl border border-white/[0.06] bg-white/[0.018] p-7 flex flex-col gap-3 h-full transition-[transform,border-color,background-color] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-0.5 hover:border-white/[0.12] hover:bg-white/[0.028]">
                    {/* Layered top-left radial highlight — barely
                        visible at rest, brightens on hover. Reads as
                        the card catching ambient light from the
                        section's stage glow above. */}
                    <span
                      aria-hidden="true"
                      className="pointer-events-none absolute inset-0 rounded-2xl opacity-60 transition-opacity duration-500 group-hover:opacity-100"
                      style={{
                        background:
                          "radial-gradient(circle at 0% 0%, rgba(255,255,255,0.05), transparent 55%)",
                      }}
                    />
                    {/* Hairline cyan rule at top — barely visible at
                        rest, steps up to ~90% on hover. */}
                    <span
                      aria-hidden="true"
                      className="absolute inset-x-7 top-0 h-px bg-[#00d2ff]/20 opacity-30 transition-opacity duration-500 group-hover:opacity-90"
                    />
                    {/* Left-edge cyan accent — emerges on hover only.
                        Anchors the eye on the active card and reads
                        as a soft spatial cue, not a button affordance. */}
                    <span
                      aria-hidden="true"
                      className="absolute left-0 top-7 bottom-7 w-px bg-[#00d2ff]/0 transition-colors duration-500 group-hover:bg-[#00d2ff]/40"
                    />
                    {/* Inner cyan glow on hover — opacity gated so
                        idle cards stay matte and only the active
                        card glows. */}
                    <span
                      aria-hidden="true"
                      className="pointer-events-none absolute inset-0 rounded-2xl opacity-0 transition-opacity duration-500 group-hover:opacity-100"
                      style={{
                        boxShadow: "inset 0 0 36px rgba(0,210,255,0.07)",
                      }}
                    />
                    <span className="relative text-[#00d2ff]/60 text-xs font-mono tracking-wider transition-[color,letter-spacing] duration-500 group-hover:text-[#00d2ff]/85 group-hover:tracking-[0.18em]">
                      {p.label}
                    </span>
                    <h3 className="relative text-primary font-medium text-lg leading-tight">
                      {p.title}
                    </h3>
                    <p className="relative text-tertiary text-[14.5px] leading-[1.75]">
                      {p.body}
                    </p>
                  </div>
                </Reveal>
              ))}
            </div>
          </Reveal>
        </section>

        {/* ───────── SPECIALIZATIONS ─────────
            Largely unchanged in copy intent; tightened a few clauses
            to drop double-clauses and removed the "Stripe-grade
            checkout" simile because it reads as benchmarking to a
            competitor that is not relevant here. */}
        <section className="mb-28">
          <Reveal duration={0.7}>
            <span className="text-[10px] sm:text-xs uppercase tracking-widest text-primary/40">
              Specializations
            </span>
            <h2 className="text-3xl md:text-4xl font-medium tracking-[-0.03em] text-primary mt-5 mb-12">
              Where the time goes.
            </h2>
            <div className="space-y-5">
              {SPECIALIZATIONS.map((s, i) => (
                <Reveal
                  key={s.title}
                  duration={0.6}
                  delay={i * 0.1}
                  y={16}
                  margin="-60px"
                  className={`${cardSurface()} rounded-2xl p-8 grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-10`}
                >
                  <h3 className="text-primary font-medium text-xl leading-tight">
                    {s.title}
                  </h3>
                  <div className="md:col-span-2 space-y-4">
                    <p className="text-tertiary text-[14.5px] leading-[1.8]">
                      {s.body}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {s.keywords.map((k) => (
                        <span
                          key={k}
                          className="px-2.5 py-1 rounded-full border border-white/10 bg-white/[0.03] text-[10px] uppercase tracking-wider text-primary/60"
                        >
                          {k}
                        </span>
                      ))}
                    </div>
                  </div>
                </Reveal>
              ))}
            </div>
          </Reveal>
        </section>

        {/* ───────── CURRENTLY ─────────
            New small section. Hand-curated state — what's open in the
            workshop right now. Calm rows, mono eyebrow, no metrics,
            no dashboard widgets. The footer's BuildBeacon handles the
            live shipping pulse globally; this is the adjacent context. */}
        <section className="mb-28">
          <Reveal duration={0.7}>
            <span className="text-[10px] sm:text-xs uppercase tracking-widest text-primary/40">
              Currently
            </span>
            <h2 className="text-3xl md:text-4xl font-medium tracking-[-0.03em] text-primary mt-5 mb-10">
              On the bench, this week.
            </h2>
          </Reveal>
          <dl className="divide-y divide-white/[0.05] border-y border-white/[0.05]">
            {CURRENTLY.map((row, i) => (
              <Reveal
                key={row.label}
                duration={0.5}
                delay={i * 0.06}
                y={8}
                margin="-40px"
              >
                <div className="grid grid-cols-[110px_1fr] md:grid-cols-[170px_1fr] gap-5 md:gap-10 items-baseline py-5">
                  <dt className="font-mono uppercase tracking-[0.20em] text-[10px] text-[#00d2ff]/70">
                    {row.label}
                  </dt>
                  <dd className="text-secondary text-[15px] md:text-base leading-relaxed">
                    {row.body}
                  </dd>
                </div>
              </Reveal>
            ))}
          </dl>
        </section>

        {/* ───────── RECEIPTS ─────────
            Phase 1 evolution: from "GitHub heatmap card" to "emotional
            consistency frame". The calendar stays — that's the
            authenticity. What changes is the surround: an outer
            atmospheric halo so the panel sits on its own ambient
            stage, and a quiet mono caption row beneath that lays the
            year out as seasons + place + GMT. Same data, slower
            reading rhythm. No fake metrics, no streak counters, no
            gamified language. */}
        <section className="relative mb-28">
          {/* Outer atmospheric halo — wide, low-opacity cyan blur
              under the receipts panel. Reads as the calendar
              breathing into the page rather than as a bordered
              widget. Static, no RAF. */}
          <span
            aria-hidden="true"
            className="pointer-events-none absolute left-1/2 -translate-x-1/2 top-32 w-[110%] h-[380px] rounded-full blur-[150px]"
            style={{
              background:
                "radial-gradient(ellipse, rgba(0,210,255,0.05) 0%, transparent 70%)",
            }}
          />
          <Reveal duration={0.7}>
            <span className="text-[10px] sm:text-xs uppercase tracking-widest text-primary/40">
              Receipts
            </span>
            <h2 className="text-3xl md:text-4xl font-medium tracking-[-0.03em] text-primary mt-5 mb-4">
              Consistency over intensity.
            </h2>
            <p className="text-tertiary text-sm md:text-base leading-[1.85] max-w-2xl mb-10">
              Two years of mostly-daily commits. Some days are full
              ship-days; some are a single PR. Not every cyan square is
              a win — most are just showing up to the same desk and
              writing the next file.
            </p>
            <div className="relative rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6 md:p-8 overflow-x-auto">
              {/* Subtle ambient inner glow so the panel reads as a
                  cinematic frame rather than as an inset card. No
                  animation — static atmosphere. */}
              <span
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 rounded-2xl"
                style={{
                  boxShadow: "inset 0 0 80px rgba(0,210,255,0.04)",
                }}
              />
              <div className="relative">
                <GithubActivity />
              </div>
            </div>

            {/* Seasonal rhythm caption — a single quiet mono row that
                reframes the calendar from a "GitHub embed" into a
                year-laid-flat. Aligned to the panel above; flows over
                a hairline divider on the left to echo the breath
                section's underline higher up the page. */}
            <div className="mt-6 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-5 font-mono uppercase tracking-[0.20em] text-[10px] text-quiet">
              <span className="inline-flex items-center gap-2">
                <span
                  aria-hidden="true"
                  className="w-1 h-1 rounded-full bg-[#00d2ff]/60"
                />
                <span>Adana</span>
              </span>
              <span className="hidden sm:inline text-faint">·</span>
              <span>Two winters &nbsp;&middot;&nbsp; two summers</span>
              <span className="hidden sm:inline text-faint">·</span>
              <span>GMT+3</span>
            </div>
          </Reveal>
        </section>

        {/* ───────── IN FLIGHT ─────────
            Same three projects; renamed from "Active projects" to
            something lighter that doesn't double up on the
            "Currently" eyebrow above. */}
        <section className="mb-28">
          <Reveal duration={0.7}>
            <span className="text-[10px] sm:text-xs uppercase tracking-widest text-primary/40">
              In flight
            </span>
            <h2 className="text-3xl md:text-4xl font-medium tracking-[-0.03em] text-primary mt-5 mb-12">
              Live builds.
            </h2>
            <div className="divide-y divide-white/[0.06] border-y border-white/[0.06]">
              {FEATURED.map((p, i) => (
                <Reveal
                  key={p.id}
                  duration={0.5}
                  delay={i * 0.08}
                  y={10}
                  margin="-40px"
                >
                  <Link
                    href={`/projects/${p.id}`}
                    className="group flex items-center justify-between gap-6 py-6 hover:bg-white/[0.02] transition-colors duration-300 -mx-4 px-4 rounded-lg"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline gap-3 mb-1 flex-wrap">
                        <h3 className="text-primary font-medium text-lg">
                          {p.title}
                        </h3>
                        <span className="text-tertiary text-xs font-mono">
                          {p.role}
                        </span>
                      </div>
                      <p className="text-tertiary text-sm leading-relaxed">
                        {p.blurb}
                      </p>
                    </div>
                    <ArrowRight
                      className="w-4 h-4 text-quiet group-hover:text-primary transition-all duration-300 group-hover:translate-x-1 flex-shrink-0"
                      style={{ transform: "rotate(-45deg)" }}
                    />
                  </Link>
                </Reveal>
              ))}
            </div>
          </Reveal>
        </section>

        {/* ───────── CLOSING TRANSMISSION ─────────
            Phase 1 evolution: from "roadmap stance + pulse pill" to
            "final transmission". The stance copy and CTAs stay; we
            slot a quiet mono read-out between the paragraph and the
            CTAs (four hand-curated fields, transmission-record
            vocabulary), and close the page with an "end transmission"
            signature line at the bottom rule.

            Deliberately does NOT duplicate live state:
              · BuildBeacon (global footer) — live commit pulse
              · "Currently" section above — what's open this week
            These four fields are sign-off coordinates: where the
            transmission was written from, not a status dashboard. */}
        <section className="relative">
          <Reveal duration={0.8}>
            <span className="text-[10px] sm:text-xs uppercase tracking-widest text-primary/40">
              Closing transmission
            </span>
            <h2 className="text-4xl md:text-6xl font-medium tracking-[-0.04em] leading-[0.95] text-primary mt-5 mb-8">
              <span className="block">Building tools</span>
              <span className="block text-tertiary">engineers actually use.</span>
            </h2>
            <p className="text-secondary max-w-2xl text-base md:text-lg leading-relaxed">
              Smaller systems, sharper edges, fewer dashboards.
              Infrastructure that engineering teams can hold in one
              head. Operator time is the scarcest resource in the
              stack; the work here is built around protecting it.
            </p>

            {/* Quiet system pulse — static, no animation, just a
                single mono line that grounds the page in a real
                place. The dot is a tiny cyan static disc; the live
                shipping pulse already lives in the global footer. */}
            <p className="mt-10 inline-flex items-center gap-2.5 rounded-full border border-white/[0.08] bg-white/[0.02] px-3.5 py-1.5 font-mono uppercase tracking-[0.18em] text-[10px] text-tertiary">
              <span
                aria-hidden="true"
                className="w-1.5 h-1.5 rounded-full bg-[#00d2ff]/80"
              />
              <span>Build window · open</span>
              <span className="text-faint">·</span>
              <span>Adana</span>
              <span className="text-faint">·</span>
              <span>GMT+3</span>
            </p>

            {/* Transmission read-out — four hand-curated fields, a
                thin vertical cyan rule on the left. Reads as the
                sign-off coordinates of the page, not a dashboard:
                no live metric is bound here. Updated by hand when
                the underlying state changes. */}
            <dl className="mt-10 max-w-md border-l border-white/[0.06] pl-5 space-y-2.5">
              {[
                { k: "Field", v: "Adana · GMT+3" },
                { k: "Build", v: "Cloud Waste Hunter v2" },
                { k: "Reading", v: "Kleppmann · DDIA" },
                { k: "Stance", v: "Long arcs · daily practice" },
              ].map((row) => (
                <div
                  key={row.k}
                  className="grid grid-cols-[80px_1fr] gap-4 items-baseline"
                >
                  <dt className="font-mono uppercase tracking-[0.18em] text-[10px] text-quiet">
                    {row.k}
                  </dt>
                  <dd className="text-tertiary text-[13.5px] leading-relaxed">
                    {row.v}
                  </dd>
                </div>
              ))}
            </dl>

            <div className="mt-12 flex flex-wrap gap-4">
              <Link
                href="/contact"
                className="group inline-flex items-center gap-2 rounded-full pl-5 pr-1 py-1 bg-primary hover:gap-3 transition-all duration-300"
              >
                <span className="text-black font-medium text-sm">
                  Get in touch
                </span>
                <div className="bg-black rounded-full w-9 h-9 flex items-center justify-center group-hover:scale-110 transition-transform duration-300 flex-shrink-0">
                  <ArrowRight className="w-4 h-4 text-primary" />
                </div>
              </Link>
              <Link
                href="/projects"
                className={`inline-flex items-center gap-2 rounded-full px-5 py-2.5 ${secondaryButton()} text-sm font-medium text-primary/80 hover:text-primary transition-colors`}
              >
                See the work
              </Link>
            </div>

            {/* End-transmission signature — a single quiet mono line
                under a hairline rule. The page's last vertical beat
                before the global footer takes over. Static. */}
            <div className="mt-20 pt-6 border-t border-white/[0.05] flex items-center gap-3 font-mono uppercase tracking-[0.22em] text-[10px] text-faint">
              <span
                aria-hidden="true"
                className="w-1 h-1 rounded-full bg-[#00d2ff]/50"
              />
              <span>End transmission</span>
              <span className="text-faint">·</span>
              <span>ED.</span>
              <span className="text-faint">·</span>
              <span>2026</span>
            </div>
          </Reveal>
        </section>
      </div>
    </main>
  );
}

/* ── V6 /about (Sub-PR 13.3 reordered + lead rewrite) ──────────
 *
 * Spec § Sub-PR 13.3 explicit section order:
 *   1.  HERO (rewritten lead paragraph per 13.3a — bakery first)
 *   2.  CLOSING TRANSMISSION SIGNATURE (cyan-tick'd pulse pill +
 *       dt/dl FIELD/BUILD/READING/STANCE — moved up)
 *   3.  CINEMATIC PAUSE
 *   4.  OPERATING PHILOSOPHY (asymmetric 1+3 tiles)
 *   5.  IN FLIGHT (live builds, was section 11)
 *   6.  RECEIPTS (GitHub heatmap)
 *   7.  PRINCIPLES (4 numbered tiles)
 *   8.  SPECIALIZATIONS (compressed — no card surface, single
 *       paragraph + chip line per spec)
 *   9.  CURRENTLY (dt/dl rows)
 *   10. ATMOSPHERIC BREATH ("What keeps the noise low")
 *   11. CLOSING H2 + CTAs ("Building tools / engineers actually use"
 *       + 2 CTAs + end-transmission signature)
 *
 * Removed: "Outside The Terminal" (Training / Motorcycle /
 *   Reading / Codex). Sub-PR 13.5 will host the content at /pulse;
 *   the LegacyAboutPage above retains the section for rollback.
 *
 * Hero lead paragraph rewritten per 13.3a — identity vector
 * (bakery shifts) arrives first; expertise list arrives second.
 *
 * Audit refs: §§ 4.1, 4.4, 4.6.
 * Spec ref:   § Sub-PR 13.3. */

function V6AboutPage() {
  const tickEnabled = isMarginTickEnabled();

  /* V6 13.4 — section-level spatial variation. Default OFF; when
     enabled, the Operating Philosophy / Principles / Specializations
     sections each adopt a distinct asymmetric layout so the
     asymmetric move earns its identity through repetition (audit
     § 4.3). When disabled, V6AboutPage renders the 13.3 uniform-
     grid composition for these sections. */
  const spatialVarEnabled =
    process.env.NEXT_PUBLIC_V6_ABOUT_SPATIAL_VAR === "1";

  return (
    <main id="main" className="relative min-h-screen bg-black">
      <PageAtmosphere
        variant="editorial"
        legacy={{
          primary: {
            color: "rgba(0,210,255,0.07)",
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

      <div className="relative z-10 max-w-5xl mx-auto px-6 pt-36 pb-32">

        {/* ───────── 1. HERO (rewritten lead per 13.3a) ─────────
            Identity vector first: the bakery sentence opens the
            page. Expertise list arrives second. Same content as
            V5, inverted order. */}
        <Reveal mode="mount" duration={0.8} className="mb-24 md:mb-28">
          <span className="text-[10px] sm:text-xs uppercase tracking-widest text-primary/40">
            About
          </span>
          <h1 className="text-5xl md:text-7xl font-medium tracking-[-0.04em] leading-[0.95] text-primary mt-5">
            <span className="block">Built slowly.</span>
            <span className="block text-tertiary">On purpose.</span>
          </h1>
          <p className="text-secondary max-w-2xl mt-8 text-base md:text-lg leading-relaxed">
            The work began behind 01:30 bakery shifts and finished
            after school days. Two years on, the discipline is what
            remains — the rest is production AWS infrastructure,
            AI-native tooling, and full-stack systems, designed on
            time horizons measured in years from a small desk in
            Adana.
          </p>
        </Reveal>

        {/* ───────── 2. CLOSING TRANSMISSION SIGNATURE ─────────
            Moved up from V5's Closing Transmission. The strongest
            single block (operator's coordinates of practice +
            live build context) arrives early on the page so a
            recruiter / senior engineer reads the position before
            the long-form principles list. */}
        <section className="mb-28 md:mb-32">
          <Reveal duration={0.7}>
            <span className="text-[10px] sm:text-xs uppercase tracking-widest text-primary/40">
              Signature
            </span>
            <h2 className="text-3xl md:text-4xl font-medium tracking-[-0.03em] text-primary mt-5 mb-8">
              Coordinates of practice.
            </h2>

            {/* Pulse pill — with V6 13.3 cyan margin tick to its
                left. The pill content (Build window · open ·
                Adana · GMT+3) is unchanged from V5; the tick is
                the new affordance per spec ("the cyan-tick'd
                pulse pill"). */}
            <div className="flex items-baseline gap-3">
              <span aria-hidden="true" className="margin-tick mt-1 shrink-0" />
              <p className="inline-flex items-center gap-2.5 rounded-full border border-white/[0.08] bg-white/[0.02] px-3.5 py-1.5 font-mono uppercase tracking-[0.18em] text-[10px] text-tertiary">
                <span
                  aria-hidden="true"
                  className="w-1.5 h-1.5 rounded-full bg-[#00d2ff]/80"
                />
                <span>Build window · open</span>
                <span className="text-faint">·</span>
                <span>Adana</span>
                <span className="text-faint">·</span>
                <span>GMT+3</span>
              </p>
            </div>

            {/* Transmission read-out — preserved from V5. Four
                hand-curated fields, thin cyan rule on the left
                (retoned from V5's white/06 to keep the signature
                block visually unified with the pulse pill above). */}
            <dl className="mt-10 max-w-md border-l border-[#00d2ff]/[0.20] pl-5 space-y-2.5">
              {[
                { k: "Field", v: "Adana · GMT+3" },
                { k: "Build", v: "Cloud Waste Hunter v2" },
                { k: "Reading", v: "Kleppmann · DDIA" },
                { k: "Stance", v: "Long arcs · daily practice" },
              ].map((row) => (
                <div
                  key={row.k}
                  className="grid grid-cols-[80px_1fr] gap-4 items-baseline"
                >
                  <dt className="font-mono uppercase tracking-[0.18em] text-[10px] text-quiet">
                    {row.k}
                  </dt>
                  <dd className="text-tertiary text-[13.5px] leading-relaxed">
                    {row.v}
                  </dd>
                </div>
              ))}
            </dl>
          </Reveal>
        </section>

        {/* ───────── 3. CINEMATIC PAUSE ─────────
            Preserved from V5, including the 11.5 margin-tick
            second motif anchored to the left of the italic
            paragraph. */}
        <Reveal duration={0.8} margin="-50px" className="mb-28 md:mb-32">
          <div className="flex items-start gap-5 max-w-3xl">
            {tickEnabled ? (
              <span aria-hidden="true" className="margin-tick mt-4" />
            ) : null}
            <p className="text-2xl md:text-3xl lg:text-[2.1rem] font-medium tracking-[-0.02em] leading-[1.4] text-tertiary italic">
              The system that builds the system matters more than the
              system that ships this quarter.
            </p>
          </div>
          <span
            aria-hidden="true"
            className="block mt-10 h-px w-24 bg-gradient-to-r from-[#00d2ff]/40 via-white/10 to-transparent"
          />
        </Reveal>

        {/* ───────── 4. OPERATING PHILOSOPHY ─────────
            Preserved from V5 — asymmetric 1+3 tile layout.
            V6 13.4: extracted into <PhilosophyTiles /> for clarity
            per spec ("extract for clarity"). The 1 tall left + 3
            right composition is identical to V5/13.3; only the
            file organisation changed. */}
        <section className="mb-28 md:mb-32">
          <Reveal duration={0.7}>
            <span className="text-[10px] sm:text-xs uppercase tracking-widest text-primary/40">
              Monk Mode
            </span>
            <h2 className="text-3xl md:text-4xl font-medium tracking-[-0.03em] text-primary mt-5 mb-4">
              The discipline is the design.
            </h2>
            <p className="text-tertiary text-sm md:text-base max-w-xl leading-[1.85] mb-12">
              Less a regimen than a rhythm. Calm repetition; same desk,
              same chair, same first hour. What gets shipped is the
              residue of what gets done quietly, day after day.
            </p>
          </Reveal>

          <PhilosophyTiles philosophy={PHILOSOPHY} />
        </section>

        {/* ───────── 5. IN FLIGHT (live builds) ─────────
            Promoted from V5's section 11 — the visitor sees the
            actual work earlier in the read. */}
        <section className="mb-28">
          <Reveal duration={0.7}>
            <span className="text-[10px] sm:text-xs uppercase tracking-widest text-primary/40">
              In flight
            </span>
            <h2 className="text-3xl md:text-4xl font-medium tracking-[-0.03em] text-primary mt-5 mb-12">
              Live builds.
            </h2>
            <div className="divide-y divide-white/[0.06] border-y border-white/[0.06]">
              {FEATURED.map((p, i) => (
                <Reveal
                  key={p.id}
                  duration={0.5}
                  delay={i * 0.08}
                  y={10}
                  margin="-40px"
                >
                  <Link
                    href={`/projects/${p.id}`}
                    className="group flex items-center justify-between gap-6 py-6 hover:bg-white/[0.02] transition-colors duration-300 -mx-4 px-4 rounded-lg"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline gap-3 mb-1 flex-wrap">
                        <h3 className="text-primary font-medium text-lg">
                          {p.title}
                        </h3>
                        <span className="text-tertiary text-xs font-mono">
                          {p.role}
                        </span>
                      </div>
                      <p className="text-tertiary text-sm leading-relaxed">
                        {p.blurb}
                      </p>
                    </div>
                    <ArrowRight
                      className="w-4 h-4 text-quiet group-hover:text-primary transition-all duration-300 group-hover:translate-x-1 flex-shrink-0"
                      style={{ transform: "rotate(-45deg)" }}
                    />
                  </Link>
                </Reveal>
              ))}
            </div>
          </Reveal>
        </section>

        {/* ───────── 6. RECEIPTS (GitHub heatmap) ─────────
            Preserved from V5 — emotional consistency frame with
            cyan halo + seasonal rhythm caption. */}
        <section className="relative mb-28">
          <span
            aria-hidden="true"
            className="pointer-events-none absolute left-1/2 -translate-x-1/2 top-32 w-[110%] h-[380px] rounded-full blur-[150px]"
            style={{
              background:
                "radial-gradient(ellipse, rgba(0,210,255,0.05) 0%, transparent 70%)",
            }}
          />
          <Reveal duration={0.7}>
            <span className="text-[10px] sm:text-xs uppercase tracking-widest text-primary/40">
              Receipts
            </span>
            <h2 className="text-3xl md:text-4xl font-medium tracking-[-0.03em] text-primary mt-5 mb-4">
              Consistency over intensity.
            </h2>
            <p className="text-tertiary text-sm md:text-base leading-[1.85] max-w-2xl mb-10">
              Two years of mostly-daily commits. Some days are full
              ship-days; some are a single PR. Not every cyan square is
              a win — most are just showing up to the same desk and
              writing the next file.
            </p>
            <div className="relative rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6 md:p-8 overflow-x-auto">
              <span
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 rounded-2xl"
                style={{
                  boxShadow: "inset 0 0 80px rgba(0,210,255,0.04)",
                }}
              />
              <div className="relative">
                <GithubActivity />
              </div>
            </div>
            <div className="mt-6 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-5 font-mono uppercase tracking-[0.20em] text-[10px] text-quiet">
              <span className="inline-flex items-center gap-2">
                <span
                  aria-hidden="true"
                  className="w-1 h-1 rounded-full bg-[#00d2ff]/60"
                />
                <span>Adana</span>
              </span>
              <span className="hidden sm:inline text-faint">·</span>
              <span>Two winters &nbsp;&middot;&nbsp; two summers</span>
              <span className="hidden sm:inline text-faint">·</span>
              <span>GMT+3</span>
            </div>
          </Reveal>
        </section>

        {/* ───────── 7. PRINCIPLES ─────────
            Preserved from V5 — atmospheric depth pass, 4 numbered
            tiles on a wide ambient cyan stage. */}
        <section className="relative mb-28">
          <span
            aria-hidden="true"
            className="pointer-events-none absolute left-1/2 -translate-x-1/2 top-32 w-[120%] h-[420px] rounded-full blur-[140px]"
            style={{
              background:
                "radial-gradient(ellipse, rgba(0,210,255,0.06) 0%, transparent 70%)",
            }}
          />
          <Reveal duration={0.7}>
            <span className="text-[10px] sm:text-xs uppercase tracking-widest text-primary/40">
              Principles
            </span>
            <h2 className="text-3xl md:text-4xl font-medium tracking-[-0.03em] text-primary mt-5 mb-12">
              How the work gets made.
            </h2>
          </Reveal>
          {/* V6 13.4 spatial variation: 2+2 with mid-row gap, where
              Principle 03 (Cost-aware engineering) sits in a wider
              container — the most load-bearing principle, the
              layout reflects. The 12-col grid renders row 1 as 6+6
              (01 + 02) and row 2 as 7+5 (03 wider + 04 narrower).
              When the flag is off, the V6 layout falls back to
              the 13.3 uniform 2×2 grid. */}
          <div
            className={
              spatialVarEnabled
                ? "grid grid-cols-1 md:grid-cols-12 gap-5 md:gap-x-5 md:gap-y-12"
                : "grid grid-cols-1 md:grid-cols-2 gap-5"
            }
          >
            {PRINCIPLES.map((p, i) => {
              const spatialColSpan = spatialVarEnabled
                ? i === 2
                  ? "md:col-span-7"
                  : i === 3
                    ? "md:col-span-5"
                    : "md:col-span-6"
                : "";
              return (
                <Reveal
                  key={p.label}
                  duration={0.6}
                  delay={i * 0.08}
                  y={14}
                  margin="-60px"
                  className={spatialColSpan}
                >
                  <div className="group relative rounded-2xl border border-white/[0.06] bg-white/[0.02] p-7 md:p-8 h-full transition-all duration-500 hover:border-white/[0.10] hover:bg-white/[0.04] overflow-hidden">
                    <span
                      aria-hidden="true"
                      className="absolute inset-x-7 top-0 h-px bg-[#00d2ff]/20 opacity-30 group-hover:opacity-90 transition-opacity duration-500"
                    />
                    <span
                      aria-hidden="true"
                      className="pointer-events-none absolute inset-0 rounded-2xl opacity-60 transition-opacity duration-500 group-hover:opacity-100"
                      style={{
                        background:
                          "radial-gradient(circle at 0% 0%, rgba(255,255,255,0.05), transparent 55%)",
                      }}
                    />
                    <div className="relative">
                      <span className="font-mono text-[#00d2ff]/70 text-base block mb-3 transition-all duration-500 group-hover:text-[#00d2ff] group-hover:text-lg">
                        {p.label}
                      </span>
                      <h3 className="text-primary font-medium text-xl tracking-tight mb-3">
                        {p.title}
                      </h3>
                      <p className="text-tertiary text-sm leading-[1.85]">
                        {p.body}
                      </p>
                    </div>
                  </div>
                </Reveal>
              );
            })}
          </div>
        </section>

        {/* ───────── 8. SPECIALIZATIONS ─────────
            V6 13.3 introduced the compressed divider-line list.
            V6 13.4 spatial variation (when enabled): three columns
            sharing a baseline grid on md+; only the FIRST column
            carries chip-style keywords (Pill kind="meta"); the
            other two carry inline mono `·`-separated lines. Forces
            visible variation between the three specs without losing
            the data shape. When the spatial flag is off, the V6
            layout falls back to 13.3's divider-line list. */}
        <section className="mb-28">
          <Reveal duration={0.7}>
            <span className="text-[10px] sm:text-xs uppercase tracking-widest text-primary/40">
              Specializations
            </span>
            <h2 className="text-3xl md:text-4xl font-medium tracking-[-0.03em] text-primary mt-5 mb-10">
              Where the time goes.
            </h2>
          </Reveal>
          {spatialVarEnabled ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-10 items-stretch">
              {SPECIALIZATIONS.map((s, i) => {
                const useChips = i === 0;
                return (
                  <Reveal
                    key={s.title}
                    duration={0.6}
                    delay={i * 0.08}
                    y={12}
                    margin="-40px"
                  >
                    <article className="h-full flex flex-col gap-4 border-t border-white/[0.06] pt-6">
                      <h3 className="text-primary font-medium text-base md:text-lg leading-tight">
                        {s.title}
                      </h3>
                      <p className="text-tertiary text-[14px] leading-[1.8] flex-grow">
                        {s.body}
                      </p>
                      {useChips ? (
                        <div className="flex flex-wrap gap-1.5 items-baseline">
                          {s.keywords.map((k) => (
                            <Pill key={k} kind="meta">
                              {k}
                            </Pill>
                          ))}
                        </div>
                      ) : (
                        <p className="font-mono uppercase tracking-[0.18em] text-[10px] text-tertiary leading-relaxed">
                          {s.keywords.map((k, ki) => (
                            <span key={k}>
                              {k}
                              {ki < s.keywords.length - 1 ? (
                                <span
                                  aria-hidden="true"
                                  className="text-faint mx-2"
                                >
                                  ·
                                </span>
                              ) : null}
                            </span>
                          ))}
                        </p>
                      )}
                    </article>
                  </Reveal>
                );
              })}
            </div>
          ) : (
            <div className="divide-y divide-white/[0.05] border-y border-white/[0.05]">
              {SPECIALIZATIONS.map((s, i) => (
                <Reveal
                  key={s.title}
                  duration={0.6}
                  delay={i * 0.08}
                  y={12}
                  margin="-40px"
                >
                  <article className="grid grid-cols-1 md:grid-cols-[1fr_2fr] gap-4 md:gap-10 py-7">
                    <h3 className="text-primary font-medium text-base md:text-lg leading-tight">
                      {s.title}
                    </h3>
                    <div className="space-y-3">
                      <p className="text-tertiary text-[14.5px] leading-[1.8]">
                        {s.body}
                      </p>
                      <div className="flex flex-wrap gap-x-3 gap-y-1 items-baseline">
                        {s.keywords.map((k, ki) => (
                          <span
                            key={k}
                            className="font-mono uppercase tracking-[0.18em] text-[10px] text-tertiary"
                          >
                            {k}
                            {ki < s.keywords.length - 1 ? (
                              <span aria-hidden="true" className="text-faint ml-3">·</span>
                            ) : null}
                          </span>
                        ))}
                      </div>
                    </div>
                  </article>
                </Reveal>
              ))}
            </div>
          )}
        </section>

        {/* ───────── 9. CURRENTLY ─────────
            Preserved from V5 — small intentional footer block of
            hand-curated state. */}
        <section className="mb-28">
          <Reveal duration={0.7}>
            <span className="text-[10px] sm:text-xs uppercase tracking-widest text-primary/40">
              Currently
            </span>
            <h2 className="text-3xl md:text-4xl font-medium tracking-[-0.03em] text-primary mt-5 mb-10">
              On the bench, this week.
            </h2>
          </Reveal>
          <dl className="divide-y divide-white/[0.05] border-y border-white/[0.05]">
            {CURRENTLY.map((row, i) => (
              <Reveal
                key={row.label}
                duration={0.5}
                delay={i * 0.06}
                y={8}
                margin="-40px"
              >
                <div className="grid grid-cols-[110px_1fr] md:grid-cols-[170px_1fr] gap-5 md:gap-10 items-baseline py-5">
                  <dt className="font-mono uppercase tracking-[0.20em] text-[10px] text-[#00d2ff]/70">
                    {row.label}
                  </dt>
                  <dd className="text-secondary text-[15px] md:text-base leading-relaxed">
                    {row.body}
                  </dd>
                </div>
              </Reveal>
            ))}
          </dl>
        </section>

        {/* ───────── 10. ATMOSPHERIC BREATH ─────────
            Preserved from V5 — bridges Currently to the page's
            emotional close. Margin tick from 11.5 anchored to the
            left of the eyebrow. */}
        <section className="mb-28 md:mb-32">
          <Reveal duration={0.8} margin="-80px">
            <div className="flex items-start gap-5 max-w-3xl">
              {tickEnabled ? (
                <span
                  aria-hidden="true"
                  className="margin-tick mt-1.5"
                />
              ) : null}
              <div>
                <span className="text-[10px] sm:text-xs uppercase tracking-widest text-primary/40">
                  What keeps the noise low
                </span>
                <p className="mt-7 text-2xl md:text-3xl lg:text-[2.1rem] font-medium tracking-[-0.02em] leading-[1.4] text-primary/85">
                  A walk before the keyboard sees a problem. Long
                  stretches with no input. The day&apos;s most useful
                  sentence is usually the one written down at the end
                  of one of those walks — solitude isn&apos;t the
                  goal, it&apos;s the operating condition.
                </p>
              </div>
            </div>
            <span
              aria-hidden="true"
              className="block mt-12 h-px w-24 bg-gradient-to-r from-[#00d2ff]/40 via-white/10 to-transparent"
            />
          </Reveal>
        </section>

        {/* ───────── 11. CLOSING H2 + CTAs ─────────
            Remainder of V5's Closing Transmission, with the
            signature block (pulse pill + dt/dl) moved up to
            section 2. The H2 + paragraph + CTAs + end-signature
            line stay here as the page's emotional close. */}
        <section className="relative">
          <Reveal duration={0.8}>
            <span className="text-[10px] sm:text-xs uppercase tracking-widest text-primary/40">
              Closing transmission
            </span>
            <h2 className="text-4xl md:text-6xl font-medium tracking-[-0.04em] leading-[0.95] text-primary mt-5 mb-8">
              <span className="block">Building tools</span>
              <span className="block text-tertiary">engineers actually use.</span>
            </h2>
            <p className="text-secondary max-w-2xl text-base md:text-lg leading-relaxed">
              Smaller systems, sharper edges, fewer dashboards.
              Infrastructure that engineering teams can hold in one
              head. Operator time is the scarcest resource in the
              stack; the work here is built around protecting it.
            </p>

            <div className="mt-12 flex flex-wrap gap-4">
              <Link
                href="/contact"
                className="group inline-flex items-center gap-2 rounded-full pl-5 pr-1 py-1 bg-primary hover:gap-3 transition-all duration-300"
              >
                <span className="text-black font-medium text-sm">
                  Get in touch
                </span>
                <div className="bg-black rounded-full w-9 h-9 flex items-center justify-center group-hover:scale-110 transition-transform duration-300 flex-shrink-0">
                  <ArrowRight className="w-4 h-4 text-primary" />
                </div>
              </Link>
              <Link
                href="/projects"
                className={`inline-flex items-center gap-2 rounded-full px-5 py-2.5 ${secondaryButton()} text-sm font-medium text-primary/80 hover:text-primary transition-colors`}
              >
                See the work
              </Link>
            </div>

            {/* V6 13.5 — quiet footer link to /pulse.
                When V6_PULSE_EXTRACTION is on, the lifestyle
                content lives at /pulse and this line is the
                single discoverability hint from /about. When the
                flag is off, the link is omitted (the route 404s
                anyway). */}
            {process.env.NEXT_PUBLIC_V6_PULSE_EXTRACTION === "1" ? (
              <p className="mt-16 font-mono uppercase tracking-[0.20em] text-[10px] text-tertiary">
                On the hours that aren&apos;t code{" "}
                <Link
                  href="/pulse"
                  className="text-[#00d2ff]/80 hover:text-[#00d2ff] transition-colors inline-flex items-center gap-1"
                >
                  → /pulse
                </Link>
              </p>
            ) : null}

            <div className="mt-20 pt-6 border-t border-white/[0.05] flex items-center gap-3 font-mono uppercase tracking-[0.22em] text-[10px] text-faint">
              <span
                aria-hidden="true"
                className="w-1 h-1 rounded-full bg-[#00d2ff]/50"
              />
              <span>End transmission</span>
              <span className="text-faint">·</span>
              <span>ED.</span>
              <span className="text-faint">·</span>
              <span>2026</span>
            </div>
          </Reveal>
        </section>
      </div>
    </main>
  );
}
