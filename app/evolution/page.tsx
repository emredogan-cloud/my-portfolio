import type { Metadata } from "next";
import Link from "next/link";

import AdoptionBeacon from "@/app/evolution/_components/AdoptionBeacon";
import VisitPing from "@/components/telemetry/VisitPing";
import { Reveal } from "@/components/ui/Reveal";
import TimelineSlider from "@/components/v5/TimelineSlider";
import { getSiteUrl } from "@/lib/site-url";
import {
  getEvolutionEvents,
  getEvolutionEventsByCategory,
  summariseEvolutionRegistry,
} from "@/lib/v5/temporal/registry";
import { readPlaybackAdoption } from "@/lib/v5/temporal/playback-telemetry";
import {
  type EvolutionEvent,
  type EvolutionEventCategory,
  type EvolutionEventRef,
  EVOLUTION_EVENT_CATEGORIES,
  isEvolutionEventCategory,
} from "@/lib/v5/temporal/schema";
import { readTemporalAdoption } from "@/lib/v5/temporal/telemetry";
import {
  computeEngagementRate,
  readTimelineEngagement,
} from "@/lib/v5/temporal/timeline-telemetry";

/**
 * V5 Phase 7 Sub-PR 7.1 — Evolution. The engineering memory
 * surface foundation.
 *
 * This is the public surface for the temporal layer. It is not
 * a changelog (that lives at /changelog). It is not a project
 * page (those live at /projects + /architecture). It is the
 * editorial archive of architectural moments the ecosystem
 * chooses to remember.
 *
 * Voice (V5 § 2.3 + Phase 7 brief):
 *   - editorial
 *   - restrained
 *   - technical
 *   - cinematic
 *   - quietly archival
 *   NOT diary, social feed, marketing roadmap, or changelog
 *   duplicate.
 *
 * Page structure (post-Sub-PR 7.3)
 *   01  registry summary (totals + category distribution)
 *   02  filter by category
 *   03  scrub the timeline  ← NEW in 7.3 (mounts the slider)
 *   04  the memory (event cards)
 *   05  live adoption + playback + timeline engagement
 *   06  source files
 *
 * Caching: 1h ISR. Same cadence as /lumina/brain and
 * /v5/perception. The registry changes only on deploy (the data
 * file is the source of record), so the snapshot is stale-safe.
 *
 * Performance posture (Phase 7 brief)
 *   - Static-first. Every section above is server-rendered
 *     except the new slider (Sub-PR 7.3) which is a single
 *     client island consuming the Phase 7.2 playback primitive.
 *   - Slider bundle delta (frames + playback + slider combined):
 *     ~7-11 KB minified, ~3-4 KB gzipped. Within V5 § 2.7
 *     envelope for the /v5/* + /evolution route family.
 *   - No canvas, no GSAP, no animation framework. The slider
 *     uses pure CSS transitions guarded by the
 *     prefers-reduced-motion preference.
 *   - Mobile: single-column at < 768px; the slider's 44px
 *     hit-target row satisfies WCAG 2.5.5 AAA.
 *
 * What this page does NOT do (Phase 7.3 explicit deferrals)
 *   - No architecture playback / interpolation. Sub-PR 7.4 will
 *     mount the slider with `system === slug` on the
 *     /architecture/<slug> pages and add the visual snapshot
 *     fade layer.
 *   - No WebGPU / 3D surfaces. Phase 8 owns that quarantined
 *     spectacle.
 *   - No per-event detail page. The list view exposes
 *     anchor-only deep links; standalone detail surfaces (if
 *     they earn their slot) will land in a future sub-PR.
 */

export const revalidate = 3600;

const PAGE_TITLE = "Evolution — engineering memory archive | Emre Doğan";
const PAGE_DESCRIPTION =
  "The engineering memory layer for the portfolio ecosystem. Versioned, typed, editorial — the architectural moments the system chooses to remember. Foundation for V5 Phase 7's temporal architecture.";

interface EvolutionPageProps {
  searchParams: Promise<{ category?: string; system?: string }>;
}

