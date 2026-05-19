import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import VisitPing from "@/components/telemetry/VisitPing";
import { Reveal } from "@/components/ui/Reveal";
import { getSiteUrl } from "@/lib/site-url";
import { isJournalEnabled } from "@/lib/v5/journal/flags";
import { listRecentJournalEntries } from "@/lib/v5/journal/storage";

import JournalAdoptionPing from "./_components/JournalAdoptionPing";

/**
 * V5 Phase 9 Sub-PR 9.3 — living engineering journal index.
 *
 * Renders the list of weekly journal entries the cron has
 * generated. Each row links to `/v5/journal/<week>` for the
 * full detail page.
 *
 * Gate
 *   `isJournalEnabled()` reads V5_JOURNAL_ENABLED. Default
 *   OFF — page returns 404 until the operator flips the
 *   flag + redeploys. Same dark-launch pattern as the rest
 *   of V5.
 *
 * ISR cadence
 *   `revalidate = 3600` (1h). The journal updates weekly
 *   when the cron fires; a 1h revalidate ensures the index
 *   surfaces new entries within an hour of the cron run.
 *   The detail pages are static once written (no revalidate
 *   needed past the initial generation).
 *
 * Voice
 *   The index is the operator's archive. Reads like a
 *   table of contents — week id + week range + the
 *   templated narrative + commit count. No dashboard
 *   widgets, no charts.
 *
 * Empty state
 *   When KV has no entries yet (first weeks after the
 *   cron is enabled, or KV unavailable), the page renders
 *   a calm empty state. Honest disclosure — no
 *   placeholder data.
 */

export const revalidate = 3600;

const PAGE_TITLE = "Engineering journal — weekly digest | Emre Doğan";
const PAGE_DESCRIPTION =
  "The living engineering journal. Once a week, the operational twin freezes its snapshot into a weekly digest entry. Each entry is what that week was.";

export async function generateMetadata(): Promise<Metadata> {
  if (!isJournalEnabled()) {
    return {
      title: "Not found",
      robots: { index: false, follow: false },
    };
  }
  return {
    title: PAGE_TITLE,
    description: PAGE_DESCRIPTION,
    alternates: { canonical: `${getSiteUrl()}/v5/journal` },
    openGraph: {
      title: PAGE_TITLE,
      description: PAGE_DESCRIPTION,
      url: `${getSiteUrl()}/v5/journal`,
      type: "website",
    },
    robots: { index: true, follow: true },
  };
}

const REPO_BASE = "https://github.com/emredogan-cloud/my-portfolio/blob/main";

