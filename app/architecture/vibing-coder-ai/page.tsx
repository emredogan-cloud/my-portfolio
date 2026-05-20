import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import ScrollStory from "../_components/ScrollStory";
import ArchitectureTimelineSection from "../_components/ArchitectureTimelineSection";
import { MILESTONES } from "./_components/milestones";
import { ILLUSTRATION_BY_ID } from "./_components/Illustrations";
import { getEvolutionEventsBySystem } from "@/lib/v5/temporal/registry";

const PROJECT_SLUG = "vibing-coder-ai";

export const metadata: Metadata = {
  title: "VibingCoderAI — Architecture",
  description:
    "Four-step walkthrough of VibingCoderAI: a Next.js 16 interface, an AWS Lambda + Anthropic Claude brain, a Terraform-provisioned decoupled monorepo, DynamoDB persistence.",
};

/**
 * /architecture/vibing-coder-ai
 *
 * Composes the shared ScrollStory engine with the VCAI-specific
 * milestones array and illustration dispatch map.
 *
 * V5 Phase 7 Sub-PR 7.4 — inserts the optional timeline section
 * between the header and the ScrollStory. Currently renders null
 * (the project has fewer than 2 entries in the registry); the
 * code path is in place for the day editorial expansion crosses
 * the 2-event threshold.
 */
export default function VCAIArchitecturePage() {
  const projectEvents = getEvolutionEventsBySystem(PROJECT_SLUG);

  return (
    <main id="main" className="relative min-h-screen bg-black overflow-hidden">
      <div className="relative z-10 max-w-5xl mx-auto px-6 pt-36 pb-32">
        <header className="space-y-6">
          <Link
            href="/architecture"
            className="inline-flex items-center gap-2 text-tertiary hover:text-primary text-sm transition-colors duration-200 group"
          >
            <ArrowRight
              size={14}
              className="rotate-180 transition-transform duration-200 group-hover:-translate-x-0.5"
            />
            Architecture hub
          </Link>
          <p className="text-[10px] font-mono uppercase tracking-[0.22em] text-[#00d2ff]/80">
            VibingCoderAI · LLM Agent Architecture
          </p>
          <h1 className="text-5xl md:text-7xl font-semibold tracking-[-0.04em] leading-[0.95] text-primary">
            How VibingCoderAI works.
          </h1>
          <p className="text-tertiary text-lg leading-relaxed max-w-2xl">
            A casual developer idea goes in. A senior-grade AI agent brief
            comes out. Four steps from a Vercel-hosted Next.js frontend to
            a Claude-powered Lambda brain — entirely provisioned in
            Terraform, no console-clicked resources in the stack.
          </p>
        </header>

        {/* V5 Phase 7.4 — timeline scrubber (renders null until
            the registry carries at least 2 events for this slug). */}
        <ArchitectureTimelineSection
          slug={PROJECT_SLUG}
          events={projectEvents}
        />

        {/* V6 14.3 — VCA's LLM-agent architecture benefits from a
            wider illustration column. The engine inverts the V5 7/5
            ratio to 5/7 when `variant="wide-illustration"` AND the
            V6_ARCH_VARIANTS flag is on. With the flag off the engine
            renders the V5 byte-identical 7/5 default. */}
        <ScrollStory
          milestones={MILESTONES}
          illustrationsById={ILLUSTRATION_BY_ID}
          variant="wide-illustration"
        />
      </div>
    </main>
  );
}
