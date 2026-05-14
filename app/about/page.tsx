import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Reveal } from "@/components/ui/Reveal";

export const metadata: Metadata = {
  title: "About — Emre Doğan",
  description:
    "19. Self-taught. Building production AWS infrastructure between 04:30 bakery shifts and high-school exams. Two years of Monk Mode.",
};

const PRINCIPLES = [
  {
    label: "01",
    title: "Production-first.",
    body: "Every system designed for real users from day one. No prototypes posing as products.",
  },
  {
    label: "02",
    title: "Infrastructure as code.",
    body: "Reproducible. Version-controlled. No console-clicked surprises in production.",
  },
  {
    label: "03",
    title: "Cost-aware engineering.",
    body: "Every architectural choice considers $/request. At scale, decisions compound.",
  },
  {
    label: "04",
    title: "AI as leverage.",
    body: "Augment with AI; never replace engineering rigor. Models hallucinate. Types don't.",
  },
] as const;

const SPECIALIZATIONS = [
  {
    title: "Cloud Architecture",
    body: "Production AWS infrastructure provisioned through Terraform. Multi-region patterns, IAM hardening, CUR-driven cost analytics, and cross-account scanning via STS AssumeRole. From single-VPC SaaS to platforms that operate inside customer accounts.",
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
    body: "LLM orchestration with Claude on AWS Bedrock. Streaming chat over Lambda Function URLs to bypass API Gateway timeouts, master-prompt engineering for autonomous agents, and structured remediation pipelines that ground model output in real data.",
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
    body: "End-to-end products. Auth, billing, scanning engines, observability. Lemon Squeezy + Cognito + Sentry + PostHog stack. Customers don't see infrastructure — they see outcomes, dashboards, and a Stripe-grade checkout flow.",
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
    title: "SixPack AI",
    role: "Lead Engineer",
    blurb:
      "Flutter fitness coach with real-time pose detection and AI voice guidance.",
  },
] as const;

const DAY_TIMELINE = [
  {
    time: "04:30",
    title: "Bakery shift begins.",
    detail:
      "Five mornings a week. Physical labor before the city wakes. The hardest hour of the day — done first.",
  },
  {
    time: "08:00",
    title: "High school.",
    detail:
      "Final year. Academics stay non-negotiable. Showing up rested means showing up sharp.",
  },
  {
    time: "16:00",
    title: "The build window opens.",
    detail:
      "AWS infrastructure. Terraform IaC. Claude orchestration. Production systems get shipped here.",
  },
  {
    time: "22:00",
    title: "Sleep. Repeat.",
    detail:
      "Two years of compound discipline. No bootcamp. No CS degree. Only relentless iteration.",
  },
] as const;

