import type { Metadata } from "next";
import { Reveal } from "@/components/ui/Reveal";
import VisitPing from "@/components/telemetry/VisitPing";
import {
  readMetric,
  METRIC_KEYS,
  type MetricSnapshot,
} from "@/lib/telemetry/metrics";

/**
 * V4 Phase 1 — Sub-PR 1.2: public engineering observability dashboard.
 *
 * Mission (V4 FUTURE § 2.5): visible-by-default operations surface
 * that tells the visitor "this platform is observed in production
 * and nothing is hidden". Calm, mono-typed, cinematic — not a
 * Grafana clone.
 *
 * Caching contract (V4 § 5.1.2):
 *   - `revalidate = 300` → 5-minute ISR. The page rebuilds at most
 *     every 5 minutes; visitors in between get the cached HTML.
 *   - KV reads happen at build/regen time inside this Server
 *     Component. No client JS for the data path.
 *   - Hydration safety (V4 § 2.8): the server-rendered HTML is
 *     what the client receives, no skeleton-then-real swap. Time
 *     deltas ("3 minutes ago") are computed once at render and
 *     drift up to 5 minutes between regenerations — acceptable
 *     for a non-live-ticker dashboard.
 *
 * Performance budget (V4 § 2.7):
 *   - LCP < 1.2s (cached) → static HTML served from Vercel edge
 *     cache, no client JS for the metrics path. Hit easily.
 *   - Bundle delta: ~0 KB → no new client-side dependencies.
 */

/* ISR: regenerate at most every 5 minutes (V4 § 5.1.2). Runtime is
 * the default (nodejs) — the page renders static HTML between
 * revalidations, so edge vs node makes no perceptible difference
 * at steady state; the /api/telemetry/[metric] endpoint is the
 * explicit edge surface (V4 § 2.9). */
export const revalidate = 300;

export const metadata: Metadata = {
  title: "Telemetry — Emre Doğan",
  description:
    "Public observability dashboard for emredogan.com. Lumina latency, auto-tweet adoption, npm downloads, and operating cost — measured, not asserted.",
  robots: {
    index: true,
    follow: true,
  },
};

interface TileSpec {
  /** URL-safe slug, matches `/api/telemetry/<slug>`. */
  slug: string;
  /** Display label shown above the value. */
  label: string;
  /** Short sentence under the value — what this measures, in plain
   *  English. */
  description: string;
  /** Unit token rendered after the value (e.g. "ms", "USD"). */
  unit?: string;
  /** Formatter for the raw KV number. */
  format: (n: number) => string;
  /** When KV has no data yet, this short note replaces the value
   *  in the tile. */
  placeholder: string;
  /** KV key — declared inline per tile so the page reads as one
   *  source-of-truth dashboard manifest. */
  kvKey: string;
}

