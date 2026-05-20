import type { Metadata } from "next";
import type { LucideIcon } from "lucide-react";
import {
  Cloud,
  Code2,
  Server,
  Sparkles,
  Database,
  KeyRound,
  Activity,
} from "lucide-react";
import { Reveal } from "@/components/ui/Reveal";
import PageAtmosphere from "@/components/layout/PageAtmosphere";
import { TechCard } from "./_components/TechCard";
import StackLane from "./_components/StackLane";
import StackAccordion from "./_components/StackAccordion";
import CertificationRadar from "@/components/sections/CertificationRadar";

export const metadata: Metadata = {
  title: "Stack — Emre Doğan",
  description:
    "The tools, frameworks, and infrastructure I use to ship production-grade cloud, AI, and SaaS systems.",
};

interface Tech {
  name: string;
  role: string;
}

interface Category {
  id: string;
  index: string;
  title: string;
  intro: string;
  icon: LucideIcon;
  items: Tech[];
}

const STACK: Category[] = [
  {
    id: "cloud",
    index: "01",
    title: "Cloud & Infrastructure",
    intro:
      "The foundation. Provisioned as code, scaled by demand, observable end-to-end.",
    icon: Cloud,
    items: [
      { name: "AWS", role: "Cloud platform" },
      { name: "Terraform", role: "IaC, single source of truth" },
      { name: "AWS Lambda", role: "Serverless compute" },
      { name: "API Gateway", role: "REST + WebSocket edge" },
      { name: "CloudFront", role: "CDN + edge caching" },
      { name: "ECR", role: "Container registry" },
      { name: "Docker", role: "Lambda container images" },
      { name: "IAM", role: "Identity & access boundaries" },
      { name: "S3", role: "Object storage" },
    ],
  },
  {
    id: "application",
    index: "02",
    title: "Application Layer",
    intro:
      "Next.js App Router with RSC by default. TypeScript strict throughout the stack.",
    icon: Code2,
    items: [
      { name: "Next.js 16", role: "App Router, RSC, edge" },
      { name: "React 19", role: "UI primitives" },
      { name: "TypeScript", role: "Strict mode, no any" },
      { name: "Tailwind v4", role: "Utility-first styling" },
      { name: "motion/react", role: "Animation system" },
      { name: "Vercel", role: "Frontend hosting" },
    ],
  },
  {
    id: "backend",
    index: "03",
    title: "Backend & Services",
    intro:
      "Async Python on Lambda. Self-invoke patterns for long-running jobs. Function URLs for streaming.",
    icon: Server,
    items: [
      { name: "Python 3.11", role: "Service language" },
      { name: "FastAPI", role: "Async REST framework" },
      { name: "Mangum", role: "ASGI to Lambda adapter" },
      { name: "Node.js 20", role: "Lambda runtime + tooling" },
      { name: "ThreadPoolExecutor", role: "Regional fan-out scanning" },
    ],
  },
  {
    id: "ai",
    index: "04",
    title: "AI Systems",
    intro:
      "Claude on Bedrock for production reliability. Streaming patterns that bypass API Gateway timeouts.",
    icon: Sparkles,
    items: [
      { name: "Claude (Anthropic)", role: "Primary LLM" },
      { name: "AWS Bedrock", role: "Managed inference" },
      { name: "Anthropic SDK", role: "Direct API + streaming" },
      { name: "OpenAI SDK", role: "Comparison + fallback" },
      { name: "Google ML Kit", role: "On-device pose detection" },
    ],
  },
  {
    id: "data",
    index: "05",
    title: "Data & State",
    intro:
      "DynamoDB for app state, Postgres for relational, CUR + Athena for cost analytics.",
    icon: Database,
    items: [
      { name: "DynamoDB", role: "NoSQL primary" },
      { name: "PostgreSQL", role: "Relational, via Supabase" },
      { name: "Supabase", role: "Auth + Postgres + realtime" },
      { name: "AWS Glue", role: "ETL + crawlers" },
      { name: "Amazon Athena", role: "Serverless SQL on S3" },
      { name: "CUR 2.0", role: "Cost & usage data lake" },
    ],
  },
  {
    id: "identity",
    index: "06",
    title: "Identity & Commerce",
    intro:
      "User pools with social IdP, custom email Lambdas, and tax-handled subscription billing.",
    icon: KeyRound,
    items: [
      { name: "AWS Cognito", role: "User pools + Google IdP" },
      { name: "Clerk", role: "Drop-in auth" },
      { name: "Lemon Squeezy", role: "Subscriptions + global tax" },
      { name: "RevenueCat", role: "Mobile IAP" },
    ],
  },
  {
    id: "observability",
    index: "07",
    title: "Observability & DevOps",
    intro:
      "Sentry for errors, PostHog for funnels, GitHub Actions for everything else.",
    icon: Activity,
    items: [
      { name: "Sentry", role: "Error tracking + perf" },
      { name: "PostHog", role: "Product analytics" },
      { name: "CloudWatch", role: "AWS-native logs + metrics" },
      { name: "GitHub Actions", role: "CI/CD pipelines" },
    ],
  },
];