export async function generateMetadata({
  searchParams,
}: EvolutionPageProps): Promise<Metadata> {
  const { category } = await searchParams;
  const filtered =
    typeof category === "string" && isEvolutionEventCategory(category);
  const title = filtered
    ? `Evolution · ${category} — Emre Doğan`
    : PAGE_TITLE;
  const description = filtered
    ? `The architectural memory layer, filtered to ${category} events. Phase 7 foundation; editorial, restrained, technical.`
    : PAGE_DESCRIPTION;
  /* Canonical strips filters — the unfiltered surface is the
   * source of truth for search engines. Filtered views remain
   * crawlable; they're just not canonical. */
  const canonical = `${getSiteUrl()}/evolution`;
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
    /* Indexable. The archive is meant to be discovered. */
    robots: { index: true, follow: true },
  };
}

const REPO_BASE = "https://github.com/emredogan-cloud/my-portfolio/blob/main";
const COMMIT_BASE = "https://github.com/emredogan-cloud/my-portfolio/commit";

interface SourceLink {
  label: string;
  path: string;
  note: string;
}

const SOURCE_LINKS: readonly SourceLink[] = [
  {
    label: "Schema",
    path: "lib/v5/temporal/schema.ts",
    note: "The EvolutionEvent shape, the category + status + provenance allow-lists, and the type guards every registry consumer reads through.",
  },
  {
    label: "Registry accessors",
    path: "lib/v5/temporal/registry.ts",
    note: "Pure data accessors over the data file. Sorts descending by date, applies the supersedes cascade, exposes per-category / per-system filters.",
  },
  {
    label: "Adoption telemetry",
    path: "lib/v5/temporal/telemetry.ts",
    note: "Aggregate-only KV hash at v5:temporal:adoption. Three event kinds (view / category_view / event_view). Graceful no-op when KV is unavailable.",
  },
  {
    label: "Frame math (7.2)",
    path: "lib/v5/temporal/frames.ts",
    note: "Pure interpolation helpers — TemporalFrame, TemporalCursor, buildTemporalFrames, interpolateCursor. Deterministic; no DOM, no Date.now() in the math layer.",
  },
  {
    label: "Playback controller (7.2)",
    path: "lib/v5/temporal/playback.ts",
    note: "createTemporalPlayback factory. seek / scrubTo / nextFrame / prevFrame / play / pause / destroy. Reduced-motion snap, RAF injectable for SSR + tests, idle CPU 0% when scrubber inactive.",
  },
  {
    label: "Playback adoption (7.2)",
    path: "lib/v5/temporal/playback-telemetry.ts",
    note: "Aggregate-only KV hash at v5:topology:playback. Five event kinds (seek / scrub / play / pause / step). Graceful no-op when KV is unavailable.",
  },
  {
    label: "Timeline slider (7.3)",
    path: "components/v5/TimelineSlider.tsx",
    note: "The first consumer of the 7.2 playback controller. WAI-ARIA slider role, keyboard + mouse + touch all functional, WCAG 2.5.5 AAA hit targets, reduced-motion preserves the slider but removes the thumb transition.",
  },
  {
    label: "Timeline engagement (7.3)",
    path: "lib/v5/temporal/timeline-telemetry.ts",
    note: "Aggregate-only KV hash at v5:topology:timeline. Two event kinds (mounted / engaged). The engagement_rate the V5 doc names is computed downstream as engaged / mounted.",
  },
  {
    label: "Event data",
    path: "data/temporal/events.ts",
    note: "The canonical hand-curated registry. Append-only by convention. Each entry carries id / date / category / summary plus optional version / system / rationale / commitSha / refs / status / supersedes / provenance.",
  },
  {
    label: "JSON feed",
    path: "app/api/v5/temporal/events/route.ts",
    note: "Edge GET endpoint. Returns { summary, events }. Supports ?category= and ?system= filters. CDN-cached for an hour, stale-while-revalidate for a day.",
  },
  {
    label: "This page",
    path: "app/evolution/page.tsx",
    note: "The editorial archive surface itself. Static prerender, 1h ISR. No client-side timeline, no canvas, no animation framework beyond the existing Reveal wrapper.",
  },
];

const CATEGORY_LABEL: Record<EvolutionEventCategory, string> = {
  architecture: "Architecture",
  infrastructure: "Infrastructure",
  "ai-system": "AI system",
  topology: "Topology",
  release: "Release",
  milestone: "Milestone",
  evolution: "Evolution",
};

