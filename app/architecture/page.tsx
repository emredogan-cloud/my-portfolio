import type { Metadata } from "next";
import ScrollStory from "./_components/ScrollStory";

export const metadata: Metadata = {
  title: "Architecture — Cloud Waste Hunter",
  description:
    "A scroll-through of how Cloud Waste Hunter scans a customer's AWS account, attributes cost via Glue + Athena over CUR 2.0, and streams Bedrock-backed remediation back to the dashboard.",
};

/**
 * /architecture — Apple-style scrollytelling of the Cloud Waste
 * Hunter production architecture.
 *
 * Composition:
 *   <header>     Eyebrow + title + intro paragraph. Static SSR.
 *   <ScrollStory> Client component. SSR-renders the 8 milestone
 *                sections so crawlers + JS-disabled visitors see the
 *                content; hydrates with IntersectionObserver-driven
 *                background transitions and a sticky step indicator.
 */
export default function ArchitecturePage() {
  return (
    <main id="main" className="relative min-h-screen bg-black overflow-hidden">
      <div className="relative z-10 max-w-5xl mx-auto px-6 pt-36 pb-32">
        <header className="space-y-6">
          <p className="text-[10px] font-mono uppercase tracking-[0.22em] text-[#00d2ff]/80">
            Architecture
          </p>
          <h1 className="text-5xl md:text-7xl font-semibold tracking-[-0.04em] leading-[0.95] text-white">
            How Cloud Waste Hunter works.
          </h1>
          <p className="text-white/55 text-lg leading-relaxed max-w-2xl">
            Eight steps, in order — from the moment a customer connects an
            AWS account to the moment a remediation lands in their inbox.
            Every step is a real piece of the production stack, not a
            sales diagram.
          </p>
        </header>

        <ScrollStory />
      </div>
    </main>
  );
}
