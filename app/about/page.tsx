import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Reveal } from "@/components/ui/Reveal";
import GithubActivity from "./_components/GithubActivity";

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
    eyebrow: "Quiet hours",
    body: "Mornings start before the city does. The first work block lands before any notification — the rule that survived two years of running on borrowed sleep.",
  },
  {
    eyebrow: "Hand-built",
    body: "Every production resource provisioned in Terraform. No console-clicked surprises. If it can't be re-created from a repo, it doesn't exist yet.",
  },
  {
    eyebrow: "Body and code",
    body: "The same operating system runs both. Strength training in the early evening, code in the build window after. One discipline pays the other's invoice.",
  },
] as const;

interface LifestyleEntry {
  eyebrow: string;
  body: string;
  href?: string;
}

const LIFESTYLE: readonly LifestyleEntry[] = [
  {
    eyebrow: "Training",
    body: "Five sessions a week, an iron-only programme built around the squat, deadlift, and press. Strength as a tax on time, not a sport. The discipline transfers.",
  },
  {
    eyebrow: "The motorcycle",
    body: "Naked sport on the Adana coast roads. The first hour after rain is the cleanest signal a screen will not give back. Helmets clear what monitors do not.",
  },
  {
    eyebrow: "The codex",
    body: "Three handcrafted digital editions — Mendîran, Mythologica, Solgun — each shipped as a zero-dependency reader. Worldbuilding as engineering on a different substrate.",
    href: "/codex",
  },
  {
    eyebrow: "Solitude",
    body: "Long walks before the keyboard sees a problem. Most architecture decisions are settled outside on foot, in silence; the implementation is only the transcription.",
  },
];

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
  return (
    <main id="main" className="relative min-h-screen bg-black">
      {/* Ambient atmosphere — restrained, cyan-leaning, no purple
          since we want the page to read as the same atmospheric
          family as /codex and /notes rather than as a separate
          colour district. */}
      <div
        className="pointer-events-none fixed inset-0 z-0"
        aria-hidden="true"
      >
        <div
          className="absolute top-[-200px] right-[-200px] w-[700px] h-[700px] rounded-full blur-[180px]"
          style={{
            background:
              "radial-gradient(ellipse, rgba(0,210,255,0.07) 0%, transparent 70%)",
          }}
        />
        <div
          className="absolute bottom-[-200px] left-[-100px] w-[600px] h-[600px] rounded-full blur-[160px]"
          style={{
            background:
              "radial-gradient(ellipse, rgba(168,132,44,0.05) 0%, transparent 70%)",
          }}
        />
      </div>

      <div className="relative z-10 max-w-5xl mx-auto px-6 pt-36 pb-32">

        {/* ───────── HERO ─────────
            Two-line statement, lifted from "credentials" to "stance".
            The closing line of the lead paragraph carries the bakery
            in past tense — present once, never again on the page. */}
        <Reveal mode="mount" duration={0.8} className="mb-28">
          <span className="text-[10px] sm:text-xs uppercase tracking-widest text-primary/40">
            About
          </span>
          <h1 className="text-5xl md:text-7xl font-medium tracking-[-0.04em] leading-[0.95] text-primary mt-5">
            <span className="block">Built slowly.</span>
            <span className="block text-white/55">On purpose.</span>
          </h1>
          <p className="text-secondary max-w-2xl mt-8 text-base md:text-lg leading-relaxed">
            I&apos;m Emre Doğan — a cloud and SaaS operator working out of
            Adana. I build production-grade AWS infrastructure, AI-native
            tooling, and full-stack mobile systems on long time horizons
            and from a small, quiet desk. Two years of compounding,
            mostly-daily practice; the early mornings used to be a bakery
            shift, the late evenings a school day. Today they&apos;re
            architecture decisions and a barbell.
          </p>
        </Reveal>

        {/* ─────────  CINEMATIC PAUSE — single line, larger, italic,
                       carries the operating thesis without ornament.
                       Reads as a quiet break before the section grid
                       begins.  ───────── */}
        <Reveal duration={0.8} margin="-50px" className="mb-24">
          <p className="text-2xl md:text-3xl font-medium tracking-[-0.02em] leading-[1.35] text-tertiary italic max-w-3xl">
            The system that builds the system matters more than the
            system that ships this quarter.
          </p>
        </Reveal>

        {/* ───────── OPERATING PHILOSOPHY ─────────
            Replaces the bakery-anchored hour-by-hour timeline. Same
            spirit — discipline as design — recast as observed clauses
            rather than a schedule. The 'Quiet hours' tile is the only
            place the early-morning history surfaces, in one poetic line.
        */}
        <section className="mb-28">
          <Reveal duration={0.7}>
            <span className="text-[10px] sm:text-xs uppercase tracking-widest text-primary/40">
              Monk Mode
            </span>
            <h2 className="text-3xl md:text-4xl font-medium tracking-[-0.03em] text-primary mt-5 mb-12">
              The discipline is the design.
            </h2>
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

        {/* ───────── PRINCIPLES ─────────
            Same four content beats; visually upgraded with an ambient
            hover lift, a subtle inner cyan glow, and a hairline cyan
            top-rule that brightens on hover. No motion lib added —
            CSS transitions only, GPU-cheap, prefers-reduced-motion
            collapsed by the global guard. */}
        <section className="mb-28">
          <Reveal duration={0.7}>
            <span className="text-[10px] sm:text-xs uppercase tracking-widest text-primary/40">
              Principles
            </span>
            <h2 className="text-3xl md:text-4xl font-medium tracking-[-0.03em] text-primary mt-5 mb-12">
              Four rules I build by.
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {PRINCIPLES.map((p, i) => (
                <Reveal
                  key={p.label}
                  duration={0.6}
                  delay={i * 0.08}
                  y={16}
                  margin="-60px"
                >
                  <div className="group relative rounded-2xl liquid-glass p-7 flex flex-col gap-3 h-full transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-0.5">
                    {/* Hairline cyan rule at top — barely visible at rest,
                        steps up to ~40% on hover. Pure CSS via opacity
                        transition; no extra elements in the DOM beyond
                        this single ::before-style span. */}
                    <span
                      aria-hidden="true"
                      className="absolute inset-x-7 top-0 h-px bg-[#00d2ff]/20 opacity-30 transition-opacity duration-500 group-hover:opacity-90"
                    />
                    {/* Inner cyan glow on hover — opacity gated so idle
                        cards stay matte and only one card glows at a time. */}
                    <span
                      aria-hidden="true"
                      className="pointer-events-none absolute inset-0 rounded-2xl opacity-0 transition-opacity duration-500 group-hover:opacity-100"
                      style={{
                        boxShadow: "inset 0 0 32px rgba(0,210,255,0.06)",
                      }}
                    />
                    <span className="relative text-[#00d2ff]/60 text-xs font-mono tracking-wider">
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
                  className="liquid-glass rounded-2xl p-8 grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-10"
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
            GitHub heatmap retained; copy reframed. The new paragraph
            speaks to long-arc consistency rather than to suffering.
            "Some days are full ship-days, some are a single PR. Not
            every square is a win. Most are just showing up." */}
        <section className="mb-28">
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
            <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6 md:p-8 overflow-x-auto relative">
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
            Replaces the "Where this is going" section. Slightly more
            atmospheric framing, a quiet system pulse anchored to a
            real place and time zone, and the same two CTAs. The
            paragraph is half as long as the original and shifts from
            roadmap-prediction to a stance.  */}
        <section>
          <Reveal duration={0.8}>
            <span className="text-[10px] sm:text-xs uppercase tracking-widest text-primary/40">
              Closing transmission
            </span>
            <h2 className="text-4xl md:text-6xl font-medium tracking-[-0.04em] leading-[0.95] text-primary mt-5 mb-8">
              <span className="block">Building tools</span>
              <span className="block text-white/55">engineers actually use.</span>
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
              <span className="text-white/15">·</span>
              <span>Adana</span>
              <span className="text-white/15">·</span>
              <span>GMT+3</span>
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
                className="inline-flex items-center gap-2 rounded-full px-5 py-2.5 glass-panel text-sm font-medium text-primary/80 hover:text-primary transition-colors"
              >
                See the work
              </Link>
            </div>
          </Reveal>
        </section>
      </div>
    </main>
  );
}
