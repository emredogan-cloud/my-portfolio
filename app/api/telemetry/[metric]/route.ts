import { readMetric, METRIC_KEYS, type MetricKey } from "@/lib/telemetry/metrics";

/**
 * Public read-only telemetry endpoint.
 *
 * `/api/telemetry/<slug>` returns one metric snapshot as JSON. The
 * slug whitelist below is the single source of truth for what a
 * caller can read — everything else is `404`. This is the surface
 * Lumina (tool-use) + external dashboards + manual debugging all
 * consume; the public `/telemetry` page reads through the same
 * `lib/telemetry/metrics` module directly to skip the HTTP hop.
 *
 * Cache: `s-maxage=300, stale-while-revalidate=60` matches V4
 * § 5.1.2's "5-dakika cache". Visitors hit Vercel's edge cache
 * first; revalidation happens in the background when stale.
 *
 * Runtime: edge. KV reads are Web Fetch-backed; no Node APIs
 * touched.
 */

export const runtime = "edge";

/* Slug → KV key whitelist. Keys are the only writable space; slugs
 * are how outside callers refer to them. Decoupling lets us evolve
 * KV schema (per V4 § 2.13) without breaking the public URL contract. */
const SLUG_TO_KEY: Record<string, MetricKey> = {
  "lumina-p95": METRIC_KEYS.LUMINA_P95_LATENCY,
  "bedrock-cost": METRIC_KEYS.BEDROCK_COST_DAILY,
  "autotweet-success": METRIC_KEYS.AUTOTWEET_SUCCESS_30D,
  "npm-downloads": METRIC_KEYS.LUMINA_CHAT_NPM_WEEKLY,
  mrr: METRIC_KEYS.MRR_CURRENT,
  "telemetry-visits": METRIC_KEYS.TELEMETRY_VISITS,
  "changelog-visits": METRIC_KEYS.CHANGELOG_VISITS,
  "lab-iam-visits": METRIC_KEYS.LAB_IAM_VISITS_DAILY,
  "lab-iam-completions": METRIC_KEYS.LAB_IAM_COMPLETIONS_DAILY,
  "lab-iam-cost": METRIC_KEYS.LAB_IAM_COST_USD_DAILY,
  "lab-prompt-rescuer-visits": METRIC_KEYS.LAB_PROMPT_RESCUER_VISITS_DAILY,
  "lab-prompt-rescuer-completions":
    METRIC_KEYS.LAB_PROMPT_RESCUER_COMPLETIONS_DAILY,
  "lab-prompt-rescuer-cost":
    METRIC_KEYS.LAB_PROMPT_RESCUER_COST_USD_DAILY,
  "lab-commit-narrator-visits":
    METRIC_KEYS.LAB_COMMIT_NARRATOR_VISITS_DAILY,
  "lab-commit-narrator-completions":
    METRIC_KEYS.LAB_COMMIT_NARRATOR_COMPLETIONS_DAILY,
  "lab-commit-narrator-cost":
    METRIC_KEYS.LAB_COMMIT_NARRATOR_COST_USD_DAILY,
  "cli-ask-visits": METRIC_KEYS.CLI_ASK_VISITS_DAILY,
  "cli-ask-completions": METRIC_KEYS.CLI_ASK_COMPLETIONS_DAILY,
  "cli-ask-cost": METRIC_KEYS.CLI_ASK_COST_USD_DAILY,
  "cli-downloads-weekly": METRIC_KEYS.EMREDOGAN_CLI_NPM_WEEKLY,
  "notes-audio-plays": METRIC_KEYS.NOTES_AUDIO_PLAYS,
  "notes-diagram-interactions":
    METRIC_KEYS.NOTES_DIAGRAM_INTERACTIONS,
};

const CACHE_HEADERS = {
  "Cache-Control": "public, s-maxage=300, stale-while-revalidate=60",
} as const;

interface TelemetryResponse {
  metric: string;
  value: number | null;
  updated_at: string | null;
}

export async function GET(
  _req: Request,
  ctx: RouteContext<"/api/telemetry/[metric]">,
) {
  const { metric: slug } = await ctx.params;
  const key = SLUG_TO_KEY[slug];

  if (!key) {
    return Response.json(
      {
        error: "Unknown metric.",
        slug,
        known: Object.keys(SLUG_TO_KEY),
      },
      { status: 404, headers: { "Cache-Control": "no-store" } },
    );
  }

  const snapshot = await readMetric(key);
  const body: TelemetryResponse = {
    metric: slug,
    value: snapshot?.value ?? null,
    updated_at: snapshot?.updated_at ?? null,
  };

  return Response.json(body, { headers: CACHE_HEADERS });
}