export default async function JournalIndexPage() {
  if (!isJournalEnabled()) {
    notFound();
  }

  const entries = await listRecentJournalEntries(12);

  return (
    <main id="main" className="relative min-h-screen bg-black">
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

      <VisitPing surface="journal" />

      <div className="relative z-10 max-w-3xl mx-auto px-6 pt-36 pb-32">
        {/* EYEBROW */}
        <Reveal mode="mount" duration={0.7} className="mb-7">
          <div className="flex items-center gap-3">
            <span className="font-mono uppercase tracking-[0.20em] text-[10px] text-tertiary">
              V5
            </span>
            <span aria-hidden="true" className="font-mono text-[10px] text-faint">
              /
            </span>
            <span className="font-mono uppercase tracking-[0.20em] text-[10px] text-[#00d2ff]/80">
              Journal
            </span>
            <span
              className="ml-auto px-2.5 py-1 rounded-full border font-mono uppercase tracking-[0.18em] text-[9px] border-[#00d2ff]/30 bg-[#00d2ff]/[0.04] text-[#00d2ff]/80"
              title="Phase 9.3 — weekly journal entries auto-generated from the operational snapshot."
            >
              Phase 9 · journal
            </span>
          </div>
        </Reveal>

        {/* HERO */}
        <Reveal mode="mount" duration={0.8} className="mb-12">
          <h1 className="text-4xl md:text-6xl font-medium tracking-[-0.04em] leading-[0.95] text-primary">
            <span className="block">Journal.</span>
            <span className="block text-white/55">
              What each week was.
            </span>
          </h1>
          <p className="text-secondary max-w-2xl mt-7 text-base md:text-lg leading-relaxed">
            Each Monday at 03:00 UTC, a weekly digest is frozen
            from the operational twin&apos;s current state — last
            week&apos;s commits, the infrastructure status at
            that moment, the experiments that were running,
            what was planned, what corrections were recorded.
            Subsequent edits don&apos;t change the entry. The
            archive is what each week WAS, not a moving
            average.
          </p>
          <p className="text-tertiary text-[13px] leading-relaxed mt-4 max-w-2xl">
            The composer that feeds each weekly entry is the
            same one the live{" "}
            <Link
              href="/v5/operating"
              className="text-[#00d2ff]/80 hover:text-[#00d2ff] underline underline-offset-2 decoration-white/15 hover:decoration-[#00d2ff]/50 transition-colors"
            >
              /v5/operating
            </Link>{" "}
            portrait reads. The journal is the operational
            twin&apos;s archive across time.
          </p>
        </Reveal>

        {/* ENTRIES */}
        <Reveal duration={0.7} className="mb-14">
          <h2 className="font-mono uppercase tracking-[0.20em] text-[11px] text-tertiary mb-5">
            01 · Weekly entries
          </h2>
          {entries.length === 0 ? (
            <div className="font-mono text-[13px] text-tertiary border border-white/[0.06] rounded-xl p-6 bg-white/[0.02]">
              <p className="mb-2">
                <span className="text-[#00d2ff]/80">$</span>{" "}
                journal.entries
              </p>
              <p className="text-secondary">No entries yet.</p>
              <p className="text-tertiary mt-2">
                Either the weekly cron hasn&apos;t fired yet, or
                the journal storage is unavailable. The cron
                schedule is Monday 03:00 UTC; entries appear
                here within the hour of a successful run.
              </p>
            </div>
          ) : (
            <ul className="space-y-4">
              {entries.map((entry) => (
                <li
                  key={entry.week_id}
                  className="border border-white/[0.06] rounded-xl bg-white/[0.02] p-5 hover:bg-white/[0.03] transition-colors"
                >
                  <Link
                    href={`/v5/journal/${entry.week_id}`}
                    className="block"
                  >
                    <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 mb-3">
                      <span className="font-mono uppercase tracking-[0.18em] text-[10px] text-[#00d2ff]/80">
                        {entry.week_id}
                      </span>
                      <time
                        dateTime={entry.week_start}
                        className="font-mono text-[11px] text-tertiary tabular-nums"
                      >
                        {entry.week_start} → {entry.week_end}
                      </time>
                    </div>
                    <p className="text-secondary text-[14px] leading-relaxed mb-3">
                      {entry.narrative}
                    </p>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-tertiary text-[11px]">
                      <span>
                        <span className="font-mono text-primary tabular-nums">
                          {entry.weekly_summary.total_commits}
                        </span>{" "}
                        commits
                      </span>
                      <span>
                        <span className="font-mono text-primary tabular-nums">
                          {entry.infra_status_summary.active}
                        </span>{" "}
                        active
                      </span>
                      <span>
                        <span className="font-mono text-primary tabular-nums">
                          {entry.experiments_active.length}
                        </span>{" "}
                        experiments
                      </span>
                      {entry.recent_failures_added.length > 0 ? (
                        <span>
                          <span className="font-mono text-primary tabular-nums">
                            {entry.recent_failures_added.length}
                          </span>{" "}
                          correction{entry.recent_failures_added.length === 1 ? "" : "s"}
                        </span>
                      ) : null}
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Reveal>

        {/* SOURCE FILES */}
        <Reveal duration={0.7} className="mb-14">
          <h2 className="font-mono uppercase tracking-[0.20em] text-[11px] text-tertiary mb-5">
            02 · Source files
          </h2>
          <ul className="divide-y divide-white/[0.06] border-t border-b border-white/[0.06]">
            {[
              {
                label: "Generator",
                path: "lib/v5/journal/generator.ts",
                note: "Pure function from OperationalSnapshot → JournalEntry. Templated narrative (no LLM). Selects top 5 commits by why-paragraph length.",
              },
              {
                label: "Storage",
                path: "lib/v5/journal/storage.ts",
                note: "KV write + index helpers. Schema: v5:journal:entry:<week_id> + v5:journal:index.",
              },
              {
                label: "Cron",
                path: "app/api/cron/v5-journal/route.ts",
                note: "Vercel weekly cron (Monday 03:00 UTC). CRON_SECRET-gated. Reads snapshot → builds entry → writes to KV.",
              },
              {
                label: "Schema",
                path: "lib/v5/journal/schema.ts",
                note: "JournalEntry shape + ISO-week helpers (formatIsoWeek / weekIdToBounds / compareWeekIds).",
              },
            ].map((s) => (
              <li key={s.path}>
                <Link
                  href={`${REPO_BASE}/${s.path}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block py-4 grid grid-cols-1 md:grid-cols-[180px_1fr] gap-2 md:gap-6 hover:bg-white/[0.02] -mx-2 px-2 transition-colors rounded"
                >
                  <span className="font-mono uppercase tracking-[0.18em] text-[10px] text-tertiary">
                    {s.label}
                  </span>
                  <span>
                    <span className="font-mono text-[13px] text-[#00d2ff]/90 block">
                      {s.path}
                    </span>
                    <span className="text-secondary text-[13px] mt-1 block leading-relaxed">
                      {s.note}
                    </span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </Reveal>

        {/* FOOTER */}
        <Reveal duration={0.7}>
          <div className="border-t border-white/[0.05] pt-6 mt-12 space-y-3">
            <p className="font-mono uppercase tracking-[0.20em] text-[10px] text-quiet flex flex-wrap items-center gap-x-3 gap-y-1">
              <span
                aria-hidden="true"
                className="inline-block w-1 h-1 rounded-full bg-[#00d2ff]/70 align-middle"
              />
              <span>V5 · Phase 9 · Living engineering journal</span>
              <span className="text-faint">·</span>
              <span>Weekly cron, archival cadence</span>
              <span className="text-faint">·</span>
              <span>Templated, not LLM-narrated</span>
            </p>
            <p className="text-tertiary text-[12px] leading-relaxed max-w-2xl">
              Each weekly entry freezes the operational twin
              at the cron-firing moment. The narrative is
              composed from the data using deterministic
              string assembly — no Claude / Bedrock call ever
              touches the journal&apos;s path. Phase 9.4 will
              add the operational portrait OG card; the
              journal is its archive across time.
            </p>
          </div>
        </Reveal>

        {/* Adoption ping fires on initial render — once per
            session. */}
        <JournalAdoptionPing kind="index_view" />
      </div>
    </main>
  );
}
