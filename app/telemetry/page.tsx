import type { Metadata } from "next";
import { Reveal } from "@/components/ui/Reveal";
import PageAtmosphere from "@/components/layout/PageAtmosphere";
import VisitPing from "@/components/telemetry/VisitPing";
import {
  readMetric,
  METRIC_KEYS,
  type MetricSnapshot,
  type MetricKey,
} from "@/lib/telemetry/metrics";
import Observation from "./_components/Observation";
import AdoptionStrip from "./_components/AdoptionStrip";

/**
 * V4 Phase 1 — Sub-PR 1.2: public engineering observability dashboard.
 * V6 Phase 15 — Sub-PR 15.1: composed editorial observatory.
 *
 * Same KV contract. Same revalidation cadence. Same provenance
 * footer. The only thing that changes is the COMPOSITION the
 * visitor reads. When V6_TELEMETRY_OBSERVATORY is on, the 18-tile
 * grid collapses into ~6 composed sections of inline observations,
 * a 3-col cost strip, a 5-surface adoption sparkline, a 3-row lab
 * throughput table, two CLI observations, and a notes engagement
 * micro-section. Total elements drop from 18 → ~6 composed; mobile
 * scroll drops from ~7 viewports to ~6 paragraphs.
 *
 * Spec ref: PORTFOLYO_V6_UI_EXECUTION_SYSTEM.md § Sub-PR 15.1.
 * Audit ref: PORTFOLYO_V6_UI_AUDIT.md §§ 11.1, 11.2, 11.3.
 */

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

/* ─────────────────────────────────────────────────────────────
 *  Legacy 18-tile spec (V5 baseline, rollback path).
 *  Verbatim from pre-15.1 page body — every field unchanged so
 *  the rollback contract holds byte-identical.
 * ───────────────────────────────────────────────────────────── */

interface TileSpec {
  slug: string;
  label: string;
  description: string;
  unit?: string;
  format: (n: number) => string;
  placeholder: string;
  kvKey: MetricKey;
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
  {
    slug: "notes-audio-plays",
    label: "Notes audio plays",
    description:
      "Session-deduped audio play events on /notes/[slug] pages. Fired once per (visitor session × note) when the visitor presses play on the AudioPlayer.",
    format: (n) => Math.round(n).toLocaleString("en-US"),
    placeholder: "no plays yet",
    kvKey: METRIC_KEYS.NOTES_AUDIO_PLAYS,
  },
  {
    slug: "notes-diagram-interactions",
    label: "Notes diagram interactions",
    description:
      "First-click events on the InteractiveDiagram tab across all notes. Session-deduped per (visitor session × note).",
    format: (n) => Math.round(n).toLocaleString("en-US"),
    placeholder: "no interactions yet",
    kvKey: METRIC_KEYS.NOTES_DIAGRAM_INTERACTIONS,
  },
] as const;

interface TileData {
  spec: TileSpec;
  snapshot: MetricSnapshot | null;
}

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

function value(snapshot: MetricSnapshot | null): number | null {
  if (snapshot === null) return null;
  if (!Number.isFinite(snapshot.value)) return null;
  return snapshot.value;
}

function formatInteger(n: number | null): string | null {
  if (n === null) return null;
  return Math.round(n).toLocaleString("en-US");
}

function formatUsd(n: number | null, fractionDigits = 2): string | null {
  if (n === null) return null;
  return `$${n.toFixed(fractionDigits)}`;
}

