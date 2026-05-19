import type { Metadata } from "next";
import Link from "next/link";

import VisitPing from "@/components/telemetry/VisitPing";
import { Reveal } from "@/components/ui/Reveal";
import { getSiteUrl } from "@/lib/site-url";
import {
  ADOPTION_BUCKETS,
  COGNITION_SIGNAL_BUCKETS,
  DWELL_TIME_BUCKETS,
  SCROLL_VELOCITY_BUCKETS,
  TAB_VISIBILITY_BUCKETS,
} from "@/lib/v5/perception/buckets";
import {
  PERCEPTION_CONSENT_COOKIE,
  PERCEPTION_CONSENT_TTL_DAYS,
  PERCEPTION_ENABLED_ENV,
} from "@/lib/v5/perception/consent";
import { readPerceptionSnapshot } from "@/lib/v5/perception/telemetry";

import OptInToggle from "@/app/v5/perception/_components/OptInToggle";

/**
 * V5 Phase 6 Sub-PR 6.1 — public transparency page for perception.
 *
 * V5 § 2.3 ("Public Transparency Disiplini" — sterner than V4)
 * mandates that every V5 surface ship with a public explanation
 * of HOW it works and WHY. The perception layer is a privacy-
 * sensitive ambient context system; that mandate is non-negotiable
 * here.
 *
 * Voice (V5 doc explicit):
 *   - calm
 *   - honest
 *   - technical
 *   - restrained
 *   NOT legalistic, corporate, or manipulative.
 *
 * The page reads as an operator console for the perception
 * subsystem: schema first, then privacy invariants, then opt-in
 * mechanism, then a live aggregate snapshot, then source links.
 *
 * Caching: 1h ISR — the page is near-static (the only changing
 * piece is the aggregate snapshot, and it doesn't need to be
 * second-fresh). Same cadence as /lumina/brain.
 */

export const revalidate = 3600;

const PAGE_TITLE = "Perception — ambient context layer | Emre Doğan";
const PAGE_DESCRIPTION =
  "Public transparency surface for the V5 perception layer. What this site quietly aggregates, what it never touches, how the opt-in works, and why this layer exists at all.";

export const metadata: Metadata = {
  title: PAGE_TITLE,
  description: PAGE_DESCRIPTION,
  alternates: { canonical: `${getSiteUrl()}/v5/perception` },
  openGraph: {
    title: PAGE_TITLE,
    description: PAGE_DESCRIPTION,
    url: `${getSiteUrl()}/v5/perception`,
    type: "website",
  },
  /* Indexable — the page IS the contract. Search visibility is
   * how the document earns its purpose. */
  robots: { index: true, follow: true },
};

const REPO_BASE =
  "https://github.com/emredogan-cloud/my-portfolio/blob/main";

interface CategoryRow {
  category: string;
  signal: string;
  buckets: readonly string[];
  detail: string;
}

const CATEGORY_ROWS: readonly CategoryRow[] = [
  {
    category: "scroll-velocity",
    signal: "How fast the page scrolls",
    buckets: SCROLL_VELOCITY_BUCKETS,
    detail:
      "Average pixels per second over a sampling window. Bucketed into four coarse states — idle, browsing, scanning, skimming. The raw px/s number is never persisted.",
  },
  {
    category: "dwell-time",
    signal: "How long a page is kept open",
    buckets: DWELL_TIME_BUCKETS,
    detail:
      "Wall-clock milliseconds between page open and page close, bucketed into six progressively wider slots. Granularity widens with time because a 12s vs 14s difference is meaningless and a 12s vs 4min difference is.",
  },
  {
    category: "tab-visibility",
    signal: "How long the tab spent backgrounded",
    buckets: TAB_VISIBILITY_BUCKETS,
    detail:
      "Time the visitor had this tab in the background between focus events. Three slots — short, medium, long. No record is kept of when the focus event fired.",
  },
  {
    category: "section-engagement",
    signal: "Which on-page section drew attention",
    buckets: ["(kebab-case section slug)"],
    detail:
      "Section identifiers as they appear in the page source (e.g. hero, projects, contact). The bucket IS the section name; no scroll position, no time spent in section, no order.",
  },
  {
    category: "navigation-flow",
    signal: "Which page-to-page transition fired",
    buckets: ["(from-slug>to-slug)"],
    detail:
      "Ordered pair of route slugs (e.g. home>about). Records the transition itself, not the visitor making it. Counts compose with one another into a Markov-shaped graph the operator can read; no individual visitor's path is reconstructible.",
  },
  {
    category: "cognition-signal",
    signal: "Inferred attention state at the moment of a navigation",
    buckets: COGNITION_SIGNAL_BUCKETS,
    detail:
      "A three-state qualitative bucket derived from the per-session page counter — arrival on first navigation, exploring through 2-4 routes, engaged from 5 onward. The state never regresses within a session and is computed entirely client-side; only the bucket label reaches the endpoint.",
  },
  {
    category: "adoption",
    signal: "Opt-in / revoke / deny events",
    buckets: ADOPTION_BUCKETS,
    detail:
      "The three states the consent decision can take. Recorded WITHOUT a prior consent gate because the decision IS the consent. The only events the layer is allowed to record before consent.",
  },
];