const CATEGORY_DESCRIPTION: Record<EvolutionEventCategory, string> = {
  architecture:
    "Major architectural decisions and the moments where the system topology itself shifted.",
  infrastructure:
    "The platform underneath — edge runtime, KV caches, build pipelines, deploy posture.",
  "ai-system":
    "Lumina, sub-agents, lab experiments, evals, memory layers — the AI-native subsystems.",
  topology:
    "Visible architecture surfaces — the hero scene, the /architecture pages, the Phase 8 cinematic topology.",
  release:
    "Package publishes, version cuts, OSS milestones — the events that put a number on a system.",
  milestone:
    "Meta moments — V1/V2/V3/V4/V5 transitions, phase closures, observation windows.",
  evolution:
    "Cross-cutting changes that don't fit one axis but matter as ecosystem evolution.",
};

export default async function EvolutionPage({
  searchParams,
}: EvolutionPageProps) {
  const { category: categoryParam, system: systemParam } =
    await searchParams;

  /* Resolve the filter. Unknown / missing category renders the
   * full registry; an explicit valid category narrows it. The
   * system filter is additive and case-sensitive. */
  const activeCategory: EvolutionEventCategory | null =
    typeof categoryParam === "string" &&
    isEvolutionEventCategory(categoryParam)
      ? categoryParam
      : null;

  const activeSystem =
    typeof systemParam === "string" && systemParam ? systemParam : null;

  let events = activeCategory
    ? getEvolutionEventsByCategory(activeCategory)
    : getEvolutionEvents();
  if (activeSystem) {
    events = events.filter((e) => e.system === activeSystem);
  }

  const summary = summariseEvolutionRegistry();
  const [adoption, playbackAdoption, timelineEngagement] = await Promise.all([
    readTemporalAdoption(),
    readPlaybackAdoption(),
    readTimelineEngagement(),
  ]);
  const engagementRate = computeEngagementRate(timelineEngagement);
  /* Full event list — passed to the slider unfiltered so the
   * scrub axis always reflects the entire archive, not just the
   * currently filtered subset. The page's "The memory" section
   * still respects the category filter. */
  const allEventsForSlider = getEvolutionEvents();

  return (
    <main id="main" className="relative min-h-screen bg-black">
      {/* Same ambient gradient stack as /lumina/brain and
          /v5/perception. Visual continuity across V4 + V5
          meta surfaces. */}
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

      <VisitPing surface="evolution" />
      <AdoptionBeacon />

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
              Evolution
            </span>
            <span
              className="ml-auto px-2.5 py-1 rounded-full border font-mono uppercase tracking-[0.18em] text-[9px] border-[#00d2ff]/30 bg-[#00d2ff]/[0.04] text-[#00d2ff]/80"
              title="Phase 7 — temporal primitives, version-memory schema, evolution event registry, playback primitive, timeline slider. Architecture-page integration lands in Sub-PR 7.4."
            >
              Phase 7 · slider
            </span>
          </div>
        </Reveal>

        {/* HERO */}
        <Reveal mode="mount" duration={0.8} className="mb-12">
          <h1 className="text-4xl md:text-6xl font-medium tracking-[-0.04em] leading-[0.95] text-primary">
            <span className="block">Evolution.</span>
            <span className="block text-white/55">
              The system remembers itself.
            </span>
          </h1>
          <p className="text-secondary max-w-2xl mt-7 text-base md:text-lg leading-relaxed">
            This is the engineering memory layer for the portfolio
            ecosystem. Not the changelog (that lives at{" "}
            <Link
              href="/changelog"
              className="text-[#00d2ff]/80 hover:text-[#00d2ff] transition-colors"
            >
              /changelog
            </Link>{" "}
            and reads the raw commit firehose). Not the project
            archive (those live at{" "}
            <Link
              href="/architecture"
              className="text-[#00d2ff]/80 hover:text-[#00d2ff] transition-colors"
            >
              /architecture
            </Link>
            ). This is the editorial registry of architectural
            moments the system chooses to remember — versioned,
            typed, append-only.
          </p>
        </Reveal>

        {/* SUMMARY */}
        <Reveal duration={0.7} className="mb-14">
          <h2 className="font-mono uppercase tracking-[0.20em] text-[11px] text-tertiary mb-5">
            01 · The registry
          </h2>
          <p className="text-secondary text-sm leading-relaxed mb-6 max-w-2xl">
            {summary.total} architectural events recorded across{" "}
            {summary.earliestDate ?? "—"} → {summary.latestDate ?? "—"}.{" "}
            {summary.current} currently active; the rest carry the
            superseded flag and remain in the archive for the audit
            trail.
          </p>
          <dl className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {EVOLUTION_EVENT_CATEGORIES.map((cat) => {
              const count = summary.byCategory[cat];
              return (
                <div
                  key={cat}
                  className="border border-white/[0.06] rounded-xl bg-white/[0.02] p-4"
                >
                  <dt className="font-mono uppercase tracking-[0.18em] text-[9px] text-tertiary mb-1">
                    {CATEGORY_LABEL[cat]}
                  </dt>
                  <dd className="font-mono text-[20px] text-primary leading-none">
                    {count}
                  </dd>
                </div>
              );
            })}
          </dl>
        </Reveal>

        {/* CATEGORY FILTER */}
        <Reveal duration={0.7} className="mb-14">
          <h2 className="font-mono uppercase tracking-[0.20em] text-[11px] text-tertiary mb-5">
            02 · Filter by category
          </h2>
          <p className="text-secondary text-sm leading-relaxed mb-5 max-w-2xl">
            Seven categories index the registry. Each one is an
            architectural axis — not a content type. Pick one to
            narrow the archive, or stay on the unfiltered view to
            read the full memory.
          </p>
          <div className="flex flex-wrap gap-2">
            <CategoryPill
              href="/evolution"
              label="All"
              active={activeCategory === null}
              count={summary.total}
            />
            {EVOLUTION_EVENT_CATEGORIES.map((cat) => (
              <CategoryPill
                key={cat}
                href={`/evolution?category=${cat}`}
                label={CATEGORY_LABEL[cat]}
                active={activeCategory === cat}
                count={summary.byCategory[cat]}
              />
            ))}
          </div>
          {activeCategory ? (
            <p className="text-tertiary text-[13px] leading-relaxed mt-5 max-w-2xl">
              <span className="text-[#00d2ff]/80 font-mono uppercase tracking-[0.18em] text-[10px] mr-2">
                {CATEGORY_LABEL[activeCategory]}
              </span>
              {CATEGORY_DESCRIPTION[activeCategory]}
            </p>
          ) : null}
          {activeSystem ? (
            <p className="text-tertiary text-[13px] leading-relaxed mt-3 max-w-2xl">
              <span className="text-[#00d2ff]/80 font-mono uppercase tracking-[0.18em] text-[10px] mr-2">
                System
              </span>
              Narrowed to <code className="text-primary">{activeSystem}</code>.{" "}
              <Link
                href={
                  activeCategory
                    ? `/evolution?category=${activeCategory}`
                    : "/evolution"
                }
                className="text-[#00d2ff]/80 hover:text-[#00d2ff] underline underline-offset-2 decoration-white/15 hover:decoration-[#00d2ff]/50 transition-colors"
              >
                Remove filter
              </Link>
            </p>
          ) : null}
        </Reveal>

        {/* SLIDER — Sub-PR 7.3 inserts the first consumer of the
            7.2 playback controller here. Reads the unfiltered
            registry so the scrub axis covers the entire archive
            regardless of the current category filter. Renders
            null when the registry is empty (defensive — the
            seed registry is never empty). */}
        <Reveal duration={0.7} className="mb-14">
          <h2 className="font-mono uppercase tracking-[0.20em] text-[11px] text-tertiary mb-5">
            03 · Scrub the timeline
          </h2>
          <p className="text-secondary text-sm leading-relaxed mb-7 max-w-2xl">
            The slider below is the cursor over the engineering
            memory. Drag the thumb, click a tick, step with the
            arrow keys, or press play to let the cursor advance
            from the present back to genesis. The track is a
            single WAI-ARIA slider — keyboard, mouse, and touch
            all work; reduced-motion preserves the slider but
            removes the easing.
          </p>
          <div className="border border-white/[0.06] rounded-xl bg-white/[0.02] p-5 md:p-6">
            <TimelineSlider events={allEventsForSlider} />
          </div>
        </Reveal>

        {/* THE EVENTS */}
        <Reveal duration={0.7} className="mb-14">
          <h2 className="font-mono uppercase tracking-[0.20em] text-[11px] text-tertiary mb-5">
            04 · The memory
          </h2>
          {events.length === 0 ? (
            <div className="font-mono text-[13px] text-tertiary border border-white/[0.06] rounded-xl p-6 bg-white/[0.02]">
              <p className="mb-2">
                <span className="text-[#00d2ff]/80">$</span>{" "}
                evolution.query
              </p>
              <p className="text-secondary">No events match this filter.</p>
              <p className="text-tertiary mt-2">
                The registry is append-only; absence here means no
                architectural event of this kind has been recorded
                yet — not that one is hidden.
              </p>
            </div>
          ) : (
            <ol className="space-y-6 list-none">
              {events.map((event) => (
                <li key={event.id} id={event.id}>
                  <EvolutionEventCard event={event} />
                </li>
              ))}
            </ol>
          )}
        </Reveal>

        {/* TELEMETRY (live adoption tile — same posture as
            /lumina/brain's hit-rate). Folded under a small
            section because the temporal layer's signal is
            decorative for the visitor; load-bearing for the
            operator. */}
        <Reveal duration={0.7} className="mb-14">
          <h2 className="font-mono uppercase tracking-[0.20em] text-[11px] text-tertiary mb-5">
            05 · Live adoption
          </h2>
          <p className="text-secondary text-sm leading-relaxed mb-5 max-w-2xl">
            The temporal layer records three kinds of adoption
            event: the page rendered, a category filter was
            applied, an event deep-link was followed. All three are
            aggregate-only — counters by event kind, no per-visitor
            identifier, no session-id field. The numbers below are
            cumulative since the layer was first enabled.
          </p>
          <dl className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <AdoptionTile label="view" value={adoption.view ?? null} />
            <AdoptionTile
              label="category_view"
              value={adoption.category_view ?? null}
            />
            <AdoptionTile
              label="event_view"
              value={adoption.event_view ?? null}
            />
          </dl>
          {/* Playback verbs — Sub-PR 7.2 primitive's hash. The
              7.3 slider above is the first consumer; every verb
              the visitor performs lands in one of these five
              fields. */}
          <p className="text-tertiary text-[13px] leading-relaxed mt-7 mb-4 max-w-2xl">
            <span className="font-mono uppercase tracking-[0.18em] text-[10px] text-[#00d2ff]/80 mr-2">
              Playback verbs
            </span>
            Counters for the five primitive operations the slider
            exposes — seek (click or keyboard jump), scrub
            (drag), play (auto-advance), pause, step (single
            frame). Every counter increments fire-and-forget; the
            slider never blocks on the network.
          </p>
          <dl className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <AdoptionTile label="seek" value={playbackAdoption.seek ?? null} />
            <AdoptionTile
              label="scrub"
              value={playbackAdoption.scrub ?? null}
            />
            <AdoptionTile label="play" value={playbackAdoption.play ?? null} />
            <AdoptionTile
              label="pause"
              value={playbackAdoption.pause ?? null}
            />
            <AdoptionTile label="step" value={playbackAdoption.step ?? null} />
          </dl>
          {/* Timeline engagement — Sub-PR 7.3's session-deduped
              lifecycle hash. `mounted` increments once per
              session when the slider renders; `engaged` once on
              first interaction. The ratio is the engagement_rate
              the V5 doc names — surfaced separately so the
              operator reads it as a derived metric. */}
          <p className="text-tertiary text-[13px] leading-relaxed mt-7 mb-4 max-w-2xl">
            <span className="font-mono uppercase tracking-[0.18em] text-[10px] text-[#00d2ff]/80 mr-2">
              Timeline engagement
            </span>
            The slider&apos;s lifecycle hash. Each visitor session
            increments <code className="font-mono text-[12px] text-primary">mounted</code>{" "}
            at most once when the slider renders, and{" "}
            <code className="font-mono text-[12px] text-primary">engaged</code>{" "}
            at most once on the first scrub, seek, step, or play
            interaction. The rate captures awareness vs use.
          </p>
          <dl className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <AdoptionTile
              label="mounted"
              value={timelineEngagement.mounted ?? null}
            />
            <AdoptionTile
              label="engaged"
              value={timelineEngagement.engaged ?? null}
            />
            <AdoptionRateTile
              label="engagement_rate"
              value={engagementRate}
            />
          </dl>
        </Reveal>

        {/* SOURCE FILES */}
        <Reveal duration={0.7} className="mb-14">
          <h2 className="font-mono uppercase tracking-[0.20em] text-[11px] text-tertiary mb-5">
            06 · Source files
          </h2>
          <p className="text-secondary text-sm leading-relaxed mb-5 max-w-2xl">
            Every entry in the registry is grounded in code. Click
            any row to read the file on GitHub.
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
          <div className="border-t border-white/[0.05] pt-6 mt-12 space-y-3">
            <p className="font-mono uppercase tracking-[0.20em] text-[10px] text-quiet flex flex-wrap items-center gap-x-3 gap-y-1">
              <span
                aria-hidden="true"
                className="inline-block w-1 h-1 rounded-full bg-[#00d2ff]/70 align-middle"
              />
              <span>V5 · Phase 7 · Temporal Architecture</span>
              <span className="text-faint">·</span>
              <span>Append-only registry</span>
              <span className="text-faint">·</span>
              <span>Versioned + typed + provenanced</span>
            </p>
            <p className="text-tertiary text-[12px] leading-relaxed max-w-2xl">
              Phase 7 has reached its slider: Sub-PR 7.1 shipped
              the schema + registry + archive surface, 7.2 added
              the deterministic playback primitive, and 7.3 mounts
              the first consumer — the WAI-ARIA slider above. The
              architecture-page integration in Sub-PR 7.4 will
              mount the same slider scoped to a single project&apos;s
              event slice. The page remains what it claims to be:
              a quietly archival surface that reads as engineering
              memory, with a single calm instrument for navigating
              it.
            </p>
          </div>
        </Reveal>
      </div>
    </main>
  );
}

