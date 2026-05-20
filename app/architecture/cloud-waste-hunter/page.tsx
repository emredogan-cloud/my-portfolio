import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import ScrollStory from "../_components/ScrollStory";
import ArchitectureTimelineSection from "../_components/ArchitectureTimelineSection";
import { MILESTONES } from "./_components/milestones";
import { ILLUSTRATION_BY_ID } from "./_components/Illustrations";
import CwhProCta from "@/components/cwh/CwhProCta";
import { getEvolutionEventsBySystem } from "@/lib/v5/temporal/registry";

const PROJECT_SLUG = "cloud-waste-hunter";

export const metadata: Metadata = {
  title: "Cloud Waste Hunter — Architecture",
  description:
    "Scroll-through of how Cloud Waste Hunter scans an AWS account, attributes cost via Glue + Athena over CUR 2.0, and streams Bedrock-backed remediation back to the dashboard.",
};

/**
 * /architecture/cloud-waste-hunter
 *
 * One project, eight milestones. Composes the project-agnostic
 * ScrollStory engine with this project's milestones data and SVG
 * illustration dispatch map.
 *
 * V5 Phase 7 Sub-PR 7.4 — inserts the optional timeline section
 * between the header and the ScrollStory. The section is opt-in
 * by viewport (visible only above 768px) and by registry coverage
 * (renders only when the project has at least two events). V4
 * behavior is preserved when either gate closes.
 */
export default function CWHArchitecturePage() {
  /* Registry slice for this project. Pure in-memory read; no
   * I/O, no KV. The page stays fully static. */
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
            Cloud Waste Hunter · Serverless FinOps
          </p>
          <h1 className="text-5xl md:text-7xl font-semibold tracking-[-0.04em] leading-[0.95] text-primary">
            How Cloud Waste Hunter works.
          </h1>
          <p className="text-tertiary text-lg leading-relaxed max-w-2xl">
            Eight steps, in order — from the moment a customer connects an
            AWS account to the moment a remediation lands in their inbox.
            Every step is a real piece of the production stack, not a
            sales diagram.
          </p>
        </header>

        {/* V5 Phase 7.4 — timeline scrubber (desktop only;
            renders null when projectEvents.length < 2). */}
        <ArchitectureTimelineSection
          slug={PROJECT_SLUG}
          events={projectEvents}
        />

        <ScrollStory
          milestones={MILESTONES}
          illustrationsById={ILLUSTRATION_BY_ID}
        />

        {/* End-of-story conversion surface. Same component used at
            the bottom of /projects/aws-waste-hunter. */}
        <CwhProCta />
      </div>
    </main>
  );
}
