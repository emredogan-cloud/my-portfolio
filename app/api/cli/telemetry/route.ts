import { readMetric, METRIC_KEYS } from "@/lib/telemetry/metrics";

/**
 * CLI telemetry endpoint — V4 Phase 2, CLI v0.1.1 expansion.
 *
 * Returns a curated subset of the 18 tiles on the public
 * `/telemetry` dashboard — the six metrics most relevant for a
 * developer running `npx emredogan telemetry` from a shell.
 *
 * The curation is intentional: the dashboard reads as a public
 * observability surface (it shows MRR placeholders, Bedrock cost
 * reservations, etc.); the CLI version reads as a quick "is the
 * platform alive" snapshot for engineers — Lumina latency, the
 * three adoption counters, and the npm download numbers.
 *
 * Cache: `s-maxage=300, stale-while-revalidate=60` — matches the
 * dashboard's revalidate cadence. Edge runtime; six parallel KV
 * reads complete in ~50ms total.
 */

export const runtime = "edge";

interface CliMetric {
  /** Stable slug for the metric — clients render this verbatim
   *  as the row label, so we keep it lowercase + mono-friendly. */
  slug: string;
  /** Human label shown in the CLI table. */
  label: string;
  /** Current value (or null when KV is empty / the metric hasn't
   *  hit its first datapoint). */
  value: number | null;
  /** Optional unit token rendered after the value. */
  unit?: string;
  /** ISO timestamp of the last write — the CLI computes "X ago"
   *  client-side via `lib/format.formatAgo`. */
  updated_at: string | null;
}

interface CliTelemetryResponse {
  metrics: CliMetric[];
}

const CACHE_HEADERS = {
  "Cache-Control": "public, s-maxage=300, stale-while-revalidate=60",
} as const;

export async function GET() {
  const [
    p95,
    autotweetSuccesses,
    iamRuns,
    luminaChatDls,
    cliDls,
    audioPlays,
  ] = await Promise.all([
    readMetric(METRIC_KEYS.LUMINA_P95_LATENCY),
    readMetric(METRIC_KEYS.AUTOTWEET_SUCCESS_30D),
    readMetric(METRIC_KEYS.LAB_IAM_COMPLETIONS_DAILY),
    readMetric(METRIC_KEYS.LUMINA_CHAT_NPM_WEEKLY),
    readMetric(METRIC_KEYS.EMREDOGAN_CLI_NPM_WEEKLY),
    readMetric(METRIC_KEYS.NOTES_AUDIO_PLAYS),
  ]);

  const body: CliTelemetryResponse = {
    metrics: [
      {
        slug: "lumina-p95",
        label: "lumina p95 latency",
        value: p95?.value ?? null,
        unit: "ms",
        updated_at: p95?.updated_at ?? null,
      },
      {
        slug: "autotweet-success",
        label: "auto-tweet successes",
        value: autotweetSuccesses?.value ?? null,
        updated_at: autotweetSuccesses?.updated_at ?? null,
      },
      {
        slug: "lab-iam-completions",
        label: "iam translator runs",
        value: iamRuns?.value ?? null,
        updated_at: iamRuns?.updated_at ?? null,
      },
      {
        slug: "lumina-chat-weekly",
        label: "@emredogan/lumina-chat",
        value: luminaChatDls?.value ?? null,
        unit: "/wk",
        updated_at: luminaChatDls?.updated_at ?? null,
      },
      {
        slug: "cli-weekly",
        label: "@emredogan/cli",
        value: cliDls?.value ?? null,
        unit: "/wk",
        updated_at: cliDls?.updated_at ?? null,
      },
      {
        slug: "notes-audio-plays",
        label: "notes audio plays",
        value: audioPlays?.value ?? null,
        updated_at: audioPlays?.updated_at ?? null,
      },
    ],
  };

  return Response.json(body, { headers: CACHE_HEADERS });
}