interface InvariantRow {
  label: string;
  detail: string;
}

const PRIVACY_INVARIANTS: readonly InvariantRow[] = [
  {
    label: "Aggregate-only",
    detail:
      "Every recorded event lands in a count keyed by a bucket label. The bucket is the level of detail the storage holds — nothing else. There is no per-visitor record, no session-scoped aggregate, no time-of-event field.",
  },
  {
    label: "No fingerprint",
    detail:
      "The endpoint reads no IP, no User-Agent, no Accept-Language, no Referer beyond what Vercel logs at the platform layer. The only header consulted is Cookie, and only the perception consent token within it.",
  },
  {
    label: "No identity persistence",
    detail:
      "No cross-session identifier is minted. The consent cookie expires after " +
      String(PERCEPTION_CONSENT_TTL_DAYS) +
      " days of inactivity. There is no linkage between this layer and the Lumina session memory (which is separately documented at /lumina/brain).",
  },
  {
    label: "Opt-in default-off",
    detail:
      "The subsystem is dark unless the operator has flipped " +
      PERCEPTION_ENABLED_ENV +
      "=1 AND the visitor has opted in via the toggle below. Either gate closed means no event records.",
  },
  {
    label: "No surfacing",
    detail:
      "Nothing about the visitor's perception data is ever shown back to that visitor. The layer is invisible by construction — its output is a public aggregate snapshot that anyone can read, not a personalised message the visitor receives.",
  },
  {
    label: "Graceful no-op",
    detail:
      "When KV is unavailable, every record helper returns silently and every read helper returns an empty object. The layer never blocks a page render or chat turn.",
  },
];

interface SourceLink {
  label: string;
  path: string;
  note: string;
}

const SOURCE_LINKS: readonly SourceLink[] = [
  {
    label: "Schema + buckets",
    path: "lib/v5/perception/buckets.ts",
    note: "Category allow-list, bucket allow-lists, and the raw → bucket helpers Phase 6.2+ observers will call.",
  },
  {
    label: "Consent resolution",
    path: "lib/v5/perception/consent.ts",
    note: "Env master switch + cookie + localStorage helpers. The single source of truth for whether the layer is allowed to record.",
  },
  {
    label: "KV record + read",
    path: "lib/v5/perception/telemetry.ts",
    note: "HINCRBY one bucket; HGETALL all six categories. Graceful no-op when KV is unavailable.",
  },
  {
    label: "Edge event endpoint",
    path: "app/api/v5/perception/event/route.ts",
    note: "POST { category, bucket }. Edge runtime, three gates (env / allow-list / consent), always 204.",
  },
  {
    label: "This page",
    path: "app/v5/perception/page.tsx",
    note: "The transparency surface itself. The verbatim text below lives in this file; the snapshot at the bottom is read from KV at ISR time.",
  },
];