export default async function TelemetryPage() {
  /* Read every KV-backed metric in parallel. Edge fetches; no
   * sequencing matters. Same primitives the legacy path uses, so
   * the V6 observatory composition is purely a render-layer
   * change. */
  const allKeys: readonly MetricKey[] = [
    /* V5 18-tile keys */
    METRIC_KEYS.LUMINA_P95_LATENCY,
    METRIC_KEYS.AUTOTWEET_SUCCESS_30D,
    METRIC_KEYS.LUMINA_CHAT_NPM_WEEKLY,
    METRIC_KEYS.BEDROCK_COST_DAILY,
    METRIC_KEYS.MRR_CURRENT,
    METRIC_KEYS.TELEMETRY_VISITS,
    METRIC_KEYS.CHANGELOG_VISITS,
    METRIC_KEYS.LAB_IAM_COMPLETIONS_DAILY,
    METRIC_KEYS.LAB_IAM_COST_USD_DAILY,
    METRIC_KEYS.LAB_PROMPT_RESCUER_COMPLETIONS_DAILY,
    METRIC_KEYS.LAB_PROMPT_RESCUER_COST_USD_DAILY,
    METRIC_KEYS.LAB_COMMIT_NARRATOR_COMPLETIONS_DAILY,
    METRIC_KEYS.LAB_COMMIT_NARRATOR_COST_USD_DAILY,
    METRIC_KEYS.CLI_ASK_COMPLETIONS_DAILY,
    METRIC_KEYS.CLI_ASK_COST_USD_DAILY,
    METRIC_KEYS.EMREDOGAN_CLI_NPM_WEEKLY,
    METRIC_KEYS.NOTES_AUDIO_PLAYS,
    METRIC_KEYS.NOTES_DIAGRAM_INTERACTIONS,
    /* V6 observatory adds operator-surface adoption signals that
       were already in METRIC_KEYS but never on the 18-tile grid.
       Section 03 reads these alongside telemetry-visits and
       changelog-visits for the sparkline-of-counts strip. */
    METRIC_KEYS.LAB_IAM_VISITS_DAILY,
    METRIC_KEYS.LAB_PROMPT_RESCUER_VISITS_DAILY,
    METRIC_KEYS.LAB_COMMIT_NARRATOR_VISITS_DAILY,
    METRIC_KEYS.V5_PERCEPTION_PAGE_VISITS,
    METRIC_KEYS.OPERATING_PAGE_VISITS,
  ];
  const snapshots = await Promise.all(allKeys.map((k) => readMetric(k)));
  const byKey = new Map<MetricKey, MetricSnapshot | null>(
    allKeys.map((k, i) => [k, snapshots[i] ?? null]),
  );

  // eslint-disable-next-line react-hooks/purity -- intentional: ISR snapshot timestamp
  const now = Date.now();
  const generatedAt = new Date(now).toISOString();

  if (process.env.NEXT_PUBLIC_V6_TELEMETRY_OBSERVATORY === "1") {
    return (
      <V6TelemetryPage byKey={byKey} now={now} generatedAt={generatedAt} />
    );
  }
  return (
    <LegacyTelemetryPage
      snapshots={snapshots.slice(0, TILES.length)}
      now={now}
      generatedAt={generatedAt}
    />
  );
}

/* ──────────────────────────────────────────────────────────────
 *  V6 observatory layout (Sub-PR 15.1)
 *
 *  Six composed editorial sections + provenance footer.
 *
 *    01 — The Operating Loop: paragraph + 3 inline observations
 *         (Lumina p95, auto-tweet success, lumina-chat npm/week).
 *    02 — Cost & Capacity: 3-col strip
 *         (Bedrock cost · MRR · lab+CLI rolling spend).
 *    03 — Surface Adoption: sparkline-of-counts strip across
 *         /telemetry, /changelog, /lab (sum of 3 experiments),
 *         /v5/perception, /v5/operating.
 *    04 — Lab Throughput: 3-row table — IAM Translator,
 *         Prompt Rescuer, Commit Narrator (completions and cost).
 *    05 — CLI Adoption: 2 inline observations
 *         (ask completions, @emredogan/cli npm/week).
 *    06 — Notes Engagement: 2 inline observations
 *         (audio plays, diagram interactions).
 *
 *  Every metric the V5 18-tile grid surfaced is still surfaced
 *  here; none deleted. Some grouped (lab costs combined into
 *  section 02's rolling sum, CLI cost folded into the same
 *  rolling sum). The 3 individual lab costs re-display in
 *  section 04's per-experiment rows for operator readability.
 * ────────────────────────────────────────────────────────────── */