/* ── Inline UI ──────────────────────────────────────────────── */

function CategoryPill({
  href,
  label,
  count,
  active,
}: {
  href: string;
  label: string;
  count: number;
  active: boolean;
}) {
  const base =
    "inline-flex items-center gap-2 rounded-full px-3 py-1.5 font-mono uppercase tracking-[0.18em] text-[10px] transition-colors";
  const variant = active
    ? "border border-[#00d2ff]/40 bg-[#00d2ff]/[0.06] text-[#00d2ff]"
    : "border border-white/[0.08] bg-white/[0.02] text-secondary hover:border-white/[0.18] hover:text-primary";
  return (
    <Link href={href} className={`${base} ${variant}`}>
      <span>{label}</span>
      <span className="text-tertiary tabular-nums">{count}</span>
    </Link>
  );
}

function AdoptionTile({
  label,
  value,
}: {
  label: string;
  value: number | null;
}) {
  return (
    <div className="border border-white/[0.06] rounded-xl bg-white/[0.02] p-4">
      <p className="font-mono uppercase tracking-[0.18em] text-[9px] text-tertiary mb-1">
        {label}
      </p>
      <p className="font-mono text-[20px] text-primary leading-none tabular-nums">
        {value === null ? "—" : value.toLocaleString("en-US")}
      </p>
    </div>
  );
}