export default async function V5PerceptionPage() {
  /* Read every category in parallel. KV-less environments resolve
   * to a fully-empty record; the snapshot section shows the
   * zero-state branch in that case. */
  const snapshot = await readPerceptionSnapshot();
  const snapshotIsEmpty = Object.values(snapshot).every(
    (cat) => Object.keys(cat).length === 0,
  );

  return (
    <main id="main" className="relative min-h-screen bg-black">
      {/* Ambient cyan atmosphere — same gradient stack as /lumina/brain
          and /playground. Visual continuity across V4 + V5 meta
          surfaces. */}
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

      <VisitPing surface="v5-perception" />

      <div className="relative z-10 max-w-3xl mx-auto px-6 pt-36 pb-32">
        {/* EYEBROW */}
        <Reveal mode="mount" duration={0.7} className="mb-7">
          <div className="flex items-center gap-3">
            <span className="font-mono uppercase tracking-[0.20em] text-[10px] text-tertiary">
              V5
            </span>
            <span
              aria-hidden="true"
              className="font-mono text-[10px] text-faint"
            >
              /
            </span>
            <span className="font-mono uppercase tracking-[0.20em] text-[10px] text-[#00d2ff]/80">
              Perception
            </span>
            <span
              className="ml-auto px-2.5 py-1 rounded-full border font-mono uppercase tracking-[0.18em] text-[9px] border-white/10 bg-white/[0.02] text-tertiary"
              title="Phase 6 — foundation surface. No observers ship in 6.1."
            >
              Phase 6 · foundation
            </span>
          </div>
        </Reveal>

        {/* HERO */}
        <Reveal mode="mount" duration={0.8} className="mb-12">
          <h1 className="text-4xl md:text-6xl font-medium tracking-[-0.04em] leading-[0.95] text-primary">
            <span className="block">Perception.</span>
            <span className="block text-white/55">
              Ambient context, never identity.
            </span>
          </h1>
          <p className="text-secondary max-w-2xl mt-7 text-base md:text-lg leading-relaxed">
            This page describes what the site quietly aggregates when a
            visitor opts in, what it never touches, and the contract
            the opt-in mechanism enforces. The layer is opt-in
            default-off, aggregate-only, and removable in one click.
            Phase 6.1 ships the foundation; observers land in
            subsequent sub-PRs and route every event through the
            schema documented below.
          </p>
        </Reveal>

        {/* OPT-IN */}
        <Reveal duration={0.7} className="mb-14">
          <h2 className="font-mono uppercase tracking-[0.20em] text-[11px] text-tertiary mb-5">
            01 · Your consent
          </h2>
          <p className="text-secondary text-sm leading-relaxed mb-5 max-w-2xl">
            The toggle below sets a same-origin cookie named{" "}
            <code className="font-mono text-[13px] text-primary">
              {PERCEPTION_CONSENT_COOKIE}
            </code>{" "}
            with a {PERCEPTION_CONSENT_TTL_DAYS}-day lifetime and a
            paired localStorage flag. The cookie is the single gate
            the edge endpoint checks; without it, any incoming event
            in any category other than &ldquo;adoption&rdquo; is
            dropped at the door without a KV write. Revoking clears
            both the cookie and the flag immediately.
          </p>
          <div className="border border-white/[0.06] rounded-xl bg-white/[0.02] p-5">
            <OptInToggle />
          </div>
        </Reveal>

        {/* WHAT IS COLLECTED */}
        <Reveal duration={0.7} className="mb-14">
          <h2 className="font-mono uppercase tracking-[0.20em] text-[11px] text-tertiary mb-5">
            02 · What can be collected
          </h2>
          <p className="text-secondary text-sm leading-relaxed mb-6 max-w-2xl">
            Six categories. Each one carries a closed set of bucket
            labels — the bucket is the level of detail the storage
            holds. Raw measurements (px/s, ms, scroll positions) are
            never persisted; the bucketization happens client-side
            before the event ever reaches the endpoint.
          </p>
          <ul className="space-y-5">
            {CATEGORY_ROWS.map((row) => (
              <li
                key={row.category}
                className="border border-white/[0.06] rounded-xl bg-white/[0.02] p-5"
              >
                <div className="flex items-baseline justify-between gap-3 mb-2">
                  <code className="font-mono text-[13px] text-[#00d2ff]/90">
                    {row.category}
                  </code>
                  <span className="font-mono uppercase tracking-[0.18em] text-[9px] text-tertiary text-right">
                    {row.signal}
                  </span>
                </div>
                <p className="text-secondary text-[13px] leading-relaxed mb-3">
                  {row.detail}
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {row.buckets.map((b) => (
                    <code
                      key={b}
                      className="font-mono text-[11px] text-primary border border-white/[0.06] bg-black/40 rounded px-2 py-1"
                    >
                      {b}
                    </code>
                  ))}
                </div>
              </li>
            ))}
          </ul>
        </Reveal>

        {/* WHAT IS NOT */}
        <Reveal duration={0.7} className="mb-14">
          <h2 className="font-mono uppercase tracking-[0.20em] text-[11px] text-tertiary mb-5">
            03 · What is never collected
          </h2>
          <ul className="space-y-3 text-secondary text-sm leading-relaxed list-disc list-inside marker:text-tertiary">
            <li>
              No IP address, no User-Agent, no Accept-Language, no
              Referer beyond what the platform logs at the edge.
            </li>
            <li>
              No mouse trails, no keystroke timings, no biometric-
              shaped signals. No session replay tooling.
            </li>
            <li>
              No identifier — anonymous or otherwise — minted by this
              layer. The Lumina session memory (separately documented
              at /lumina/brain) is the only place visitor state
              persists, and even that is anonymous + opt-out + 14-day
              TTL.
            </li>
            <li>
              No timestamp on individual events. The aggregate hash
              holds a count, not a sequence.
            </li>
            <li>
              No cross-device linking. No third-party trackers. No
              analytics SDK beyond Vercel Analytics, which itself is
              cookieless and IP-anonymised at the platform layer.
            </li>
          </ul>
        </Reveal>

        {/* PRIVACY INVARIANTS */}
        <Reveal duration={0.7} className="mb-14">
          <h2 className="font-mono uppercase tracking-[0.20em] text-[11px] text-tertiary mb-5">
            04 · Privacy invariants
          </h2>
          <dl className="divide-y divide-white/[0.06] border-t border-b border-white/[0.06]">
            {PRIVACY_INVARIANTS.map((row) => (
              <div
                key={row.label}
                className="grid grid-cols-1 md:grid-cols-[180px_1fr] gap-2 md:gap-6 py-4"
              >
                <dt className="font-mono uppercase tracking-[0.18em] text-[10px] text-tertiary">
                  {row.label}
                </dt>
                <dd className="text-secondary text-sm leading-relaxed">
                  {row.detail}
                </dd>
              </div>
            ))}
          </dl>
        </Reveal>

        {/* RETENTION + AGGREGATION */}
        <Reveal duration={0.7} className="mb-14">
          <h2 className="font-mono uppercase tracking-[0.20em] text-[11px] text-tertiary mb-5">
            05 · Retention &amp; aggregation
          </h2>
          <p className="text-secondary text-sm leading-relaxed mb-4 max-w-2xl">
            Aggregated counts live in six Vercel KV hashes — one per
            category. Each hash maps a bucket label to a count. There
            is no TTL on the hashes themselves; the counts are
            cumulative across the lifetime of the layer. The data
            persisted is, end-to-end, the count itself — nothing
            else.
          </p>
          <p className="text-secondary text-sm leading-relaxed mb-4 max-w-2xl">
            Aggregation is monotonically additive. The endpoint
            increments a single field by 1 per qualifying event;
            no other write shape exists. There is no decrement, no
            re-attribution, no per-visitor bucketing. Removing a
            visitor&apos;s contribution to the aggregate is
            mathematically impossible — but the aggregate also
            contains no reference to which contributions came from
            whom, which is the point.
          </p>
          <p className="text-secondary text-sm leading-relaxed max-w-2xl">
            The consent cookie expires after{" "}
            {PERCEPTION_CONSENT_TTL_DAYS} days of inactivity, at
            which point the visitor returns to the default-OFF state
            without action.
          </p>
        </Reveal>

        {/* SNAPSHOT */}
        <Reveal duration={0.7} className="mb-14">
          <h2 className="font-mono uppercase tracking-[0.20em] text-[11px] text-tertiary mb-5">
            06 · Live aggregate snapshot
          </h2>
          <p className="text-secondary text-sm leading-relaxed mb-5 max-w-2xl">
            Read from KV at this page&apos;s hourly ISR cadence. The
            number against each bucket is the cumulative count since
            the perception layer was first enabled. Empty categories
            below mean no event of that kind has been recorded yet —
            which, at 6.1 foundation time, is every category that
            isn&apos;t the consent decision itself.
          </p>
          {snapshotIsEmpty ? (
            <div className="font-mono text-[13px] text-tertiary border border-white/[0.06] rounded-xl p-6 bg-white/[0.02]">
              <p className="mb-2">
                <span className="text-[#00d2ff]/80">$</span> perception.snapshot
              </p>
              <p className="text-secondary">
                No events recorded yet.
              </p>
              <p className="text-tertiary mt-2">
                The subsystem is either dark ({PERCEPTION_ENABLED_ENV}{" "}
                unset), or no visitor has opted in since the layer
                began recording. Both are valid steady states for
                Phase 6.1.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {Object.entries(snapshot).map(([category, buckets]) => {
                const entries = Object.entries(buckets);
                if (entries.length === 0) return null;
                const total = entries.reduce((acc, [, n]) => acc + n, 0);
                return (
                  <div
                    key={category}
                    className="border border-white/[0.06] rounded-xl bg-white/[0.02] p-4"
                  >
                    <div className="flex items-baseline justify-between gap-3 mb-3">
                      <code className="font-mono text-[13px] text-[#00d2ff]/90">
                        {category}
                      </code>
                      <span className="font-mono uppercase tracking-[0.18em] text-[9px] text-tertiary">
                        total {total.toLocaleString("en-US")}
                      </span>
                    </div>
                    <dl className="grid grid-cols-2 md:grid-cols-3 gap-2">
                      {entries
                        .sort((a, b) => b[1] - a[1])
                        .map(([bucket, n]) => (
                          <div
                            key={bucket}
                            className="flex flex-col gap-0.5 rounded px-2 py-1.5 bg-white/[0.02] border border-white/[0.04]"
                          >
                            <dt className="font-mono text-[10px] text-tertiary truncate">
                              {bucket}
                            </dt>
                            <dd className="font-mono text-[12px] text-primary">
                              {n.toLocaleString("en-US")}
                            </dd>
                          </div>
                        ))}
                    </dl>
                  </div>
                );
              })}
            </div>
          )}
        </Reveal>

        {/* WHY */}
        <Reveal duration={0.7} className="mb-14">
          <h2 className="font-mono uppercase tracking-[0.20em] text-[11px] text-tertiary mb-5">
            07 · Why this exists
          </h2>
          <p className="text-secondary text-sm leading-relaxed mb-4 max-w-2xl">
            Subsequent V5 phases — temporal architecture playback,
            cinematic topology, operational digital twin — share a
            need to know the SHAPE of how visitors engage, not the
            identity of any one visitor. A page that loads fast for
            someone skimming should still feel cinematic for someone
            reading; the layer that distinguishes those modes is
            this one.
          </p>
          <p className="text-secondary text-sm leading-relaxed max-w-2xl">
            The site will never address the visitor about their
            perception data. There is no &ldquo;we noticed you spent
            8 minutes on architecture&rdquo; greeting, no &ldquo;your
            usual section&rdquo; section, no implicit profile. The
            opt-in is a contribution to the aggregate — nothing more.
          </p>
        </Reveal>

        {/* SOURCE LINKS */}
        <Reveal duration={0.7} className="mb-14">
          <h2 className="font-mono uppercase tracking-[0.20em] text-[11px] text-tertiary mb-5">
            08 · Source files
          </h2>
          <p className="text-secondary text-sm leading-relaxed mb-5 max-w-2xl">
            Every claim above is grounded in code. Click any row to
            read the file on GitHub.
          </p>
          <ul className="divide-y divide-white/[0.06] border-t border-b border-white/[0.06]">
            {SOURCE_LINKS.map((s) => (
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
                    <span className="text-secondary text-[13px] mt-1 block">
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
          <div className="border-t border-white/[0.05] pt-6 mt-12">
            <p className="font-mono uppercase tracking-[0.20em] text-[10px] text-quiet flex flex-wrap items-center gap-x-3 gap-y-1">
              <span
                aria-hidden="true"
                className="inline-block w-1 h-1 rounded-full bg-[#00d2ff]/70 align-middle"
              />
              <span>V5 · Phase 6 · Foundation</span>
              <span className="text-faint">·</span>
              <span>Opt-in default-off</span>
              <span className="text-faint">·</span>
              <span>Aggregate-only</span>
              <span className="text-faint">·</span>
              <span>Revocable in one click</span>
            </p>
          </div>
        </Reveal>
      </div>
    </main>
  );
}
