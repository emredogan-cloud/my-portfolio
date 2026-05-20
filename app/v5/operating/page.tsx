import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import VisitPing from "@/components/telemetry/VisitPing";
import { Reveal } from "@/components/ui/Reveal";
import PageAtmosphere from "@/components/layout/PageAtmosphere";
import { getSiteUrl } from "@/lib/site-url";
import { isOperatingTwinEnabled } from "@/lib/v5/operating/flags";
import type {
  InfrastructureStatus,
  PlannedItem,
} from "@/lib/v5/operating/schema";
import { composeOperationalSnapshot } from "@/lib/v5/operating/snapshot";

import OperatingSectionPing from "@/app/v5/operating/_components/OperatingSectionPing";

/**
 * V5 Phase 9 Sub-PR 9.2 — operational twin portrait.
 *
 * Renders the composed snapshot from Phase 9.1 in the
 * editorial layout V5 future § 3.1 specifies:
 *
 *   > Bu sayfa "dashboard" değil. **Portrait**. Visitor
 *   > okuduğunda "bu hafta neler oldu" değil; **"bu kişi
 *   > ne yapıyor"** hissini alır.
 *
 * Single gate
 *   `isOperatingTwinEnabled()` reads the
 *   `V5_OPERATING_TWIN_ENABLED` env var. Default OFF — the
 *   page returns 404 until the operator flips the flag +
 *   redeploys. Same dark-launch pattern as
 *   `V5_TOPOLOGY_RENDER_ENABLED` from Phase 8.3.
 *
 * ISR cadence
 *   `revalidate = 3600` (1 hour) — matches the composer's
 *   cache headers + V5 future § 3.1 "ISR 1h. Real-time poll
 *   yasak." The Server Component runs once per hour per
 *   deployment region; visitors share the same regenerated
 *   HTML.
 *
 * Voice (V5 future § 3.1 + user's Phase 9 brief)
 *   - "Portrait, not dashboard." Operator vocabulary, not
 *     analytics vocabulary.
 *   - No gauges, no charts, no sparklines, no real-time
 *     anything.
 *   - Section headers name the question, not the metric.
 *   - The five surfaces compose a coherent reading flow:
 *     what's happening (commits) → what's running (infra) →
 *     what's experimenting (lab/playground) → what's next
 *     (planned) → what broke (failures).
 *
 * SEO posture
 *   When the flag is OFF, the route returns 404 — no
 *   content leaks. The sitemap deliberately does NOT list
 *   /v5/operating (same posture as /v5/topology/<slug>);
 *   the operator can add the entry when the surface is
 *   permanently public.
 *
 * Telemetry
 *   - `VisitPing surface="operating"` fires the V4 visit
 *     counter (`v5:telemetry:operating-page:visits`).
 *   - Five `<OperatingSectionPing kind=...>` islands fire
 *     the V5 per-section inspection events
 *     (`v5:operating:adoption.section_*_inspected`) when
 *     each section enters the viewport.
 *
 * Performance posture
 *   - Page is `ƒ Dynamic` because of the flag check; ISR
 *     caches the rendered HTML for 1h per region.
 *   - Composer runs once per ISR regeneration: 1 GitHub API
 *     call + 8 parallel KV reads. Cold-cache LCP target:
 *     < 2.5s (well within V5 § 2.7).
 *   - 6 small client islands ship on the page (VisitPing +
 *     5 OperatingSectionPing). Total client JS: ~2 KB
 *     gzipped.
 */

export const revalidate = 3600;

const PAGE_TITLE = "Operating — what's actually happening | Emre Doğan";
const PAGE_DESCRIPTION =
  "The operational twin surface — what shipped this week, what's running, what's experimenting, what's planned, what broke. A portrait of the engineering life, not a dashboard.";

