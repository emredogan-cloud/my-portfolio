import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Architecture — Cloud Waste Hunter",
  description:
    "A scroll-through of how Cloud Waste Hunter scans a customer's AWS account, attributes cost via Glue + Athena over CUR 2.0, and streams Bedrock-backed remediation back to the dashboard.",
};

/**
 * /architecture — Apple-style scrollytelling of the Cloud Waste
 * Hunter production architecture.
 *
 * Phase 3 / Sub-PR 2 scaffold. This commit lays the static structure
 * (heading, ambient background, semantic milestone list) so the page
 * is fully indexable and accessible BEFORE the client scroll engine
 * lands in Step 2. Crawlers and reduced-motion visitors will see a
 * plain ordered list of the 8 milestones; the interactive layer
 * arrives next commit.
 */
export default function ArchitecturePage() {
  return (
    <main id="main" className="relative min-h-screen bg-black overflow-hidden">
      {/* Ambient atmosphere — same vocabulary as the project pages. */}
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

        {/* Static, server-rendered milestone list. This is the
            crawlable + screen-reader-accessible spine of the page;
            Step 2 (the next commit) will mount an interactive
            ScrollStory client component on top of this fallback. */}
        <ol className="mt-16 list-decimal list-inside space-y-4 text-white/70 text-sm leading-relaxed">
          <li>Visitor signs up via AWS Cognito.</li>
          <li>Connects their AWS account via STS AssumeRole.</li>
          <li>The Lambda scanner triggers and inventories resources.</li>
          <li>A ThreadPoolExecutor fans out scans across every region.</li>
          <li>Findings are stored in six DynamoDB tables.</li>
          <li>Claude 3.5 Haiku on Bedrock generates remediation.</li>
          <li>The user sees the dashboard with quantified savings.</li>
          <li>EventBridge re-runs the scan on a recurring schedule.</li>
        </ol>

        <p className="mt-16 text-[11px] uppercase tracking-[0.18em] text-white/30">
          Scroll story coming next commit.
        </p>
      </div>
    </main>
  );
}
