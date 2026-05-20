import type { Metadata } from "next";
import Link from "next/link";
import { Reveal } from "@/components/ui/Reveal";
import PageAtmosphere from "@/components/layout/PageAtmosphere";
import Pill from "@/components/ui/Pill";
import VisitPing from "@/components/telemetry/VisitPing";
import {
  getRecentCommits,
  uniqueRepos,
  type ChangelogCommit,
} from "@/lib/github-events";
import { getSiteUrl } from "@/lib/site-url";

/**
 * V4 Phase 1 — Sub-PR 1.4: public engineering changelog.
 *
 * Mission (V4 § 5.1.4, FUTURE § 4.2): each commit visible as a WHY-
 * annotated card. Visitor reads it as "this is how the engineering
 * loop actually moves" — not a marketing roadmap, not a CHANGELOG.md
 * boilerplate. Same cinematic identity as /telemetry: hero in
 * /about's voice, calm card stack, hairline cyan rules.
 *
 * Caching contract (V4 § 5.1.4):
 *   - Page is ISR with revalidate = 1800 (30 min). KV-cached commit
 *     list (lib/github-events.ts) refreshes at the same cadence, so
 *     the page render and the cache layer rotate together.
 *   - Without KV in dev the page still works — lib/github-events
 *     falls through to a direct GitHub fetch.
 *
 * Performance budget (V4 § 5.1.4):
 *   - LCP < 1.5s. Static HTML between revalidations; 0 client JS for
 *     the data path. Hit comfortably.
 *
 * Filter surface: `/changelog?repo=<short-name>` narrows to one
 * project. Empty/unknown repo → show everything. Filter UI renders
 * server-side as <Link>s with preserved query state.
 */

export const revalidate = 1800;

const PAGE_TITLE = "Engineering changelog — Emre Doğan";
const PAGE_DESCRIPTION =
  "Every push, annotated. Public engineering log for the systems powering emredogan.com — Lumina, auto-tweet, telemetry, lumina-chat npm. No PR summaries, no marketing roadmap. The actual loop.";

interface ChangelogPageProps {
  searchParams: Promise<{ repo?: string }>;
}

export async function generateMetadata({
  searchParams,
}: ChangelogPageProps): Promise<Metadata> {
  const { repo } = await searchParams;
  const filtered = typeof repo === "string" && repo.length > 0;
  const title = filtered
    ? `Changelog · ${repo} — Emre Doğan`
    : PAGE_TITLE;
  const description = filtered
    ? `Public engineering log filtered to commits on ${repo}. Each push is rendered with the WHY paragraph from the commit body.`
    : PAGE_DESCRIPTION;
  /* Canonical URL — strip the repo filter from the canonical so
   * search engines settle on the unfiltered page as the source of
   * truth. Filtered views are still crawlable, just not canonical. */
  const canonical = `${getSiteUrl()}/changelog`;
  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      title,
      description,
      url: canonical,
      type: "website",
    },
    robots: {
      index: true,
      follow: true,
    },
  };
}

/**
 * Format a UTC ISO timestamp as a calm relative label, with an
 * absolute date for older commits. Same vocabulary as the
 * /telemetry "X ago" labels. Rounds generously so a 30-min-stale
 * page render doesn't read as misleading.
 */
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
  /* Older than a week — render the absolute UTC date. The relative
   * tail is just noise at that point. */
  return new Date(then).toISOString().slice(0, 10);
}

/**
 * Group commits by UTC day so the card stack reads as a journal
 * rather than a flat list. Returns ordered buckets newest-first.
 */
function groupByDay(commits: readonly ChangelogCommit[]): Array<{
  day: string;
  commits: ChangelogCommit[];
}> {
  const buckets = new Map<string, ChangelogCommit[]>();
  for (const c of commits) {
    const day = c.timestamp.slice(0, 10);
    if (!buckets.has(day)) buckets.set(day, []);
    buckets.get(day)!.push(c);
  }
  return Array.from(buckets.entries())
    .sort((a, b) => b[0].localeCompare(a[0]))
    .map(([day, items]) => ({ day, commits: items }));
}