function AdoptionRateTile({
  label,
  value,
}: {
  label: string;
  value: number | null;
}) {
  /* Same visual shape as AdoptionTile but renders a percentage
   * with one decimal place. `null` = "no signal yet" (the rate
   * is undefined when mounted === 0). */
  const display =
    value === null
      ? "—"
      : `${(value * 100).toFixed(value >= 0.995 ? 0 : 1)}%`;
  return (
    <div className="border border-white/[0.06] rounded-xl bg-[#00d2ff]/[0.04] p-4">
      <p className="font-mono uppercase tracking-[0.18em] text-[9px] text-tertiary mb-1">
        {label}
      </p>
      <p className="font-mono text-[20px] text-[#00d2ff]/90 leading-none tabular-nums">
        {display}
      </p>
    </div>
  );
}

function EvolutionEventCard({ event }: { event: EvolutionEvent }) {
  const isSuperseded = event.status === "superseded";
  return (
    <article
      className={`border rounded-xl p-5 md:p-6 transition-colors ${
        isSuperseded
          ? "border-white/[0.04] bg-white/[0.01]"
          : "border-white/[0.06] bg-white/[0.02]"
      }`}
    >
      <header className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 mb-3">
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <span className="font-mono uppercase tracking-[0.18em] text-[10px] text-[#00d2ff]/80">
            {CATEGORY_LABEL[event.category]}
          </span>
          {event.version ? (
            <span className="font-mono text-[10px] text-tertiary">
              {event.version}
            </span>
          ) : null}
          {event.system ? (
            <span className="font-mono text-[10px] text-tertiary">
              · {event.system}
            </span>
          ) : null}
          {isSuperseded ? (
            <span className="font-mono uppercase tracking-[0.18em] text-[9px] text-tertiary px-2 py-0.5 rounded-full border border-white/[0.06]">
              superseded
            </span>
          ) : null}
        </div>
        <time
          dateTime={event.date}
          className="font-mono text-[11px] text-tertiary tabular-nums"
        >
          {event.date}
        </time>
      </header>
      <h3 className="text-lg md:text-xl font-medium tracking-[-0.01em] text-primary mb-3 leading-snug">
        {event.title}
      </h3>
      <p className="text-secondary text-[14px] md:text-[15px] leading-relaxed mb-3">
        {event.summary}
      </p>
      {event.rationale ? (
        <p className="text-tertiary text-[13px] md:text-[14px] leading-relaxed border-l-2 border-[#00d2ff]/20 pl-4 italic mb-4">
          {event.rationale}
        </p>
      ) : null}
      <footer className="flex flex-wrap items-center gap-2 mt-1">
        {event.commitSha ? (
          <Link
            href={`${COMMIT_BASE}/${event.commitSha}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 font-mono text-[10px] text-tertiary hover:text-primary border border-white/[0.06] hover:border-white/[0.15] rounded px-2 py-1 transition-colors"
          >
            <span className="text-[#00d2ff]/60">commit</span>
            <span>{event.commitSha.slice(0, 7)}</span>
          </Link>
        ) : null}
        {(event.refs ?? []).map((ref, idx) => (
          <EvolutionEventRefPill
            key={`${event.id}-ref-${idx}`}
            evtRef={ref}
          />
        ))}
        <Link
          href={`/evolution#${event.id}`}
          className="ml-auto font-mono uppercase tracking-[0.18em] text-[9px] text-tertiary hover:text-secondary underline underline-offset-4 decoration-white/[0.10] hover:decoration-white/30 transition-colors"
        >
          # {event.id}
        </Link>
      </footer>
    </article>
  );
}

function EvolutionEventRefPill({ evtRef }: { evtRef: EvolutionEventRef }) {
  const baseClasses =
    "inline-flex items-center gap-1.5 font-mono text-[10px] text-tertiary hover:text-primary border border-white/[0.06] hover:border-white/[0.15] rounded px-2 py-1 transition-colors";
  const kindLabel =
    evtRef.kind === "commit"
      ? "commit"
      : evtRef.kind === "report"
        ? "report"
        : evtRef.kind === "doc"
          ? "doc"
          : "ext";

  let href: string | null = null;
  let body = evtRef.label;
  if (evtRef.kind === "commit" && evtRef.sha) {
    href = `${COMMIT_BASE}/${evtRef.sha}`;
    body = `${evtRef.label} · ${evtRef.sha.slice(0, 7)}`;
  } else if (
    (evtRef.kind === "report" || evtRef.kind === "doc") &&
    evtRef.path
  ) {
    href = `${REPO_BASE}/${evtRef.path}`;
  } else if (evtRef.kind === "external" && evtRef.url) {
    href = evtRef.url;
  }

  if (href === null) {
    return (
      <span className={baseClasses}>
        <span className="text-[#00d2ff]/60">{kindLabel}</span>
        <span>{body}</span>
      </span>
    );
  }

  return (
    <Link
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={baseClasses}
    >
      <span className="text-[#00d2ff]/60">{kindLabel}</span>
      <span>{body}</span>
    </Link>
  );
}