export default function AboutPage() {
  return (
    <main className="relative min-h-screen bg-black">
      {/* Ambient atmosphere */}
      <div
        className="pointer-events-none fixed inset-0 z-0"
        aria-hidden="true"
      >
        <div
          className="absolute top-[-200px] right-[-200px] w-[700px] h-[700px] rounded-full blur-[180px]"
          style={{
            background:
              "radial-gradient(ellipse, rgba(147,51,234,0.10) 0%, transparent 70%)",
          }}
        />
        <div
          className="absolute bottom-[-200px] left-[-100px] w-[600px] h-[600px] rounded-full blur-[160px]"
          style={{
            background:
              "radial-gradient(ellipse, rgba(14,165,233,0.08) 0%, transparent 70%)",
          }}
        />
      </div>

      <div className="relative z-10 max-w-5xl mx-auto px-6 pt-36 pb-32">

        {/* ───────── HERO ───────── */}
        <Reveal mode="mount" duration={0.8} className="mb-24">
          <span className="text-[10px] sm:text-xs uppercase tracking-widest text-primary/40">
            About
          </span>
          <h1 className="text-5xl md:text-7xl font-medium tracking-[-0.04em] leading-[0.95] text-primary mt-5">
            <span className="block">19. Self-taught.</span>
            <span className="block text-white/60">Monk Mode.</span>
          </h1>
          <p className="text-gray-400 max-w-2xl mt-8 text-base md:text-lg leading-relaxed">
            I&apos;m Emre Doğan — at 19, between 04:30 bakery shifts and
            high-school exams, I architect production-grade AWS infrastructure
            and ship AI-native SaaS products. No bootcamp. No CS degree.
            Just two years of compound discipline.
          </p>
        </Reveal>

        {/* ───────── MONK MODE TIMELINE ───────── */}
        <section className="mb-24">
          <Reveal duration={0.7}>
            <span className="text-[10px] sm:text-xs uppercase tracking-widest text-primary/40">
              Monk Mode
            </span>
            <h2 className="text-3xl md:text-4xl font-medium tracking-[-0.03em] text-primary mt-5 mb-12">
              A day in the discipline.
            </h2>
            <div className="divide-y divide-white/[0.06] border-y border-white/[0.06]">
              {DAY_TIMELINE.map((entry, i) => (
                <Reveal
                  key={entry.time}
                  duration={0.5}
                  delay={i * 0.08}
                  y={12}
                  margin="-40px"
                >
                  <div className="grid grid-cols-[72px_1fr] md:grid-cols-[140px_1fr] gap-5 md:gap-10 items-baseline py-6">
                    <span className="text-primary/40 text-sm md:text-base font-mono tracking-wider">
                      {entry.time}
                    </span>
                    <div>
                      <p className="text-primary font-medium text-base md:text-lg leading-snug">
                        {entry.title}
                      </p>
                      <p className="text-gray-500 text-xs md:text-sm leading-relaxed mt-1.5">
                        {entry.detail}
                      </p>
                    </div>
                  </div>
                </Reveal>
              ))}
            </div>
          </Reveal>
        </section>

        {/* ───────── PHILOSOPHY ───────── */}
        <section className="mb-24">
          <Reveal duration={0.7}>
            <span className="text-[10px] sm:text-xs uppercase tracking-widest text-primary/40">
              Engineering Philosophy
            </span>
            <h2 className="text-3xl md:text-4xl font-medium tracking-[-0.03em] text-primary mt-5 mb-12">
              Four principles I build by.
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {PRINCIPLES.map((p, i) => (
                <Reveal
                  key={p.label}
                  duration={0.6}
                  delay={i * 0.08}
                  y={16}
                  margin="-60px"
                  className="liquid-glass rounded-2xl p-6 flex flex-col gap-3"
                >
                  <span className="text-primary/30 text-xs font-mono">
                    {p.label}
                  </span>
                  <h3 className="text-primary font-medium text-lg leading-tight">
                    {p.title}
                  </h3>
                  <p className="text-gray-400 text-sm leading-relaxed">
                    {p.body}
                  </p>
                </Reveal>
              ))}
            </div>
          </Reveal>
        </section>

        {/* ───────── SPECIALIZATIONS ───────── */}
        <section className="mb-24">
          <Reveal duration={0.7}>
            <span className="text-[10px] sm:text-xs uppercase tracking-widest text-primary/40">
              Specializations
            </span>
            <h2 className="text-3xl md:text-4xl font-medium tracking-[-0.03em] text-primary mt-5 mb-12">
              Where my time goes.
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
                    <p className="text-gray-400 text-sm leading-relaxed">
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

        {/* ───────── FEATURED WORK ───────── */}
        <section className="mb-24">
          <Reveal duration={0.7}>
            <span className="text-[10px] sm:text-xs uppercase tracking-widest text-primary/40">
              Currently Building
            </span>
            <h2 className="text-3xl md:text-4xl font-medium tracking-[-0.03em] text-primary mt-5 mb-12">
              Active projects.
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
                      <div className="flex items-baseline gap-3 mb-1">
                        <h3 className="text-primary font-medium text-lg">
                          {p.title}
                        </h3>
                        <span className="text-white/40 text-xs font-mono">
                          {p.role}
                        </span>
                      </div>
                      <p className="text-gray-400 text-sm leading-relaxed">
                        {p.blurb}
                      </p>
                    </div>
                    <ArrowRight
                      className="w-4 h-4 text-primary/40 group-hover:text-primary transition-all duration-300 group-hover:translate-x-1 flex-shrink-0"
                      style={{ transform: "rotate(-45deg)" }}
                    />
                  </Link>
                </Reveal>
              ))}
            </div>
          </Reveal>
        </section>

        {/* ───────── VISION ───────── */}
        <section>
          <Reveal duration={0.8}>
            <span className="text-[10px] sm:text-xs uppercase tracking-widest text-primary/40">
              Where This Is Going
            </span>
            <h2 className="text-4xl md:text-6xl font-medium tracking-[-0.04em] leading-[0.95] text-primary mt-5 mb-8">
              <span className="block">Building tools</span>
              <span className="block text-white/60">engineers actually use.</span>
            </h2>
            <p className="text-gray-400 max-w-2xl text-base md:text-lg leading-relaxed">
              The next decade of cloud infrastructure won&apos;t be defined by
              bigger models or fancier dashboards. It will be defined by smaller,
              sharper systems that engineering teams can reason about — and by
              tools that treat operator time as the scarcest resource in the
              stack.
            </p>
            <p className="text-gray-400 max-w-2xl mt-4 text-base md:text-lg leading-relaxed">
              That&apos;s what I&apos;m building toward.
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