export default async function ChangelogPage({
  searchParams,
}: ChangelogPageProps) {
  const { repo: repoParam } = await searchParams;
  const all = await getRecentCommits(50);
  const repos = uniqueRepos(all);

  const activeRepo =
    typeof repoParam === "string" && repos.includes(repoParam)
      ? repoParam
      : null;
  const filtered = activeRepo
    ? all.filter((c) => c.repo === activeRepo)
    : all;

  const grouped = groupByDay(filtered);

  /* Single render-time anchor for "X ago" math — same posture as
   * /telemetry. ISR means the page caches for 30 min; the relative
   * label can drift up to that interval and still read honestly. */
  // eslint-disable-next-line react-hooks/purity -- intentional: ISR snapshot timestamp
  const now = Date.now();

  return (
    <main id="main" className="relative min-h-screen bg-black">
      {/* Visit ping — render-once client island, posts a single
          /api/telemetry/visit POST on mount per tab session. */}
      <VisitPing surface="changelog" />

      {/* Ambient atmosphere — V6 11.1 typed variant.
          Operator: quadrant-anchored cyan hairlines. */}
      <PageAtmosphere variant="operator" />

      <div className="relative z-10 max-w-4xl mx-auto px-6 pt-36 pb-32">
        {/* HERO — same posture as /telemetry. Two-line statement
            + one paragraph framing. */}
        <Reveal mode="mount" duration={0.8} className="mb-16">
          <span className="text-[10px] sm:text-xs uppercase tracking-widest text-primary/40">
            Changelog
          </span>
          <h1 className="text-5xl md:text-7xl font-medium tracking-[-0.04em] leading-[0.95] text-primary mt-5">
            <span className="block">Every push,</span>
            <span className="block text-tertiary">annotated.</span>
          </h1>
          <p className="text-secondary max-w-2xl mt-8 text-base md:text-lg leading-relaxed">
            Public engineering log for the systems powering this
            site — Lumina, auto-tweet, telemetry, the lumina-chat
            npm package. Each card is one commit, with the WHY pulled
            from the body. Reverse chronological. Last 50.
          </p>
        </Reveal>

        {/* FILTER STRIP — mono pills, server-rendered <Link>s. No
            client JS needed; the page is ISR-cached per filter
            value via the searchParams key. */}
        {repos.length > 1 && (
          <Reveal duration={0.6} className="mb-12">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono uppercase tracking-[0.20em] text-[10px] text-quiet mr-1">
                Project
              </span>
              <Link href="/changelog">
                <Pill kind={activeRepo === null ? "filter-active" : "filter-inactive"}>
                  All
                </Pill>
              </Link>
              {repos.map((r) => {
                const active = activeRepo === r;
                return (
                  <Link key={r} href={`/changelog?repo=${encodeURIComponent(r)}`}>
                    <Pill kind={active ? "filter-active" : "filter-inactive"}>
                      {r}
                    </Pill>
                  </Link>
                );
              })}
            </div>
          </Reveal>
        )}

        {/* CARD STACK */}
        {grouped.length === 0 ? (
          <Reveal duration={0.7}>
            <div className="rounded-2xl border border-white/[0.06] bg-white/[0.018] p-8 text-center">
              <p className="text-tertiary text-[14.5px] leading-[1.85] max-w-xl mx-auto">
                {activeRepo
                  ? `No recent commits on ${activeRepo} in the GitHub events window.`
                  : "GitHub events feed is empty or unavailable right now. The cache will refresh on the next 30-minute revalidation."}
              </p>
            </div>
          </Reveal>
        ) : (
          /* V6 Sub-PR 15.2 signature: a vertical cyan spine that
             connects every day-bucket header to the next. When
             NEXT_PUBLIC_V6_OPERATOR_CHANGELOG is on, the section is
             wrapped in a left-padded container with an absolute
             cyan hairline running its full height; each day-bucket
             gets a small cyan dot anchored to the spine. The DNA
             (mono eyebrow + edge-lit cards + numbered ordering)
             is preserved — only the connective tissue changes. */
          <section
            className={
              process.env.NEXT_PUBLIC_V6_OPERATOR_CHANGELOG === "1"
                ? "relative space-y-12 pl-7"
                : "space-y-12"
            }
          >
            {process.env.NEXT_PUBLIC_V6_OPERATOR_CHANGELOG === "1" ? (
              <span
                aria-hidden="true"
                className="absolute left-1 top-3 bottom-3 w-px bg-[#00d2ff]/15"
              />
            ) : null}
            {grouped.map((bucket, bucketIdx) => (
              <Reveal
                key={bucket.day}
                duration={0.6}
                delay={bucketIdx * 0.04}
                y={12}
                margin="-60px"
              >
                <div className="relative flex items-baseline gap-4 mb-4">
                  {process.env.NEXT_PUBLIC_V6_OPERATOR_CHANGELOG === "1" ? (
                    <span
                      aria-hidden="true"
                      className="absolute -left-[27px] top-[6px] w-2.5 h-2.5 rounded-full bg-[#00d2ff] shadow-[0_0_0_3px_rgba(0,210,255,0.18)]"
                    />
                  ) : null}
                  <h2 className="font-mono uppercase tracking-[0.20em] text-[10px] text-[#00d2ff]/80">
                    {bucket.day}
                  </h2>
                  <span
                    aria-hidden="true"
                    className="flex-1 h-px bg-gradient-to-r from-white/[0.08] via-white/[0.04] to-transparent"
                  />
                  <span className="font-mono uppercase tracking-[0.20em] text-[9px] text-quiet">
                    {bucket.commits.length}{" "}
                    {bucket.commits.length === 1 ? "commit" : "commits"}
                  </span>
                </div>
                <div className="space-y-3">
                  {bucket.commits.map((c) => (
                    <article
                      key={c.fullSha}
                      className="group relative rounded-2xl border border-white/[0.06] bg-white/[0.018] p-5 md:p-6 transition-colors duration-500 hover:border-white/[0.10] hover:bg-white/[0.025]"
                    >
                      {/* Hairline cyan rule — same vocabulary as
                          /telemetry tiles and /about Principles. */}
                      <span
                        aria-hidden="true"
                        className="absolute inset-x-6 top-0 h-px bg-[#00d2ff]/20 opacity-30 transition-opacity duration-500 group-hover:opacity-90"
                      />
                      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 mb-2">
                        <span className="font-mono uppercase tracking-[0.18em] text-[10px] text-[#00d2ff]/80">
                          {c.repo}
                        </span>
                        {c.type && (
                          <span className="font-mono uppercase tracking-[0.16em] text-[9px] text-quiet">
                            {c.type}
                          </span>
                        )}
                        <Pill kind="timestamp" className="ml-auto">
                          {formatTimestamp(c.timestamp, now)}
                        </Pill>
                      </div>
                      <h3 className="text-primary font-medium text-[15.5px] md:text-base leading-snug tracking-[-0.01em]">
                        {c.subject}
                      </h3>
                      {c.why && (
                        <p className="text-tertiary text-[13.5px] md:text-sm leading-[1.75] mt-2.5">
                          {c.why}
                        </p>
                      )}
                      <div className="flex items-center justify-between gap-3 mt-4">
                        <a
                          href={c.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-mono text-[11px] text-tertiary hover:text-[#00d2ff]/90 transition-colors"
                        >
                          {c.sha}
                        </a>
                        <span className="font-mono uppercase tracking-[0.18em] text-[9px] text-faint">
                          {c.author}
                        </span>
                      </div>
                    </article>
                  ))}
                </div>
              </Reveal>
            ))}
          </section>
        )}

        {/* QUIET FOOTER — page-level provenance, same posture as
            /telemetry's bottom block. */}
        <Reveal duration={0.7}>
          <div className="border-t border-white/[0.05] pt-8 mt-16">
            <p className="text-tertiary text-sm md:text-base leading-relaxed max-w-2xl mb-4">
              Source: GitHub public events feed for{" "}
              <a
                href={`https://github.com/${"emredogan-cloud"}`}
                target="_blank"
                rel="noopener noreferrer"
                className="font-mono text-primary/80 hover:text-[#00d2ff]/90 transition-colors"
              >
                emredogan-cloud
              </a>
              . Refreshed every 30 minutes via Vercel KV cache.
              Conventional-commit type chips are parsed from each
              subject line; the WHY paragraph is the first block
              after the blank line in the commit body.
            </p>
            <p className="font-mono uppercase tracking-[0.20em] text-[10px] text-quiet">
              <span
                aria-hidden="true"
                className="inline-block w-1 h-1 rounded-full bg-[#00d2ff]/60 align-middle mr-2"
              />
              {filtered.length}{" "}
              {filtered.length === 1 ? "commit" : "commits"}
              {activeRepo ? <> · {activeRepo}</> : null} · Revalidates every 30m
            </p>
          </div>
        </Reveal>
      </div>
    </main>
  );
}
