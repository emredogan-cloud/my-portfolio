import type { Metadata } from "next";
import ArchitectureHubGrid, {
  type HubEntry,
} from "./_components/ArchitectureHubGrid";

export const metadata: Metadata = {
  title: "Architecture",
  description:
    "Five production systems, five architectures. Scroll-through walkthroughs of Cloud Waste Hunter (serverless FinOps), VibingCoderAI (LLM agent infrastructure), and FormAI — Fitness Koçu (edge ML on mobile). PawDoc and Aevum architectures in development.",
};

const ENTRIES: readonly HubEntry[] = [
  {
    slug: "cloud-waste-hunter",
    eyebrow: "Serverless FinOps",
    title: "Cloud Waste Hunter",
    tagline:
      "Cross-account AWS scanning, CUR 2.0 cost attribution, Bedrock-streamed remediation. The loop is the product.",
    stack: ["AWS Lambda", "DynamoDB", "Bedrock", "Glue + Athena"],
    state: "ready",
  },
  {
    slug: "vibing-coder-ai",
    eyebrow: "LLM Agent Architecture",
    title: "VibingCoderAI",
    tagline:
      "Casual developer ideas in, senior-grade AI agent briefs out. A decoupled monorepo: Next.js frontend, Lambda brain, Terraform under everything.",
    stack: ["Next.js 16", "Anthropic SDK", "AWS Lambda", "Terraform"],
    state: "ready",
  },
  {
    slug: "sixpack-ai",
    eyebrow: "Edge ML & Mobile",
    title: "FormAI — Fitness Koçu",
    tagline:
      "Real-time pose detection at 30 fps on the device's NPU. The best cloud architecture is sometimes knowing when not to use the cloud.",
    stack: ["Flutter 3.22", "Google ML Kit", "Supabase", "RevenueCat"],
    state: "ready",
  },
  {
    slug: "pawdoc",
    eyebrow: "Multimodal Pet Triage",
    title: "PawDoc",
    tagline:
      "Computer vision + multimodal LLM scoring assessing pet symptoms against a structured veterinary triage framework. Built around 'monitor at home' vs 'go to the clinic now'.",
    stack: ["React Native", "Computer Vision", "Multimodal AI", "Node.js"],
    state: "in-development",
  },
  {
    slug: "aevum",
    eyebrow: "Eldercare Coordination",
    title: "Aevum",
    tagline:
      "Unified operating system for adult children managing aging parents. Medications, appointments, insurance, family hand-off — one AI-generated daily briefing.",
    stack: ["React Native", "AI Briefings", "Healthcare APIs", "Node.js"],
    state: "concept",
  },
] as const;

/**
 * /architecture
 *
 * The hub. Three cards, three production systems, three different
 * architectural shapes. Each card navigates to a project-scoped
 * /architecture/{slug} scroll story.
 *
 * The point of putting these side-by-side is to make Emre's range
 * visible at a glance — visitors can pick the discipline (cloud,
 * AI, mobile) they care about and dive deep on that one.
 *
 * Server Component — the page is fully static, no client state.
 */
export default function ArchitectureHubPage() {
  return (
    <main id="main" className="relative min-h-screen bg-black overflow-hidden">
      {/* Ambient atmosphere matching the project hub pages. */}
      <div
        className="pointer-events-none fixed inset-0 z-0"
        aria-hidden="true"
      >
        <div
          className="absolute top-[-180px] right-[-180px] w-[760px] h-[760px] rounded-full blur-[200px]"
          style={{
            background:
              "radial-gradient(ellipse, rgba(0,210,255,0.14) 0%, transparent 70%)",
          }}
        />
        <div
          className="absolute bottom-[-220px] left-[-120px] w-[640px] h-[640px] rounded-full blur-[180px]"
          style={{
            background:
              "radial-gradient(ellipse, rgba(11,37,81,0.20) 0%, transparent 70%)",
          }}
        />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-6 pt-36 pb-32">
        <header className="space-y-6 max-w-3xl">
          <p className="text-[10px] font-mono uppercase tracking-[0.22em] text-[#00d2ff]/80">
            Architecture
          </p>
          <h1 className="text-5xl md:text-7xl font-semibold tracking-[-0.04em] leading-[0.95] text-white">
            Five systems.
            <br />
            Five architectures.
          </h1>
          <p className="text-white/55 text-lg leading-relaxed">
            Pick a project to walk through. Each one is a different
            discipline — serverless cloud, an LLM agent stack, edge ML
            on mobile, multimodal triage, eldercare coordination. The
            top three carry full scroll-throughs today; PawDoc and
            Aevum are drafting.
          </p>
        </header>

        <div className="mt-20">
          <ArchitectureHubGrid entries={ENTRIES} />
        </div>
      </div>
    </main>
  );
}