export async function generateMetadata(): Promise<Metadata> {
  if (!isOperatingTwinEnabled()) {
    return {
      title: "Not found",
      robots: { index: false, follow: false },
    };
  }
  const siteUrl = getSiteUrl();
  const ogImageUrl = `${siteUrl}/api/og/operating`;
  return {
    title: PAGE_TITLE,
    description: PAGE_DESCRIPTION,
    alternates: { canonical: `${siteUrl}/v5/operating` },
    openGraph: {
      title: PAGE_TITLE,
      description: PAGE_DESCRIPTION,
      url: `${siteUrl}/v5/operating`,
      type: "website",
      images: [
        {
          url: ogImageUrl,
          width: 1200,
          height: 675,
          alt: "Operational portrait — what shipped this week, what's running, what's planned, what corrections were recorded.",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: PAGE_TITLE,
      description: PAGE_DESCRIPTION,
      images: [ogImageUrl],
    },
    /* The page is operator-facing transparency; indexable
     * when the flag is on. */
    robots: { index: true, follow: true },
  };
}

const COMMIT_BASE = "https://github.com/emredogan-cloud/my-portfolio/commit";
const REPO_BASE = "https://github.com/emredogan-cloud/my-portfolio/blob/main";

interface SourceLink {
  label: string;
  path: string;
  note: string;
}

const SOURCE_LINKS: readonly SourceLink[] = [
  {
    label: "Snapshot composer",
    path: "lib/v5/operating/snapshot.ts",
    note: "Reads 4 data sources, runs 5 pure aggregators, returns the typed OperationalSnapshot. ISR 1h.",
  },
  {
    label: "Aggregators",
    path: "lib/v5/operating/aggregators.ts",
    note: "Pure functions per surface — weekly commits / active infrastructure / running experiments / planned next / recent failures.",
  },
  {
    label: "Schema",
    path: "lib/v5/operating/schema.ts",
    note: "5 typed surface shapes + the OperationalSnapshot composition.",
  },
  {
    label: "Planned next (data)",
    path: "data/v5/operating/planned.ts",
    note: "Hand-curated, append-only. No deadlines, no Gantt — honest editorial.",
  },
  {
    label: "JSON feed",
    path: "app/api/v5/operating/snapshot/route.ts",
    note: "Edge GET endpoint. Same snapshot the page renders, exposed for external tools (CLI, RSS, Slack bots).",
  },
  {
    label: "This page",
    path: "app/v5/operating/page.tsx",
    note: "Server Component, 1h ISR, editorial layout. Portrait, not dashboard.",
  },
];

const STATUS_PILL_CLASS: Record<InfrastructureStatus, string> = {
  active:
    "border-[#00d2ff]/40 bg-[#00d2ff]/[0.06] text-[#00d2ff]",
  dormant:
    "border-white/[0.12] bg-white/[0.02] text-secondary",
  archived: "border-white/[0.06] bg-transparent text-tertiary",
};

const PLANNED_STATUS_LABEL: Record<PlannedItem["status"], string> = {
  "in-progress": "in progress",
  "next-up": "next up",
  considering: "considering",
  draft: "draft",
};

const PLANNED_STATUS_PILL: Record<PlannedItem["status"], string> = {
  "in-progress":
    "border-[#00d2ff]/40 bg-[#00d2ff]/[0.06] text-[#00d2ff]",
  "next-up": "border-white/[0.15] bg-white/[0.04] text-primary",
  considering: "border-white/[0.10] bg-white/[0.02] text-secondary",
  draft: "border-white/[0.06] bg-transparent text-tertiary",
};

function formatTimestamp(iso: string, now: number): string {
  const then = new Date(iso).getTime();
  if (!Number.isFinite(then)) return "—";
  const deltaSec = Math.max(0, Math.round((now - then) / 1000));
  if (deltaSec < 60) return `${deltaSec}s ago`;
  const minutes = Math.round(deltaSec / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(then).toISOString().slice(0, 10);
}

export default async function OperatingPage() {
  /* Single gate: operator flag. */
  if (!isOperatingTwinEnabled()) {
    notFound();
  }

  const snapshot = await composeOperationalSnapshot();
  /* `snapshot.generated_at` is always a valid ISO timestamp
   * (the composer writes it from `new Date(now).toISOString()`).
   * No defensive fallback needed; using the snapshot timestamp
   * keeps the render deterministic for any given ISR
   * regeneration (no impure Date.now() in render). */
  const now = Date.parse(snapshot.generated_at);

  return (
    <main id="main" className="relative min-h-screen bg-black">
      {/* Ambient atmosphere — V6 11.1 typed variant.
          Operator: quadrant-anchored cyan hairlines. */}
      <PageAtmosphere variant="operator" />

      <VisitPing surface="operating" />

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
              Operating
            </span>
            <span
              className="ml-auto px-2.5 py-1 rounded-full border font-mono uppercase tracking-[0.18em] text-[9px] border-[#00d2ff]/30 bg-[#00d2ff]/[0.04] text-[#00d2ff]/80"
              title="Phase 9 — the operational twin. Portrait, not dashboard."
            >
              Phase 9 · portrait
            </span>
          </div>
        </Reveal>

        {/* HERO */}
        <Reveal mode="mount" duration={0.8} className="mb-12">
          <h1 className="text-4xl md:text-6xl font-medium tracking-[-0.04em] leading-[0.95] text-primary">
            <span className="block">Operating.</span>
            <span className="block text-white/55">
              What&apos;s actually happening underneath.
            </span>
          </h1>
          <p className="text-secondary max-w-2xl mt-7 text-base md:text-lg leading-relaxed">
            This is the operational twin. Five surfaces compose a
            portrait of the engineering life beneath the portfolio:
            what shipped this week, which production systems are
            alive, what&apos;s currently experimenting, what&apos;s
            planned next, and what corrections the platform has
            recorded recently. The data updates once an hour; no
            real-time gauges, no dashboard cosplay. Read it like
            an engineering notebook.
          </p>
          <p className="text-tertiary text-[13px] leading-relaxed mt-4 max-w-2xl">
            Snapshot generated{" "}
            <time
              dateTime={snapshot.generated_at}
              className="font-mono text-tertiary tabular-nums"
            >
              {snapshot.generated_at.slice(0, 19).replace("T", " ")} UTC
            </time>
            . Same JSON available at{" "}
            <Link
              href="/api/v5/operating/snapshot"
              className="text-[#00d2ff]/80 hover:text-[#00d2ff] underline underline-offset-2 decoration-white/15 hover:decoration-[#00d2ff]/50 transition-colors"
            >
              /api/v5/operating/snapshot
            </Link>
            .
          </p>
        </Reveal>

        {/* SECTION 01 — THIS WEEK SHIPPED */}
        <Reveal duration={0.7} className="mb-14">
          <OperatingSectionPing kind="section_weekly_inspected" />
          <h2 className="font-mono uppercase tracking-[0.20em] text-[11px] text-tertiary mb-5">
            01 · This week shipped
          </h2>
          <p className="text-secondary text-sm leading-relaxed mb-6 max-w-2xl">
            Every commit pushed in the last 7 days, newest first.
            The same source the public{" "}
            <Link
              href="/changelog"
              className="text-[#00d2ff]/80 hover:text-[#00d2ff] underline underline-offset-2 decoration-white/15 hover:decoration-[#00d2ff]/50 transition-colors"
            >
              /changelog
            </Link>{" "}
            reads, sliced to the recent window.
          </p>
          <div className="flex flex-wrap gap-x-6 gap-y-2 text-tertiary text-[12px] mb-6">
            <span>
              <span className="font-mono text-primary tabular-nums">
                {snapshot.weekly_commits.total_commits}
              </span>{" "}
              commits
            </span>
            <span>
              <span className="font-mono text-primary tabular-nums">
                {snapshot.weekly_commits.repos_touched}
              </span>{" "}
              repos touched
            </span>
            {Object.entries(snapshot.weekly_commits.by_type).map(
              ([type, count]) => (
                <span key={type}>
                  <code className="font-mono text-[12px] text-[#00d2ff]/80">
                    {type}
                  </code>{" "}
                  <span className="font-mono text-primary tabular-nums">
                    {count}
                  </span>
                </span>
              ),
            )}
          </div>
          {snapshot.weekly_commits.commits.length === 0 ? (
            <div className="font-mono text-[13px] text-tertiary border border-white/[0.06] rounded-xl p-6 bg-white/[0.02]">
              <p>No commits in the last 7 days.</p>
              <p className="text-tertiary mt-2">
                Either the GitHub events feed is unavailable, or the
                operator is in observation mode — both are valid
                steady states.
              </p>
            </div>
          ) : (
            <ul className="space-y-4">
              {snapshot.weekly_commits.commits.slice(0, 8).map((commit) => (
                <li
                  key={commit.sha}
                  className="border border-white/[0.06] rounded-xl bg-white/[0.02] p-5"
                >
                  <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 mb-2">
                    <code className="font-mono text-[11px] text-[#00d2ff]/80">
                      {commit.sha}
                    </code>
                    {commit.type ? (
                      <span className="font-mono uppercase tracking-[0.18em] text-[9px] text-tertiary">
                        {commit.type}
                      </span>
                    ) : null}
                    <time
                      dateTime={commit.timestamp}
                      className="ml-auto font-mono text-[11px] text-tertiary tabular-nums"
                    >
                      {formatTimestamp(commit.timestamp, now)}
                    </time>
                  </div>
                  <p className="text-primary text-[14px] leading-snug mb-2">
                    <Link
                      href={commit.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-[#00d2ff] transition-colors"
                    >
                      {commit.subject}
                    </Link>
                  </p>
                  {commit.why ? (
                    <p className="text-secondary text-[13px] leading-relaxed">
                      {commit.why}
                    </p>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </Reveal>

        {/* SECTION 02 — ACTIVE INFRASTRUCTURE */}
        <Reveal duration={0.7} className="mb-14">
          <OperatingSectionPing kind="section_infra_inspected" />
          <h2 className="font-mono uppercase tracking-[0.20em] text-[11px] text-tertiary mb-5">
            02 · Active infrastructure
          </h2>
          <p className="text-secondary text-sm leading-relaxed mb-6 max-w-2xl">
            Production systems the platform tracks. Status is
            derived from each system&apos;s last-seen telemetry
            timestamp: active (touched within 7 days), dormant
            (7-30 days), archived (older or no signal).
          </p>
          <div className="flex flex-wrap gap-x-4 gap-y-2 text-tertiary text-[12px] mb-6">
            <span>
              <span className="font-mono text-primary tabular-nums">
                {snapshot.active_infrastructure.by_status.active}
              </span>{" "}
              active
            </span>
            <span>
              <span className="font-mono text-primary tabular-nums">
                {snapshot.active_infrastructure.by_status.dormant}
              </span>{" "}
              dormant
            </span>
            <span>
              <span className="font-mono text-primary tabular-nums">
                {snapshot.active_infrastructure.by_status.archived}
              </span>{" "}
              archived
            </span>
          </div>
          <ul className="divide-y divide-white/[0.06] border-t border-b border-white/[0.06]">
            {snapshot.active_infrastructure.entries.map((entry) => (
              <li
                key={entry.id}
                className="py-4 grid grid-cols-1 md:grid-cols-[180px_1fr_120px] gap-2 md:gap-6"
              >
                <span className="font-mono uppercase tracking-[0.18em] text-[10px] text-tertiary md:self-start">
                  {entry.label}
                </span>
                <span>
                  <Link
                    href={entry.surface}
                    className="font-mono text-[13px] text-[#00d2ff]/90 hover:text-[#00d2ff] transition-colors"
                  >
                    {entry.surface}
                  </Link>
                  <span className="text-secondary text-[13px] mt-1 block leading-relaxed">
                    {entry.description}
                  </span>
                </span>
                <span className="flex items-center md:justify-end gap-2">
                  <span
                    className={`px-2 py-0.5 rounded-full border font-mono uppercase tracking-[0.18em] text-[9px] ${STATUS_PILL_CLASS[entry.status]}`}
                  >
                    {entry.status}
                  </span>
                  {entry.last_seen_at ? (
                    <time
                      dateTime={entry.last_seen_at}
                      className="font-mono text-[10px] text-tertiary tabular-nums"
                    >
                      {formatTimestamp(entry.last_seen_at, now)}
                    </time>
                  ) : (
                    <span className="font-mono text-[10px] text-tertiary">—</span>
                  )}
                </span>
              </li>
            ))}
          </ul>
        </Reveal>

        {/* SECTION 03 — RUNNING EXPERIMENTS */}
        <Reveal duration={0.7} className="mb-14">
          <OperatingSectionPing kind="section_experiments_inspected" />
          <h2 className="font-mono uppercase tracking-[0.20em] text-[11px] text-tertiary mb-5">
            03 · Running experiments
          </h2>
          <p className="text-secondary text-sm leading-relaxed mb-6 max-w-2xl">
            Live experimentation slots — the public lab (Bedrock-
            backed AI experiments) and the playground (capability-
            detected experimental surfaces). Each entry carries its
            host system + current lifecycle status.
          </p>
          <ul className="divide-y divide-white/[0.06] border-t border-b border-white/[0.06]">
            {snapshot.running_experiments.entries.map((entry) => (
              <li
                key={`${entry.host}-${entry.id}`}
                className="py-4 grid grid-cols-1 md:grid-cols-[180px_1fr_100px] gap-2 md:gap-6"
              >
                <span className="font-mono uppercase tracking-[0.18em] text-[10px] text-tertiary">
                  {entry.host} · {entry.label}
                </span>
                <span>
                  <Link
                    href={entry.surface}
                    className="font-mono text-[13px] text-[#00d2ff]/90 hover:text-[#00d2ff] transition-colors"
                  >
                    {entry.surface}
                  </Link>
                  <span className="text-secondary text-[13px] mt-1 block leading-relaxed">
                    {entry.description}
                  </span>
                </span>
                <span className="md:justify-end flex items-center">
                  <span className="font-mono uppercase tracking-[0.18em] text-[9px] text-tertiary px-2 py-0.5 rounded-full border border-white/[0.06]">
                    {entry.status}
                  </span>
                </span>
              </li>
            ))}
          </ul>
        </Reveal>

        {/* SECTION 04 — PLANNED NEXT */}
        <Reveal duration={0.7} className="mb-14">
          <OperatingSectionPing kind="section_planned_inspected" />
          <h2 className="font-mono uppercase tracking-[0.20em] text-[11px] text-tertiary mb-5">
            04 · Planned next
          </h2>
          <p className="text-secondary text-sm leading-relaxed mb-6 max-w-2xl">
            The operator&apos;s honest declaration of what&apos;s
            next. Hand-curated, append-only. No deadlines, no
            estimates — when an item ships, it moves to the{" "}
            <Link
              href="/evolution"
              className="text-[#00d2ff]/80 hover:text-[#00d2ff] underline underline-offset-2 decoration-white/15 hover:decoration-[#00d2ff]/50 transition-colors"
            >
              evolution archive
            </Link>{" "}
            as a real architectural event.
          </p>
          <ul className="space-y-4">
            {snapshot.planned_next.items.map((item) => (
              <li
                key={item.id}
                className="border border-white/[0.06] rounded-xl bg-white/[0.02] p-5"
              >
                <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 mb-3">
                  <h3 className="text-primary text-[15px] font-medium leading-snug">
                    {item.title}
                  </h3>
                  <span
                    className={`px-2 py-0.5 rounded-full border font-mono uppercase tracking-[0.18em] text-[9px] ${PLANNED_STATUS_PILL[item.status]}`}
                  >
                    {PLANNED_STATUS_LABEL[item.status]}
                  </span>
                </div>
                <p className="text-secondary text-[13px] leading-relaxed mb-3">
                  {item.description}
                </p>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-tertiary text-[11px]">
                  {item.context ? (
                    <code className="font-mono text-[11px] text-tertiary">
                      {item.context}
                    </code>
                  ) : null}
                  <time
                    dateTime={item.added}
                    className="font-mono tabular-nums ml-auto"
                  >
                    added {item.added}
                  </time>
                </div>
              </li>
            ))}
          </ul>
        </Reveal>

        {/* SECTION 05 — RECENT FAILURES */}
        <Reveal duration={0.7} className="mb-14">
          <OperatingSectionPing kind="section_failures_inspected" />
          <h2 className="font-mono uppercase tracking-[0.20em] text-[11px] text-tertiary mb-5">
            05 · Recent corrections
          </h2>
          <p className="text-secondary text-sm leading-relaxed mb-6 max-w-2xl">
            Most-recent slice of the public corrections log. The
            full archive lives at{" "}
            <Link
              href="/lumina/failures"
              className="text-[#00d2ff]/80 hover:text-[#00d2ff] underline underline-offset-2 decoration-white/15 hover:decoration-[#00d2ff]/50 transition-colors"
            >
              /lumina/failures
            </Link>
            .
          </p>
          {snapshot.recent_failures.entries.length === 0 ? (
            <p className="font-mono text-[13px] text-tertiary">
              No corrections recorded yet.
            </p>
          ) : (
            <ul className="space-y-4">
              {snapshot.recent_failures.entries.map((entry) => (
                <li
                  key={entry.id}
                  className="border border-white/[0.06] rounded-xl bg-white/[0.02] p-5"
                >
                  <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 mb-2">
                    <span className="font-mono uppercase tracking-[0.18em] text-[10px] text-[#00d2ff]/80">
                      {entry.category}
                    </span>
                    <time
                      dateTime={entry.date}
                      className="font-mono text-[11px] text-tertiary tabular-nums"
                    >
                      {entry.date}
                    </time>
                  </div>
                  <h3 className="text-primary text-[14px] leading-snug mb-2">
                    {entry.title}
                  </h3>
                  <p className="text-secondary text-[13px] leading-relaxed">
                    {entry.fix}
                  </p>
                  {entry.commitSha ? (
                    <p className="mt-2">
                      <Link
                        href={`${COMMIT_BASE}/${entry.commitSha}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-mono text-[10px] text-tertiary hover:text-[#00d2ff] transition-colors"
                      >
                        commit {entry.commitSha}
                      </Link>
                    </p>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
          <p className="text-tertiary text-[12px] leading-relaxed mt-5 max-w-2xl">
            Showing {snapshot.recent_failures.shown_count} of{" "}
            {snapshot.recent_failures.total_count} entries.
          </p>
        </Reveal>

        {/* SOURCE FILES */}
        <Reveal duration={0.7} className="mb-14">
          <h2 className="font-mono uppercase tracking-[0.20em] text-[11px] text-tertiary mb-5">
            06 · Source files
          </h2>
          <p className="text-secondary text-sm leading-relaxed mb-5 max-w-2xl">
            Every surface above is grounded in code. Click any row
            to read the file on GitHub.
          </p>
          <ul className="divide-y divide-white/[0.06] border-t border-b border-white/[0.06]">
            {SOURCE_LINKS.map((s) => (
              <li key={s.path}>
                <Link
                  href={`${REPO_BASE}/${s.path}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block py-4 grid grid-cols-1 md:grid-cols-[200px_1fr] gap-2 md:gap-6 hover:bg-white/[0.02] -mx-2 px-2 transition-colors rounded"
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
              <span>V5 · Phase 9 · Operational Digital Twin</span>
              <span className="text-faint">·</span>
              <span>Portrait, not dashboard</span>
              <span className="text-faint">·</span>
              <span>ISR 1h cadence</span>
            </p>
            <p className="text-tertiary text-[12px] leading-relaxed max-w-2xl">
              The data layer landed in Sub-PR 9.1 (the composer +
              the 5 aggregators + the JSON feed). Sub-PR 9.2
              mounts this editorial portrait on top. The living
              engineering journal (9.3) and the operational
              portrait OG card (9.4) compose from the same
              snapshot the page above renders.
            </p>
          </div>
        </Reveal>
      </div>
    </main>
  );
}