export default function StackPage() {
  if (process.env.NEXT_PUBLIC_V6_STACK_COMPRESSION === "1") {
    return <V6StackPage />;
  }
  return <LegacyStackPage />;
}

/* ──────────────────────────────────────────────────────────────
 *  V6 stack layout (Sub-PR 14.5 — Phase 14 closer)
 *
 *  Compresses the V5 vertical 7-section rhythm into a single
 *  composed grid:
 *
 *    Desktop (lg+):    4-col lane grid, 7 lanes fill 2 rows (4+3).
 *    Tablet (md):      2-col lane grid, 4 rows (2+2+2+1).
 *    Mobile (< md):    Single-column accordion via StackAccordion.
 *
 *  Each lane = one category. Category title at the top, tech items
 *  stacked beneath as mono rows (no chip containers). Mobile rows
 *  collapse to title-only by default; tap expands inline.
 *
 *  Certifications Radar moves from "section 08" inside the same
 *  page to its own tight micro-section at the bottom, separated
 *  from the compressed grid by a margin gap + hairline divider.
 *
 *  Spec ref: PORTFOLYO_V6_UI_EXECUTION_SYSTEM.md § Sub-PR 14.5.
 *  Audit ref: PORTFOLYO_V6_UI_AUDIT.md § 9.1 (7 identical category
 *             sections), § 9.2 (cert pulse pill out of place).
 * ────────────────────────────────────────────────────────────── */

function V6StackPage() {
  return (
    <main id="main" className="relative min-h-screen bg-black">
      <PageAtmosphere
        variant="lab"
        legacy={{
          primary: {
            color: "rgba(14,165,233,0.10)",
            position: "top-left",
            size: "lg",
          },
          secondary: {
            color: "rgba(147,51,234,0.08)",
            position: "bottom-right",
            size: "md",
          },
        }}
      />

      <div className="relative z-10 max-w-5xl mx-auto px-6 pt-36 pb-32">

        {/* ───────── HERO ───────── */}
        <Reveal mode="mount" duration={0.8} className="mb-20">
          <span className="text-[10px] sm:text-xs uppercase tracking-widest text-primary/40">
            The Stack
          </span>
          <h1 className="text-5xl md:text-7xl font-medium tracking-[-0.04em] leading-[0.95] text-primary mt-5">
            <span className="block">Tools I use</span>
            <span className="block text-tertiary">to ship production.</span>
          </h1>
          <p className="text-secondary max-w-2xl mt-8 text-base md:text-lg leading-relaxed">
            Every layer of this stack runs in production today — across cloud
            infrastructure, AI systems, billing, and observability. No
            speculative tooling. No frameworks I haven&apos;t deployed.
          </p>
        </Reveal>

        {/* ───────── COMPRESSED LANE GRID — md+ ─────────
            Tablet (md): 2-col. Desktop (lg+): 4-col. CSS Grid handles
            the row packing for 7 lanes; the last cell in the desktop
            row sits empty, the last row in tablet has 1 lane. */}
        <Reveal duration={0.7} margin="-60px" className="hidden md:block">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-12">
            {STACK.map((cat) => (
              <StackLane
                key={cat.id}
                index={cat.index}
                title={cat.title}
                icon={cat.icon}
                items={cat.items}
              />
            ))}
          </div>
        </Reveal>

        {/* ───────── MOBILE ACCORDION — < md ─────────
            Reduces 7 stacked sections to ~7 small tappable rows.
            Each row expands inline. SSR-deterministic. */}
        <Reveal duration={0.7} margin="-60px" className="md:hidden">
          <StackAccordion categories={STACK} />
        </Reveal>

        {/* ───────── CERTIFICATIONS — separate micro-section ─────────
            V6 § 9.2: the cert pulse pill section moves from "section 08
            inside the same page" to its own tight composition. The
            margin gap + the divider hairline give it visual separation
            from the compressed grid above. CertificationRadar's own
            mt-20 + pt-12 + border-t deliver the separator naturally. */}
        <CertificationRadar />

        {/* ───────── FOOTER NOTE ───────── */}
        <Reveal duration={0.7} margin="-50px" className="mt-24 pt-12 border-t border-white/[0.06]">
          <p className="text-tertiary text-sm leading-relaxed max-w-2xl">
            The list grows when there&apos;s a real problem to solve. It
            shrinks when something stops earning its complexity budget.
          </p>
        </Reveal>
      </div>
    </main>
  );
}