const TILES: readonly TileSpec[] = [
  {
    slug: "lumina-p95",
    label: "Lumina p95 latency",
    description:
      "Full-request 95th-percentile over the last 100 chat completions, rolling.",
    unit: "ms",
    format: (n) => Math.round(n).toLocaleString("en-US"),
    placeholder: "awaiting first chat",
    kvKey: METRIC_KEYS.LUMINA_P95_LATENCY,
  },
  {
    slug: "autotweet-success",
    label: "Auto-tweet successes",
    description:
      "Successful POST responses from the daily standup cron, cumulative since launch.",
    format: (n) => Math.round(n).toLocaleString("en-US"),
    placeholder: "cron hasn't fired yet",
    kvKey: METRIC_KEYS.AUTOTWEET_SUCCESS_30D,
  },
  {
    slug: "npm-downloads",
    label: "lumina-chat / week",
    description:
      "Weekly npm installs of @emredogan/lumina-chat. Hydrated by an external poll of the npm API.",
    format: (n) => Math.round(n).toLocaleString("en-US"),
    placeholder: "0.1.0 not yet on npm",
    kvKey: METRIC_KEYS.LUMINA_CHAT_NPM_WEEKLY,
  },
  {
    slug: "bedrock-cost",
    label: "Bedrock cost / day",
    description:
      "Daily AWS Bedrock inference cost. Production chat uses Anthropic direct today; key reserved for Phase 3+ Bedrock routes.",
    unit: "USD",
    format: (n) => `$${n.toFixed(2)}`,
    placeholder: "no Bedrock traffic yet",
    kvKey: METRIC_KEYS.BEDROCK_COST_DAILY,
  },
  {
    slug: "mrr",
    label: "MRR",
    description:
      "Monthly recurring revenue. Hydrates from the Lemon Squeezy webhook when subscriptions land in Phase 3.",
    unit: "USD",
    format: (n) => `$${n.toFixed(0)}`,
    placeholder: "no paid tier yet",
    kvKey: METRIC_KEYS.MRR_CURRENT,
  },
  {
    slug: "telemetry-visits",
    label: "/telemetry visits",
    description:
      "Cumulative session-deduped visits to this page. Self-referential — closes the V4 § 5.1.2 observability contract.",
    format: (n) => Math.round(n).toLocaleString("en-US"),
    placeholder: "no visits yet",
    kvKey: METRIC_KEYS.TELEMETRY_VISITS,
  },
  {
    slug: "changelog-visits",
    label: "/changelog visits",
    description:
      "Cumulative session-deduped visits to the public engineering changelog. Per V4 § 5.1.4.",
    format: (n) => Math.round(n).toLocaleString("en-US"),
    placeholder: "no visits yet",
    kvKey: METRIC_KEYS.CHANGELOG_VISITS,
  },
  {
    slug: "lab-iam-completions",
    label: "IAM translator runs",
    description:
      "Streams completed by /lab/iam-translator since launch. Drives the lab adoption signal feeding into the Phase 2 sunset threshold.",
    format: (n) => Math.round(n).toLocaleString("en-US"),
    placeholder: "no completions yet",
    kvKey: METRIC_KEYS.LAB_IAM_COMPLETIONS_DAILY,
  },
  {
    slug: "lab-iam-cost",
    label: "IAM translator cost",
    description:
      "Estimated Bedrock spend on the IAM translator over the rolling 36-hour window. Daily cap $5; the route refuses new calls past the ceiling.",
    unit: "USD",
    format: (n) => `$${n.toFixed(2)}`,
    placeholder: "no spend yet",
    kvKey: METRIC_KEYS.LAB_IAM_COST_USD_DAILY,
  },
  {
    slug: "lab-prompt-rescuer-completions",
    label: "Prompt rescuer runs",
    description:
      "Streams completed by /lab/prompt-rescuer since launch. Reads next to the IAM completions tile to compare lab adoption across experiments.",
    format: (n) => Math.round(n).toLocaleString("en-US"),
    placeholder: "no completions yet",
    kvKey: METRIC_KEYS.LAB_PROMPT_RESCUER_COMPLETIONS_DAILY,
  },
  {
    slug: "lab-prompt-rescuer-cost",
    label: "Prompt rescuer cost",
    description:
      "Estimated Bedrock spend on /lab/prompt-rescuer over the rolling 36-hour window. Daily cap $5 — independent of the IAM translator's budget.",
    unit: "USD",
    format: (n) => `$${n.toFixed(2)}`,
    placeholder: "no spend yet",
    kvKey: METRIC_KEYS.LAB_PROMPT_RESCUER_COST_USD_DAILY,
  },
  {
    slug: "lab-commit-narrator-completions",
    label: "Commit narrator runs",
    description:
      "Streams completed by /lab/commit-narrator since launch. Lower throughput than the other experiments — 3 calls/IP/hour cap because each call hits GitHub + Bedrock with a larger context.",
    format: (n) => Math.round(n).toLocaleString("en-US"),
    placeholder: "no completions yet",
    kvKey: METRIC_KEYS.LAB_COMMIT_NARRATOR_COMPLETIONS_DAILY,
  },
  {
    slug: "lab-commit-narrator-cost",
    label: "Commit narrator cost",
    description:
      "Estimated Bedrock spend on /lab/commit-narrator over the rolling 36-hour window. Higher per-call cost than the other lab experiments; daily cap $5 — independent budget.",
    unit: "USD",
    format: (n) => `$${n.toFixed(2)}`,
    placeholder: "no spend yet",
    kvKey: METRIC_KEYS.LAB_COMMIT_NARRATOR_COST_USD_DAILY,
  },
  {
    slug: "cli-ask-completions",
    label: "CLI ask runs",
    description:
      "Streams completed by /api/cli/ask since launch. Driven by `npx emredogan ask` invocations from terminal users.",
    format: (n) => Math.round(n).toLocaleString("en-US"),
    placeholder: "no completions yet",
    kvKey: METRIC_KEYS.CLI_ASK_COMPLETIONS_DAILY,
  },
  {
    slug: "cli-ask-cost",
    label: "CLI ask cost",
    description:
      "Estimated spend on /api/cli/ask over the rolling 36-hour window. Daily cap $5 — independent of all /lab budgets.",
    unit: "USD",
    format: (n) => `$${n.toFixed(2)}`,
    placeholder: "no spend yet",
    kvKey: METRIC_KEYS.CLI_ASK_COST_USD_DAILY,
  },
  {
    slug: "cli-downloads-weekly",
    label: "@emredogan/cli / week",
    description:
      "Weekly npm installs of @emredogan/cli. Hydrated by an external poll of the npm API in a later sub-PR.",
    format: (n) => Math.round(n).toLocaleString("en-US"),
    placeholder: "0.1.0 not yet on npm",
    kvKey: METRIC_KEYS.EMREDOGAN_CLI_NPM_WEEKLY,
  },
] as const;

