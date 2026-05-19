import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import ScrollStory from "../_components/ScrollStory";
import ArchitectureTimelineSection from "../_components/ArchitectureTimelineSection";
import { MILESTONES } from "./_components/milestones";
import { ILLUSTRATION_BY_ID } from "./_components/Illustrations";
import { getEvolutionEventsBySystem } from "@/lib/v5/temporal/registry";

const PROJECT_SLUG = "sixpack-ai";

export const metadata: Metadata = {
  title: "FormAI — Architecture",
  description:
    "Four-step walkthrough of FormAI - Fitness Koçu: a Flutter native edge client, Google ML Kit pose detection at 30fps on-device, Supabase real-time sync, RevenueCat-fronted subscriptions.",
};

/**
 * /architecture/sixpack-ai
 *
 * Composes the shared ScrollStory engine with the FormAI-specific
 * milestones array and illustration dispatch map. (Route path keeps
 * the original "sixpack-ai" slug for stable URLs; only the display
 * name was rebranded to "FormAI - Fitness Koçu".)
 *
 * V5 Phase 7 Sub-PR 7.4 — inserts the optional timeline section
 * between the header and the ScrollStory. Currently renders null
 * (the project has fewer than 2 entries in the registry); the
 * code path is in place for the day editorial expansion crosses
 * the 2-event threshold.
 */
export default function SixPackArchitecturePage() {
  const projectEvents = getEvolutionEventsBySystem(PROJECT_SLUG);

  return (
    <main id="main" className="relative min-h-screen bg-black overflow-hidden">
      <div className="relative z-10 max-w-5xl mx-auto px-6 pt-36 pb-32">
        <header className="space-y-6">
          <Link
            href="/architecture"
            className="inline-flex items-center gap-2 text-white/40 hover:text-white/80 text-sm transition-colors duration-200 group"
          >
            <ArrowRight
              size={14}
              className="rotate-180 transition-transform duration-200 group-hover:-translate-x-0.5"
            />
            Architecture hub
          </Link>
          <p className="text-[10px] font-mono uppercase tracking-[0.22em] text-[#00d2ff]/80">
            FormAI — Fitness Koçu · Edge ML &amp; Mobile
          </p>
          <h1 className="text-5xl md:text-7xl font-semibold tracking-[-0.04em] leading-[0.95] text-white">
            How FormAI works.
          </h1>
          <p className="text-white/55 text-lg leading-relaxed max-w-2xl">
            The opposite of the cloud-first instinct. Real-time pose
            detection at 30 fps runs entirely on the device&apos;s NPU — the
            camera frame never leaves the phone. Four steps from Flutter
            client to RevenueCat-managed subscriptions, with only the
            metadata going to Supabase.
          </p>
        </header>

        {/* V5 Phase 7.4 — timeline scrubber (renders null until
            the registry carries at least 2 events for this slug). */}
        <ArchitectureTimelineSection
          slug={PROJECT_SLUG}
          events={projectEvents}
        />

        <ScrollStory
          milestones={MILESTONES}
          illustrationsById={ILLUSTRATION_BY_ID}
        />
      </div>
    </main>
  );
}
