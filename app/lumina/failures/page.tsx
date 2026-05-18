import type { Metadata } from "next";
import Link from "next/link";
import { Reveal } from "@/components/ui/Reveal";
import VisitPing from "@/components/telemetry/VisitPing";
import { getSiteUrl } from "@/lib/site-url";
import { LUMINA_FAILURES, type FailureCategory } from "@/data/lumina-failures";

/**
 * V4 Phase 4 — Sub-PR 4.1: Public corrections log.
 *
 * Sibling to /lumina/brain. The doc (V4 § 2.3) makes this surface
 * mandatory: every system on the platform keeps a public failure /
 * correction log. A portfolio that documents its own course-changes
 * reads as honest infrastructure — the opposite of marketing.
 *
 * Content lives in `data/lumina-failures.ts`. New entries land at
 * the top of that array; this page reads them in order. The log
 * is append-only by convention — a correction to a prior entry
 * lands as a new entry that references the old, never as an edit.
 *
 * Caching: hourly ISR. New corrections show up within an hour of
 * commit + deploy.
 */

export const revalidate = 3600;

const PAGE_TITLE = "Failures — Lumina's correction log | Emre Doğan";
const PAGE_DESCRIPTION =
  "Public corrections log for Lumina, the chat embedded across emredogan.com. Every documented mistake, root cause, and fix — append-only.";

export const metadata: Metadata = {
  title: PAGE_TITLE,
  description: PAGE_DESCRIPTION,
  alternates: { canonical: `${getSiteUrl()}/lumina/failures` },
  openGraph: {
    title: PAGE_TITLE,
    description: PAGE_DESCRIPTION,
    url: `${getSiteUrl()}/lumina/failures`,
    type: "website",
  },
  robots: { index: true, follow: true },
};

const CATEGORY_LABEL: Record<FailureCategory, string> = {
  "scope-judgment": "scope judgment",
  "voice-drift": "voice drift",
  "tool-output": "tool output",
  hallucination: "hallucination",
  "ux-misread": "ux misread",
  infrastructure: "infrastructure",
};

const REPO_BASE =
  "https://github.com/emredogan-cloud/my-portfolio/commit";

