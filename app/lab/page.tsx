import type { Metadata } from "next";
import Link from "next/link";
import { Reveal } from "@/components/ui/Reveal";
import { LAB_EXPERIMENTS } from "@/lib/lab/registry";
import { getSiteUrl } from "@/lib/site-url";

/**
 * `/lab` — public engineering laboratory index.
 *
 * V4 Phase 2 — Sub-PR 2.1.
 *
 * The user's lab philosophy: "private engineering notebook
 * opened slightly to the public." That phrase shapes every
 * decision below:
 *
 *   - NOT a SaaS dashboard. NOT a card grid. NOT a "featured
 *     experiment" carousel. Each entry is a typewriter-spaced
 *     row in a single column, indexed `01 / 02 / 03`.
 *   - Active rows link out. Coming-soon rows do NOT — no broken
 *     promises, no greyed-out CTAs. The text just sits there
 *     describing what's coming.
 *   - Visual rhythm matches /telemetry and /changelog so the
 *     three Phase 1/2 surfaces read as one site.
 *
 * Caching: there's no per-request data here — registry is a
 * literal in `lib/lab/registry`. Page is fully static.
 */

const PAGE_TITLE = "Lab — Emre Doğan";
const PAGE_DESCRIPTION =
  "Working notebook, opened slightly. Small focused engineering systems with real operational utility — IAM Translator, Prompt Rescuer, Commit Narrator. Source visible. Outputs honest.";

export const metadata: Metadata = {
  title: PAGE_TITLE,
  description: PAGE_DESCRIPTION,
  alternates: {
    canonical: `${getSiteUrl()}/lab`,
  },
  openGraph: {
    title: PAGE_TITLE,
    description: PAGE_DESCRIPTION,
    url: `${getSiteUrl()}/lab`,
    type: "website",
  },
  robots: { index: true, follow: true },
};

const STATUS_LABEL = {
  active: "active",
  "coming-soon": "coming soon",
  archived: "archived",
} as const;

const STATUS_PILL = {
  active: "border-[#00d2ff]/40 bg-[#00d2ff]/[0.05] text-[#00d2ff]/90",
  "coming-soon": "border-white/[0.08] bg-white/[0.02] text-tertiary",
  archived: "border-white/[0.08] bg-white/[0.02] text-quiet",
} as const;

export default function LabIndexPage() {
  return (
    <main id="main" className="relative min-h-screen bg-black">
      {/* Ambient atmosphere — same vocabulary as /telemetry,
          /changelog, /about. */}
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
              "radial-gradient(ellipse, rgba(0,210,255,0.04) 0%, transparent 70%)",
          }}
        />
      </div>

      <div className="relative z-10 max-w-3xl mx-auto px-6 pt-36 pb-32">
        {/* HERO */}
        <Reveal mode="mount" duration={0.8} className="mb-20">
          <span className="text-[10px] sm:text-xs uppercase tracking-widest text-primary/40">
            Lab
          </span>
          <h1 className="text-5xl md:text-7xl font-medium tracking-[-0.04em] leading-[0.95] text-primary mt-5">
            <span className="block">Working notebook,</span>
            <span className="block text-white/55">opened slightly.</span>
          </h1>
          <p className="text-secondary max-w-2xl mt-8 text-base md:text-lg leading-relaxed">
            Small focused engineering systems with real operational
            utility, exposed to the public as quietly as possible.
            Not all of them are live yet. The ones that fail will
            keep their pages — failure modes are part of the record.
          </p>
        </Reveal>

        {/* EXPERIMENT LIST — typewriter rows, one per registry
            entry. Active rows link to their experiment route;
            coming-soon rows render as plain blocks (no link, no
            hover state, no greyed-out CTA — the description
            speaks for itself). */}
        <section className="mb-20">
          <ol className="space-y-12 md:space-y-14">
            {LAB_EXPERIMENTS.map((exp, i) => {
              const isActive = exp.status === "active";
              const rowInner = (
                <div className="grid grid-cols-[56px_1fr_auto] md:grid-cols-[80px_1fr_auto] items-start gap-x-4 md:gap-x-6 gap-y-2">
                  {/* Index column */}
                  <span className="font-mono text-tertiary text-base md:text-lg pt-1">
                    {exp.index}
                  </span>
                  {/* Title + purpose */}
                  <div className="min-w-0">
                    <h2
                      className={`text-2xl md:text-3xl font-medium tracking-[-0.02em] leading-tight ${
                        isActive
                          ? "text-primary group-hover:text-[#00d2ff] transition-colors duration-500"
                          : "text-primary/70"
                      }`}
                    >
                      {exp.name}
                    </h2>
                    <p className="text-tertiary text-[14.5px] md:text-base leading-[1.75] mt-2.5 max-w-2xl">
                      {exp.purpose}
                    </p>
                  </div>
                  {/* Status pill */}
                  <span
                    className={`px-2.5 py-1 rounded-full border font-mono uppercase tracking-[0.18em] text-[9px] whitespace-nowrap ${
                      STATUS_PILL[exp.status]
                    }`}
                  >
                    {STATUS_LABEL[exp.status]}
                  </span>
                </div>
              );

              return (
                <Reveal
                  key={exp.slug}
                  duration={0.6}
                  delay={i * 0.06}
                  y={12}
                  margin="-60px"
                >
                  {isActive ? (
                    <Link
                      href={`/lab/${exp.slug}`}
                      className="group block"
                    >
                      {rowInner}
                    </Link>
                  ) : (
                    <li className="block list-none">{rowInner}</li>
                  )}
                </Reveal>
              );
            })}
          </ol>
        </section>

        {/* QUIET FOOTER — registry provenance + lab-wide notes. */}
        <Reveal duration={0.7}>
          <div className="border-t border-white/[0.05] pt-8 mt-8">
            <p className="text-tertiary text-sm md:text-base leading-relaxed max-w-2xl mb-4">
              Each experiment is rate-limited per IP and runs against
              a daily Bedrock budget. Streaming responses; nothing
              persists. Source for each experiment lives in this
              repository — the path is named on the experiment&apos;s
              page.
            </p>
            <p className="font-mono uppercase tracking-[0.20em] text-[10px] text-quiet flex flex-wrap items-center gap-x-3 gap-y-1">
              <span
                aria-hidden="true"
                className="inline-block w-1 h-1 rounded-full bg-[#00d2ff]/60 align-middle"
              />
              <span>
                {LAB_EXPERIMENTS.filter((e) => e.status === "active").length}{" "}
                active
              </span>
              <span className="text-faint">·</span>
              <span>
                {LAB_EXPERIMENTS.filter((e) => e.status === "coming-soon").length}{" "}
                coming soon
              </span>
              <span className="text-faint">·</span>
              <span>Adana · GMT+3</span>
            </p>
          </div>
        </Reveal>
      </div>
    </main>
  );
}