/* ──────────────────────────────────────────────────────────────
 *  Legacy stack layout (V5 baseline, rollback path)
 *
 *  Preserved verbatim from the pre-14.5 page body. When
 *  NEXT_PUBLIC_V6_STACK_COMPRESSION is off (default) the page
 *  renders through this branch — byte-identical to the V5 surface
 *  with 7 vertical category sections each containing a 2/3/4-col
 *  TechCard chip grid, followed by CertificationRadar, followed by
 *  the footer note.
 * ────────────────────────────────────────────────────────────── */

function LegacyStackPage() {
  return (
    <main id="main" className="relative min-h-screen bg-black">
      <PageAtmosphere
        variant="lab"
        legacy={{
          primary: {
            color: "rgba(14,165,233,0.10)",
            position: "top-left",
            size: "lg",
          },
          secondary: {
            color: "rgba(147,51,234,0.08)",
            position: "bottom-right",
            size: "md",
          },
        }}
      />

      <div className="relative z-10 max-w-5xl mx-auto px-6 pt-36 pb-32">

        {/* ───────── HERO ───────── */}
        <Reveal mode="mount" duration={0.8} className="mb-20">
          <span className="text-[10px] sm:text-xs uppercase tracking-widest text-primary/40">
            The Stack
          </span>
          <h1 className="text-5xl md:text-7xl font-medium tracking-[-0.04em] leading-[0.95] text-primary mt-5">
            <span className="block">Tools I use</span>
            <span className="block text-tertiary">to ship production.</span>
          </h1>
          <p className="text-secondary max-w-2xl mt-8 text-base md:text-lg leading-relaxed">
            Every layer of this stack runs in production today — across cloud
            infrastructure, AI systems, billing, and observability. No
            speculative tooling. No frameworks I haven&apos;t deployed.
          </p>
        </Reveal>

        {/* ───────── CATEGORIES ───────── */}
        <div className="space-y-20">
          {STACK.map((cat, catIdx) => {
            const Icon = cat.icon;
            return (
              <Reveal key={cat.id} duration={0.7}>
                {/* Category header — index, icon, title in one baseline row */}
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-quiet text-xs font-mono">
                    {cat.index}
                  </span>
                  <Icon
                    className="w-4 h-4 text-secondary"
                    strokeWidth={1.75}
                    aria-hidden="true"
                  />
                  <h2 className="text-2xl md:text-3xl font-medium tracking-[-0.02em] text-primary">
                    {cat.title}
                  </h2>
                </div>
                <p className="text-tertiary text-sm md:text-base leading-relaxed max-w-2xl mb-8">
                  {cat.intro}
                </p>

                {/* Tech grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                  {cat.items.map((tech, i) => (
                    <TechCard
                      key={tech.name}
                      tech={tech}
                      delay={(catIdx === 0 ? i : 0) * 0.04}
                    />
                  ))}
                </div>
              </Reveal>
            );
          })}
        </div>

        {/* ───────── CERTIFICATIONS & OBJECTIVES ───────── */}
        <CertificationRadar />

        {/* ───────── FOOTER NOTE ───────── */}
        <Reveal duration={0.7} margin="-50px" className="mt-24 pt-12 border-t border-white/[0.06]">
          <p className="text-tertiary text-sm leading-relaxed max-w-2xl">
            The list grows when there&apos;s a real problem to solve. It
            shrinks when something stops earning its complexity budget.
          </p>
        </Reveal>
      </div>
    </main>
  );
}