export default function LuminaFailuresPage() {
  const entries = LUMINA_FAILURES;
  const empty = entries.length === 0;

  return (
    <main id="main" className="relative min-h-screen bg-black">
      <div className="pointer-events-none fixed inset-0 z-0" aria-hidden="true">
        <div
          className="absolute top-[-200px] right-[-200px] w-[700px] h-[700px] rounded-full blur-[180px]"
          style={{ background: "radial-gradient(ellipse, rgba(0,210,255,0.07) 0%, transparent 70%)" }}
        />
        <div
          className="absolute bottom-[-200px] left-[-100px] w-[600px] h-[600px] rounded-full blur-[160px]"
          style={{ background: "radial-gradient(ellipse, rgba(0,210,255,0.04) 0%, transparent 70%)" }}
        />
      </div>

      <VisitPing surface="lumina-failures" />

      <div className="relative z-10 max-w-3xl mx-auto px-6 pt-36 pb-32">
        {/* HERO */}
        <Reveal mode="mount" duration={0.7} className="mb-7">
          <div className="flex items-center gap-3">
            <Link
              href="/lumina/brain"
              className="font-mono uppercase tracking-[0.20em] text-[10px] text-tertiary hover:text-secondary transition-colors"
            >
              Lumina
            </Link>
            <span aria-hidden="true" className="font-mono text-[10px] text-faint">/</span>
            <span className="font-mono uppercase tracking-[0.20em] text-[10px] text-[#00d2ff]/80">
              Failures
            </span>
            <Link
              href="/lumina/brain"
              className="ml-auto font-mono uppercase tracking-[0.18em] text-[10px] text-tertiary hover:text-secondary transition-colors"
            >
              ← Brain
            </Link>
          </div>
        </Reveal>

        <Reveal mode="mount" duration={0.8} className="mb-12">
          <h1 className="text-4xl md:text-6xl font-medium tracking-[-0.04em] leading-[0.95] text-primary">
            <span className="block">Failures.</span>
            <span className="block text-white/55">Documented, not hidden.</span>
          </h1>
          <p className="text-secondary max-w-2xl mt-7 text-base md:text-lg leading-relaxed">
            Every time Lumina — or the engineering loop that builds her —
            gets something wrong, the correction lands here. Append-only.
            The log is a brand-trust artifact: a portfolio that publishes
            its own course-changes reads as honest infrastructure, not a
            marketing surface.
          </p>
        </Reveal>

        {/* ENTRIES */}
        {empty ? (
          <Reveal duration={0.7}>
            <p className="text-secondary text-sm italic">
              No corrections logged yet. New entries will land here as
              the engineering loop ships them.
            </p>
          </Reveal>
        ) : (
          <Reveal duration={0.7} className="mb-14">
            <ul className="space-y-12">
              {entries.map((e, idx) => (
                <li key={e.id}>
                  <article className="border-t border-white/[0.06] pt-6">
                    {/* Header row — date, category pill, ordinal */}
                    <header className="flex items-center gap-3 mb-4 flex-wrap">
                      <span className="font-mono text-[11px] text-tertiary tracking-[0.10em]">
                        {e.date}
                      </span>
                      <span
                        className="px-2 py-0.5 rounded-full border border-white/[0.08] bg-white/[0.02] font-mono uppercase tracking-[0.16em] text-[9px] text-tertiary"
                      >
                        {CATEGORY_LABEL[e.category]}
                      </span>
                      <span className="ml-auto font-mono text-[10px] text-faint">
                        #{(entries.length - idx).toString().padStart(2, "0")}
                      </span>
                    </header>

                    <h2 className="text-xl md:text-2xl font-medium text-primary tracking-[-0.01em] leading-snug mb-5">
                      {e.title}
                    </h2>

                    <div className="space-y-5 text-secondary text-[15px] leading-relaxed">
                      <div>
                        <h3 className="font-mono uppercase tracking-[0.18em] text-[10px] text-[#00d2ff]/70 mb-2">
                          What
                        </h3>
                        <p>{e.what}</p>
                      </div>
                      <div>
                        <h3 className="font-mono uppercase tracking-[0.18em] text-[10px] text-[#00d2ff]/70 mb-2">
                          Why
                        </h3>
                        <p>{e.why}</p>
                      </div>
                      <div>
                        <h3 className="font-mono uppercase tracking-[0.18em] text-[10px] text-[#00d2ff]/70 mb-2">
                          Fix
                        </h3>
                        <p>{e.fix}</p>
                        {e.commitSha && (
                          <p className="mt-3">
                            <Link
                              href={`${REPO_BASE}/${e.commitSha}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-2 font-mono text-[12px] text-tertiary hover:text-[#00d2ff] transition-colors"
                            >
                              <span aria-hidden="true">↗</span>
                              <span>{e.commitSha}</span>
                            </Link>
                          </p>
                        )}
                      </div>
                    </div>
                  </article>
                </li>
              ))}
            </ul>
          </Reveal>
        )}

        {/* FOOTER */}
        <Reveal duration={0.7}>
          <div className="border-t border-white/[0.05] pt-6 mt-12">
            <p className="font-mono uppercase tracking-[0.20em] text-[10px] text-quiet flex flex-wrap items-center gap-x-3 gap-y-1">
              <span
                aria-hidden="true"
                className="inline-block w-1 h-1 rounded-full bg-[#00d2ff]/60 align-middle"
              />
              <span>Public corrections</span>
              <span className="text-faint">·</span>
              <span>V4 § 2.3</span>
              <span className="text-faint">·</span>
              <span>Append-only</span>
              <span className="text-faint">·</span>
              <Link
                href="/lumina/brain"
                className="text-tertiary hover:text-[#00d2ff] transition-colors"
              >
                ← Brain
              </Link>
            </p>
          </div>
        </Reveal>
      </div>
    </main>
  );
}