function V6TelemetryPage({
  byKey,
  now,
  generatedAt,
}: {
  byKey: Map<MetricKey, MetricSnapshot | null>;
  now: number;
  generatedAt: string;
}) {
  /* Section 01 inputs. */
  const luminaP95 = value(byKey.get(METRIC_KEYS.LUMINA_P95_LATENCY) ?? null);
  const autotweet = value(
    byKey.get(METRIC_KEYS.AUTOTWEET_SUCCESS_30D) ?? null,
  );
  const luminaChatNpm = value(
    byKey.get(METRIC_KEYS.LUMINA_CHAT_NPM_WEEKLY) ?? null,
  );

  /* Section 02 inputs. The rolling "experimental spend" sum
     combines the 3 lab cost rolling windows + the CLI ask cost.
     Each individual metric still surfaces in section 04 (lab) and
     section 05 (CLI) at the per-route granularity. */
  const bedrockCost = value(
    byKey.get(METRIC_KEYS.BEDROCK_COST_DAILY) ?? null,
  );
  const mrr = value(byKey.get(METRIC_KEYS.MRR_CURRENT) ?? null);
  const labCosts = [
    value(byKey.get(METRIC_KEYS.LAB_IAM_COST_USD_DAILY) ?? null),
    value(byKey.get(METRIC_KEYS.LAB_PROMPT_RESCUER_COST_USD_DAILY) ?? null),
    value(byKey.get(METRIC_KEYS.LAB_COMMIT_NARRATOR_COST_USD_DAILY) ?? null),
    value(byKey.get(METRIC_KEYS.CLI_ASK_COST_USD_DAILY) ?? null),
  ];
  const anyExperimentalCost = labCosts.some((v) => v !== null);
  const experimentalSpend = anyExperimentalCost
    ? labCosts.reduce<number>((acc, v) => acc + (v ?? 0), 0)
    : null;

  /* Section 03 inputs. /lab visits aggregates the 3 per-experiment
     visit counts. */
  const labVisits = [
    value(byKey.get(METRIC_KEYS.LAB_IAM_VISITS_DAILY) ?? null),
    value(byKey.get(METRIC_KEYS.LAB_PROMPT_RESCUER_VISITS_DAILY) ?? null),
    value(byKey.get(METRIC_KEYS.LAB_COMMIT_NARRATOR_VISITS_DAILY) ?? null),
  ];
  const anyLabVisits = labVisits.some((v) => v !== null);
  const labVisitsAggregate = anyLabVisits
    ? labVisits.reduce<number>((acc, v) => acc + (v ?? 0), 0)
    : null;

  const adoptionEntries = [
    {
      label: "/telemetry",
      count: value(byKey.get(METRIC_KEYS.TELEMETRY_VISITS) ?? null),
    },
    {
      label: "/changelog",
      count: value(byKey.get(METRIC_KEYS.CHANGELOG_VISITS) ?? null),
    },
    { label: "/lab", count: labVisitsAggregate },
    {
      label: "/v5/perception",
      count: value(byKey.get(METRIC_KEYS.V5_PERCEPTION_PAGE_VISITS) ?? null),
    },
    {
      label: "/v5/operating",
      count: value(byKey.get(METRIC_KEYS.OPERATING_PAGE_VISITS) ?? null),
    },
  ];

  /* Section 04 inputs — 3-row lab throughput table. */
  const labRows = [
    {
      label: "IAM Translator",
      completions: value(
        byKey.get(METRIC_KEYS.LAB_IAM_COMPLETIONS_DAILY) ?? null,
      ),
      cost: value(byKey.get(METRIC_KEYS.LAB_IAM_COST_USD_DAILY) ?? null),
    },
    {
      label: "Prompt Rescuer",
      completions: value(
        byKey.get(METRIC_KEYS.LAB_PROMPT_RESCUER_COMPLETIONS_DAILY) ?? null,
      ),
      cost: value(
        byKey.get(METRIC_KEYS.LAB_PROMPT_RESCUER_COST_USD_DAILY) ?? null,
      ),
    },
    {
      label: "Commit Narrator",
      completions: value(
        byKey.get(METRIC_KEYS.LAB_COMMIT_NARRATOR_COMPLETIONS_DAILY) ?? null,
      ),
      cost: value(
        byKey.get(METRIC_KEYS.LAB_COMMIT_NARRATOR_COST_USD_DAILY) ?? null,
      ),
    },
  ];

  /* Section 05 inputs. */
  const cliAskCompletions = value(
    byKey.get(METRIC_KEYS.CLI_ASK_COMPLETIONS_DAILY) ?? null,
  );
  const cliNpm = value(byKey.get(METRIC_KEYS.EMREDOGAN_CLI_NPM_WEEKLY) ?? null);

  /* Section 06 inputs. */
  const notesAudio = value(byKey.get(METRIC_KEYS.NOTES_AUDIO_PLAYS) ?? null);
  const notesDiagrams = value(
    byKey.get(METRIC_KEYS.NOTES_DIAGRAM_INTERACTIONS) ?? null,
  );

  return (
    <main id="main" className="relative min-h-screen bg-black">
      <VisitPing surface="telemetry" />
      <PageAtmosphere variant="operator" />

      <div className="relative z-10 max-w-4xl mx-auto px-6 pt-36 pb-32">

        {/* ───────── HERO ───────── */}
        <Reveal mode="mount" duration={0.8} className="mb-24">
          <span className="text-[10px] sm:text-xs uppercase tracking-widest text-primary/40">
            Telemetry
          </span>
          <h1 className="text-5xl md:text-7xl font-medium tracking-[-0.04em] leading-[0.95] text-primary mt-5">
            <span className="block">Measured,</span>
            <span className="block text-tertiary">not asserted.</span>
          </h1>
          <p className="text-secondary max-w-2xl mt-8 text-base md:text-lg leading-relaxed">
            Six observations of the operating loop, read directly from
            production. Nothing here is hand-curated. Every number is
            measured against a real KV slot — and every empty number is
            empty because the data isn&apos;t there yet, not because
            it&apos;s being withheld.
          </p>
        </Reveal>

        {/* ───────── 01 — THE OPERATING LOOP ───────── */}
        <Reveal duration={0.7} margin="-80px" className="mb-20">
          <SectionHeader index="01" label="The Operating Loop" />
          <p className="text-tertiary text-[14.5px] leading-relaxed max-w-2xl mb-8">
            The three load-bearing signals: how fast the assistant
            answers, how reliably the daily standup ships, and whether
            anyone is actually installing the lumina-chat package.
          </p>
          <div className="space-y-7">
            <Observation
              prefix="Lumina answers in about "
              value={formatInteger(luminaP95)}
              unit="ms"
              suffix=" at the 95th percentile, measured against the last 100 chat completions."
              placeholder="awaiting first chat"
            />
            <Observation
              prefix="The daily auto-tweet cron has shipped "
              value={formatInteger(autotweet)}
              suffix=" successful posts since launch."
              placeholder="cron hasn't fired yet"
            />
            <Observation
              prefix="@emredogan/lumina-chat is installed about "
              value={formatInteger(luminaChatNpm)}
              suffix=" times a week on npm."
              placeholder="0.1.0 not yet on npm"
            />
          </div>
        </Reveal>

        {/* ───────── 02 — COST & CAPACITY ───────── */}
        <Reveal duration={0.7} margin="-80px" className="mb-20">
          <SectionHeader index="02" label="Cost & Capacity" />
          <p className="text-tertiary text-[14.5px] leading-relaxed max-w-2xl mb-8">
            What the platform costs to operate, and what it earns.
            Experimental compute (lab + CLI) sits under a $5/day rolling
            cap per channel — independent budgets per route.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-x-6 gap-y-6 border-t border-white/[0.06] pt-8">
            <CostCell
              label="Bedrock / day"
              value={formatUsd(bedrockCost)}
              placeholder="no Bedrock traffic yet"
              note="Production chat uses Anthropic direct today; key reserved for Phase 3+ Bedrock routes."
            />
            <CostCell
              label="MRR"
              value={formatUsd(mrr, 0)}
              placeholder="no paid tier yet"
              note="Monthly recurring revenue. Hydrates from the Lemon Squeezy webhook in Phase 3."
            />
            <CostCell
              label="Experimental / 36h"
              value={formatUsd(experimentalSpend)}
              placeholder="no spend yet"
              note="Rolling sum of /lab + /api/cli/ask Bedrock spend. Each route has its own independent $5/day cap."
            />
          </div>
        </Reveal>

        {/* ───────── 03 — SURFACE ADOPTION ───────── */}
        <Reveal duration={0.7} margin="-80px" className="mb-20">
          <SectionHeader index="03" label="Surface Adoption" />
          <p className="text-tertiary text-[14.5px] leading-relaxed max-w-2xl mb-8">
            Cumulative session-deduped visits to operator surfaces. The
            tick beneath each count scales logarithmically by relative
            volume — a low-resolution bar chart, not a dashboard widget.
          </p>
          <AdoptionStrip entries={adoptionEntries} />
        </Reveal>

        {/* ───────── 04 — LAB THROUGHPUT ───────── */}
        <Reveal duration={0.7} margin="-80px" className="mb-20">
          <SectionHeader index="04" label="Lab Throughput" />
          <p className="text-tertiary text-[14.5px] leading-relaxed max-w-2xl mb-8">
            Three streaming experiments behind rate-limit + cost-cap
            guards. Completion counts measure adoption; the cost column
            tracks the rolling 36-hour budget consumed.
          </p>
          <div className="border-t border-white/[0.06] pt-8">
            <div className="grid grid-cols-[1fr,auto,auto] gap-x-6 gap-y-1 pb-3 border-b border-white/[0.04]">
              <span className="font-mono uppercase tracking-[0.20em] text-[10px] text-quiet">
                Experiment
              </span>
              <span className="font-mono uppercase tracking-[0.20em] text-[10px] text-quiet text-right">
                Completions
              </span>
              <span className="font-mono uppercase tracking-[0.20em] text-[10px] text-quiet text-right">
                Cost (36h)
              </span>
            </div>
            {labRows.map((row) => (
              <div
                key={row.label}
                className="grid grid-cols-[1fr,auto,auto] gap-x-6 items-baseline py-4 border-b border-white/[0.04]"
              >
                <span className="text-primary text-[15px]">
                  {row.label}
                </span>
                <span className="font-mono text-[15px] text-[#00d2ff] tabular-nums text-right">
                  {row.completions !== null
                    ? formatInteger(row.completions)
                    : "—"}
                </span>
                <span className="font-mono text-[15px] text-secondary tabular-nums text-right">
                  {row.cost !== null ? formatUsd(row.cost) : "—"}
                </span>
              </div>
            ))}
          </div>
        </Reveal>

        {/* ───────── 05 — CLI ADOPTION ───────── */}
        <Reveal duration={0.7} margin="-80px" className="mb-20">
          <SectionHeader index="05" label="CLI Adoption" />
          <p className="text-tertiary text-[14.5px] leading-relaxed max-w-2xl mb-8">
            Terminal users running <code className="font-mono text-[13px] text-primary/80">npx emredogan ask</code> against the production endpoint.
            The cost column for the CLI rolls up into section 02&apos;s
            experimental spend.
          </p>
          <div className="space-y-7">
            <Observation
              prefix="The CLI ask endpoint has completed "
              value={formatInteger(cliAskCompletions)}
              suffix=" streams since launch."
              placeholder="no completions yet"
            />
            <Observation
              prefix="@emredogan/cli is installed about "
              value={formatInteger(cliNpm)}
              suffix=" times a week on npm."
              placeholder="0.1.0 not yet on npm"
            />
          </div>
        </Reveal>

        {/* ───────── 06 — NOTES ENGAGEMENT ───────── */}
        <Reveal duration={0.7} margin="-80px" className="mb-20">
          <SectionHeader index="06" label="Notes Engagement" />
          <p className="text-tertiary text-[14.5px] leading-relaxed max-w-2xl mb-8">
            How readers use the two interactive surfaces inside long-form
            notes. Each signal is session-deduped per (visitor × note).
          </p>
          <div className="space-y-7">
            <Observation
              prefix="The audio version of a note has been played "
              value={formatInteger(notesAudio)}
              suffix=" times."
              placeholder="no plays yet"
              dense
            />
            <Observation
              prefix="The interactive diagram on a note has been opened "
              value={formatInteger(notesDiagrams)}
              suffix=" times."
              placeholder="no interactions yet"
              dense
            />
          </div>
        </Reveal>

        {/* ───────── PROVENANCE FOOTER ───────── */}
        <Reveal duration={0.7}>
          <div className="border-t border-white/[0.06] pt-8 mt-8">
            <p className="text-tertiary text-sm leading-relaxed max-w-2xl mb-4">
              Each observation reads from a single KV slot behind{" "}
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
              <time dateTime={generatedAt} suppressHydrationWarning>
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

/* ── Local helpers for the V6 layout ─────────────────────────── */

function SectionHeader({
  index,
  label,
}: {
  index: string;
  label: string;
}) {
  return (
    <div className="flex items-center gap-3 mb-3">
      <span className="font-mono uppercase tracking-[0.22em] text-[10px] text-[#00d2ff]/85">
        {index}
      </span>
      <span
        aria-hidden="true"
        className="w-6 h-px bg-[#00d2ff]/30"
      />
      <h2 className="text-xl md:text-2xl font-medium tracking-[-0.02em] text-primary">
        {label}
      </h2>
    </div>
  );
}

function CostCell({
  label,
  value,
  placeholder,
  note,
}: {
  label: string;
  value: string | null;
  placeholder: string;
  note: string;
}) {
  return (
    <div>
      <p className="font-mono uppercase tracking-[0.20em] text-[10px] text-tertiary mb-3">
        {label}
      </p>
      {value !== null ? (
        <p className="text-3xl md:text-4xl font-medium text-[#00d2ff] tabular-nums tracking-[-0.02em] leading-none mb-3">
          {value}
        </p>
      ) : (
        <p className="text-xl italic text-tertiary tracking-[-0.01em] leading-none mb-3">
          {placeholder}
        </p>
      )}
      <p className="text-quiet text-[12px] leading-snug">{note}</p>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────
 *  Legacy 18-tile layout (V5 baseline, rollback path)
 *
 *  Preserved verbatim from pre-15.1 page body. When
 *  NEXT_PUBLIC_V6_TELEMETRY_OBSERVATORY is off (default) the page
 *  renders through this branch — byte-identical to the V5 surface.
 * ────────────────────────────────────────────────────────────── */

function LegacyTelemetryPage({
  snapshots,
  now,
  generatedAt,
}: {
  snapshots: (MetricSnapshot | null)[];
  now: number;
  generatedAt: string;
}) {
  const data: TileData[] = TILES.map((spec, i) => ({
    spec,
    snapshot: snapshots[i] ?? null,
  }));

  return (
    <main id="main" className="relative min-h-screen bg-black">
      <VisitPing surface="telemetry" />
      <PageAtmosphere variant="operator" />

      <div className="relative z-10 max-w-6xl mx-auto px-6 pt-36 pb-32">
        <Reveal mode="mount" duration={0.8} className="mb-20">
          <span className="text-[10px] sm:text-xs uppercase tracking-widest text-primary/40">
            Telemetry
          </span>
          <h1 className="text-5xl md:text-7xl font-medium tracking-[-0.04em] leading-[0.95] text-primary mt-5">
            <span className="block">Measured,</span>
            <span className="block text-tertiary">not asserted.</span>
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
              <time dateTime={generatedAt} suppressHydrationWarning>
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