interface TileData {
  spec: TileSpec;
  snapshot: MetricSnapshot | null;
}

/**
 * Format a relative time delta in a calm, non-ticker style. The
 * page caches for 5 minutes so this value can drift up to ~5 min
 * stale between regenerations — that's why we round generously
 * and use the words "about" / "around" where small precision
 * would be misleading.
 */
function formatUpdatedAt(iso: string, now: number): string {
  const then = new Date(iso).getTime();
  if (!Number.isFinite(then)) return "—";
  const deltaSec = Math.max(0, Math.round((now - then) / 1000));
  if (deltaSec < 45) return `${deltaSec}s ago`;
  const minutes = Math.round(deltaSec / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  return `${days}d ago`;
}

export default async function TelemetryPage() {
  /* Parallel-fetch every tile's KV value. Small reads, fan-out at
   * the edge — even seven concurrent fetches complete well under
   * the LCP budget. */
  const snapshots = await Promise.all(
    TILES.map((spec) =>
      readMetric(spec.kvKey as Parameters<typeof readMetric>[0]),
    ),
  );
  const data: TileData[] = TILES.map((spec, i) => ({
    spec,
    snapshot: snapshots[i] ?? null,
  }));

  /* Single render-time anchor for "X ago" math. All tiles share
   * the same `now` so the row reads as one coherent snapshot
   * rather than five staggered readings. The page is ISR-cached
   * for 5 minutes (see `revalidate` above) — render-time impurity
   * is the entire contract of this surface, not an accident, so
   * the react-hooks/purity rule is intentionally suppressed. */
  // eslint-disable-next-line react-hooks/purity -- intentional: ISR snapshot timestamp
  const now = Date.now();
  const generatedAt = new Date(now).toISOString();

  return (
    <main id="main" className="relative min-h-screen bg-black">
      {/* Visit ping — render-once client island, posts a single
          /api/telemetry/visit POST on mount per tab session. Self-
          referential per V4 § 5.1.2: the dashboard counts its own
          visits as one of the surfaced metrics. */}
      <VisitPing surface="telemetry" />

      {/* Ambient cyan atmosphere — same vocabulary as /about and
          /codex so the page reads as one site, not a tooling chunk. */}
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

      <div className="relative z-10 max-w-6xl mx-auto px-6 pt-36 pb-32">
        {/* HERO — same posture as /about: small eyebrow, two-line
            statement, one paragraph of framing. */}
        <Reveal mode="mount" duration={0.8} className="mb-20">
          <span className="text-[10px] sm:text-xs uppercase tracking-widest text-primary/40">
            Telemetry
          </span>
          <h1 className="text-5xl md:text-7xl font-medium tracking-[-0.04em] leading-[0.95] text-primary mt-5">
            <span className="block">Measured,</span>
            <span className="block text-white/55">not asserted.</span>
          </h1>
          <p className="text-secondary max-w-2xl mt-8 text-base md:text-lg leading-relaxed">
            What this platform actually does in production. Latency,
            adoption, cost, revenue — read straight from KV at request
            time, rebuilt every five minutes. Nothing is hand-curated
            on this page; everything that&apos;s null is null because
            the data isn&apos;t there yet, not because it&apos;s being
            withheld.
          </p>
        </Reveal>

        {/* GRID — 1 col mobile → 2 col md → 3 col lg per V4 § 5.1.2. */}
        <section className="mb-16">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {data.map(({ spec, snapshot }, i) => {
              const hasValue =
                snapshot !== null && Number.isFinite(snapshot.value);
              const displayValue = hasValue
                ? spec.format(snapshot!.value)
                : spec.placeholder;
              const updatedAt = snapshot
                ? formatUpdatedAt(snapshot.updated_at, now)
                : "—";

              return (
                <Reveal
                  key={spec.slug}
                  duration={0.6}
                  delay={i * 0.05}
                  y={14}
                  margin="-60px"
                >
                  <article className="group relative h-full rounded-2xl border border-white/[0.06] bg-white/[0.018] p-6 md:p-7 transition-colors duration-500 hover:border-white/[0.10] hover:bg-white/[0.025]">
                    {/* Hairline cyan rule top — barely visible at
                        rest, comes up to ~90% on hover. Reuses the
                        Principles vocabulary from /about for visual
                        family continuity. */}
                    <span
                      aria-hidden="true"
                      className="absolute inset-x-7 top-0 h-px bg-[#00d2ff]/20 opacity-30 transition-opacity duration-500 group-hover:opacity-90"
                    />
                    <div className="flex items-baseline justify-between gap-3 mb-4">
                      <span className="font-mono uppercase tracking-[0.20em] text-[10px] text-[#00d2ff]/80">
                        {spec.label}
                      </span>
                      <span className="font-mono uppercase tracking-[0.18em] text-[9px] text-quiet">
                        {updatedAt}
                      </span>
                    </div>
                    {hasValue ? (
                      <div className="flex items-baseline gap-2 mb-3">
                        <span className="text-4xl md:text-5xl font-medium tracking-[-0.03em] text-[#00d2ff] tabular-nums">
                          {displayValue}
                        </span>
                        {spec.unit && (
                          <span className="text-tertiary text-sm font-mono uppercase tracking-wider">
                            {spec.unit}
                          </span>
                        )}
                      </div>
                    ) : (
                      <div className="mb-3">
                        <span className="text-2xl md:text-3xl font-medium tracking-[-0.02em] text-tertiary italic">
                          {displayValue}
                        </span>
                      </div>
                    )}
                    <p className="text-tertiary text-[13.5px] leading-[1.75]">
                      {spec.description}
                    </p>
                  </article>
                </Reveal>
              );
            })}
          </div>
        </section>

        {/* QUIET FOOTER — page-level provenance. Mono, restrained;
            same posture as the closing transmission on /about. */}
        <Reveal duration={0.7}>
          <div className="border-t border-white/[0.05] pt-8 mt-8">
            <p className="text-tertiary text-sm md:text-base leading-relaxed max-w-2xl mb-4">
              Each tile reads from a single KV key behind{" "}
              <code className="font-mono text-[13px] text-primary/80">
                /api/telemetry/&lt;slug&gt;
              </code>
              . Slugs:{" "}
              {TILES.map((t, i) => (
                <span key={t.slug}>
                  <code className="font-mono text-[13px] text-primary/80">
                    {t.slug}
                  </code>
                  {i < TILES.length - 1 ? ", " : "."}
                </span>
              ))}
            </p>
            <p className="font-mono uppercase tracking-[0.20em] text-[10px] text-quiet">
              <span
                aria-hidden="true"
                className="inline-block w-1 h-1 rounded-full bg-[#00d2ff]/60 align-middle mr-2"
              />
              Snapshot{" "}
              <time
                dateTime={generatedAt}
                suppressHydrationWarning
              >
                {new Date(now).toISOString().replace("T", " ").slice(0, 19)} UTC
              </time>{" "}
              · Revalidates every 5m
            </p>
          </div>
        </Reveal>
      </div>
    </main>
  );
}
