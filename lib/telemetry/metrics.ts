import { kv } from "@vercel/kv";

/**
 * V4 Phase 1 — Sub-PR 1.2: telemetry primitives.
 *
 * The public `/telemetry` dashboard and the `/api/telemetry/[metric]`
 * edge route both read through this module. The chat + auto-tweet
 * routes write through it. Outside callers should not touch KV
 * directly for these keys — the whitelist + graceful-no-op pattern
 * lives here, in one place, so the dashboard schema is governable.
 *
 * Schema (V4 § 2.13):
 *   v4:telemetry:<system>:<metric>:<bucket>
 *   v4:cost:<system>:<date>:<usd>
 *   v4:adoption:<system>:<date>:<count>
 *   v4:monetization:<metric>:<period>
 *
 * For Sub-PR 1.2 v1 we ship the five keys named verbatim in
 * V4 § 6.1.B SUB-PR 1.2 step 1. Some carry implementation
 * simplifications that Sub-PR 1.3 / 1.5 will refine:
 *
 *   - p95 latency: single rolling 100-sample window kept under one
 *     KV key. "hourly" suffix preserved for forward compatibility
 *     when Sub-PR 1.5 splits into per-hour buckets.
 *   - autotweet success: incrementing counter, not yet a true 30-day
 *     window — that lands when Sub-PR 1.3 (auto-tweet 2.0) refactors
 *     the post path. The "30d" suffix is kept so the schema doesn't
 *     drift between sub-PRs.
 *   - npm weekly downloads + MRR: writable from here but not yet
 *     populated. The npm poll will arrive with the Sub-PR 1.5
 *     batch (Sentry + Sponsors + README polish + external feeds).
 *     MRR fills in via the Lemon Squeezy webhook in Phase 3.
 *
 * Graceful no-op contract (mirrors lib/lumina/memory.ts):
 *   - Without KV env, every write is a silent no-op and every read
 *     returns `null`. The dashboard renders a placeholder per
 *     metric — the page never 5xx's on missing infra.
 *   - KV reads/writes are wrapped in try/catch; any thrown error is
 *     swallowed and treated as "no data". Telemetry is decorative —
 *     it never blocks the caller route's primary work.
 */

export const METRIC_KEYS = {
  /** Rolling p95 of Lumina chat full-request latency in ms.
   *  Sample window: last 100 requests. */
  LUMINA_P95_LATENCY: "v4:telemetry:lumina:p95_latency:hourly",
  /** Daily Bedrock cost in USD. Not wired in v1 — production chat
   *  uses @ai-sdk/anthropic direct (not AWS Bedrock). The key is
   *  reserved for Phase 3+ when CWH Pro / agent routes move to
   *  Bedrock for cost-controlled inference. */
  BEDROCK_COST_DAILY: "v4:cost:bedrock:daily:USD",
  /** Cumulative count of successful auto-tweet POSTs. The "30d"
   *  suffix is forward-compatible with Sub-PR 1.3's windowed
   *  counter; for v1 it's the lifetime sum since launch. */
  AUTOTWEET_SUCCESS_30D: "v4:adoption:autotweet:success:30d",
  /** Weekly npm downloads of @emredogan/lumina-chat. Populated by
   *  a future external poll (npm API). Null until first poll. */
  LUMINA_CHAT_NPM_WEEKLY: "v4:adoption:lumina-chat-npm:weekly",
  /** Current monthly recurring revenue in USD. Placeholder $0 until
   *  the Lemon Squeezy webhook → KV is wired in Phase 3. */
  MRR_CURRENT: "v4:monetization:mrr:current",
  /** Cumulative visit count for /telemetry. Incremented by the
   *  client-side VisitPing island. Self-referential per V4 § 5.1.2. */
  TELEMETRY_VISITS: "v4:telemetry:dashboard:visits",
  /** Cumulative visit count for /changelog. Per V4 § 5.1.4. */
  CHANGELOG_VISITS: "v4:telemetry:changelog:visits",
  /** Cumulative count of POSTs to /api/lab/iam-translate that
   *  passed the rate-limit + cost-cap guards. One per visitor
   *  attempt. V4 § 5.1.2 SUB-PR 2.1 schema entry. */
  LAB_IAM_VISITS_DAILY: "v4:adoption:lab:iam:visits_daily",
  /** Cumulative count of /api/lab/iam-translate streams that
   *  completed without throwing. Drives the conversion-rate read
   *  on the /telemetry dashboard tile. */
  LAB_IAM_COMPLETIONS_DAILY: "v4:adoption:lab:iam:completions_daily",
  /** Cumulative estimated USD cost for the IAM translator today
   *  (rolling 36-h TTL). Incremented from
   *  `lib/lab/rate-limit:recordEstimatedCost`. */
  LAB_IAM_COST_USD_DAILY: "v4:cost:lab:iam:usd_daily",
  /** Cumulative count of POSTs to /api/lab/prompt-rescue that
   *  passed the rate-limit + cost-cap guards. V4 § 5.1.2 SUB-PR
   *  2.2 schema entry — uses the full `prompt-rescuer` slug
   *  verbatim, matching the URL (unlike IAM's short `iam`
   *  schema slug). */
  LAB_PROMPT_RESCUER_VISITS_DAILY:
    "v4:adoption:lab:prompt-rescuer:visits_daily",
  /** Cumulative count of /api/lab/prompt-rescue streams that
   *  completed without throwing. */
  LAB_PROMPT_RESCUER_COMPLETIONS_DAILY:
    "v4:adoption:lab:prompt-rescuer:completions_daily",
  /** Cumulative estimated USD cost for prompt-rescuer today
   *  (rolling 36-h TTL). Separate from the IAM key so per-
   *  experiment cost-cap reads stay independent. */
  LAB_PROMPT_RESCUER_COST_USD_DAILY:
    "v4:cost:lab:prompt-rescuer:usd_daily",
  /** Cumulative count of POSTs to /api/lab/narrate-commits that
   *  passed the rate-limit + cost-cap guards. V4 § 5.1.2 SUB-PR
   *  2.3 schema entry. */
  LAB_COMMIT_NARRATOR_VISITS_DAILY:
    "v4:adoption:lab:commit-narrator:visits_daily",
  /** Cumulative count of /api/lab/narrate-commits streams that
   *  completed without throwing. */
  LAB_COMMIT_NARRATOR_COMPLETIONS_DAILY:
    "v4:adoption:lab:commit-narrator:completions_daily",
  /** Cumulative estimated USD cost for commit-narrator today
   *  (rolling 36-h TTL). Independent of the IAM + prompt-rescuer
   *  budgets — per-experiment cost-cap isolation. */
  LAB_COMMIT_NARRATOR_COST_USD_DAILY:
    "v4:cost:lab:commit-narrator:usd_daily",
  /** Cumulative count of POSTs to /api/cli/ask that passed the
   *  rate-limit + cost-cap guards. Per V4 § 2.4 telemetry slot
   *  for the @emredogan/cli `ask` command. */
  CLI_ASK_VISITS_DAILY: "v4:adoption:cli:ask:visits_daily",
  /** Cumulative count of /api/cli/ask streams that completed
   *  without throwing. */
  CLI_ASK_COMPLETIONS_DAILY: "v4:adoption:cli:ask:completions_daily",
  /** Cumulative estimated USD cost for the CLI ask endpoint
   *  today (rolling 36-h TTL). Independent of the /lab budgets. */
  CLI_ASK_COST_USD_DAILY: "v4:cost:cli:ask:usd_daily",
  /** Weekly npm downloads of @emredogan/cli. Populated by an
   *  external poll of the npm API (same pattern as
   *  LUMINA_CHAT_NPM_WEEKLY). Null until first poll lands in a
   *  later sub-PR. */
  EMREDOGAN_CLI_NPM_WEEKLY: "v4:adoption:emredogan-cli:downloads_weekly",
  /** Cumulative count of `<audio>` play events on notes pages.
   *  Fired client-side from AudioPlayer's onPlay handler via the
   *  existing /api/telemetry/visit endpoint. Per V4 § 5.2.5. */
  NOTES_AUDIO_PLAYS: "v4:adoption:notes:audio_plays",
  /** Cumulative count of first-interaction events on a notes
   *  InteractiveDiagram (node click / drag). One per session,
   *  guarded by sessionStorage so a single curious visitor
   *  doesn't run up the counter. Per V4 § 5.2.5. */
  NOTES_DIAGRAM_INTERACTIONS:
    "v4:adoption:notes:diagram_interactions",
  /** Cumulative visit count for /lumina/brain — Lumina's public
   *  transparency surface (system architecture, tool registry,
   *  memory contract, runtime topology). V4 Phase 4 Sub-PR 4.1,
   *  per § 2.3 (Public Transparency Disiplini). Same pattern as
   *  TELEMETRY_VISITS / CHANGELOG_VISITS — incremented by the
   *  VisitPing client island via /api/telemetry/visit. */
  LUMINA_BRAIN_VISITS: "v4:telemetry:lumina-brain:visits",
  /** Cumulative visit count for /lumina/failures — Lumina's public
   *  corrections log. V4 Phase 4 Sub-PR 4.1 sibling of
   *  LUMINA_BRAIN_VISITS. */
  LUMINA_FAILURES_VISITS: "v4:telemetry:lumina-failures:visits",
} as const;

export type MetricKey = (typeof METRIC_KEYS)[keyof typeof METRIC_KEYS];

export interface MetricSnapshot {
  /** The metric value at last write. */
  value: number;
  /** ISO-8601 timestamp of the most recent write. */
  updated_at: string;
}

const hasKv = Boolean(
  process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN,
);

/* Rolling-histogram retention. 100 samples is enough for a stable
 * p95 at low-traffic Phase 1 volumes (the dashboard reads p95, not
 * a full distribution), and keeps the JSON-array KV item well under
 * 1 KB. Older samples drop off the front of the array. */
const HISTOGRAM_MAX_SAMPLES = 100;
/* Per-sample cap. Anything above one minute is almost certainly a
 * hung edge invocation, not a real latency. Capping prevents a
 * single bad data point from skewing the p95 forever. */
const SAMPLE_CAP_MS = 60_000;

function isMetricSnapshot(value: unknown): value is MetricSnapshot {
  return (
    typeof value === "object" &&
    value !== null &&
    "value" in value &&
    typeof (value as MetricSnapshot).value === "number" &&
    "updated_at" in value &&
    typeof (value as MetricSnapshot).updated_at === "string"
  );
}

/**
 * Set the absolute value of a scalar metric. Used for placeholders
 * (MRR), external-poll metrics (npm DLs), and any metric where the
 * latest write fully replaces the prior state.
 *
 * No-op when KV is unavailable or `value` is not finite.
 */
export async function recordMetric(
  key: MetricKey,
  value: number,
): Promise<void> {
  if (!hasKv) return;
  if (!Number.isFinite(value)) return;
  try {
    const snapshot: MetricSnapshot = {
      value,
      updated_at: new Date().toISOString(),
    };
    await kv.set(key, snapshot);
  } catch {
    /* swallow — telemetry never blocks the caller's primary work */
  }
}

/**
 * Increment a counter metric atomically. Used for "events happened"
 * metrics (auto-tweet success, future request counters). Tracks the
 * updated_at separately at `${key}:updated_at` because @vercel/kv
 * (Upstash) doesn't expose a single atomic incr-plus-set.
 *
 * No-op when KV is unavailable or `delta` is not finite.
 */
export async function incrementMetric(
  key: MetricKey,
  delta = 1,
): Promise<void> {
  if (!hasKv) return;
  if (!Number.isFinite(delta) || delta <= 0) return;
  try {
    await kv.incrby(key, Math.floor(delta));
    await kv.set(`${key}:updated_at`, new Date().toISOString());
  } catch {
    /* swallow */
  }
}

/**
 * Append a latency sample (ms) to a rolling 100-sample window and
 * recompute p95 in place. The sample list lives at `${key}:samples`;
 * the headline p95 snapshot lives at `key` so reads stay a single
 * `kv.get` and the dashboard never has to compute percentiles
 * client-side.
 *
 * No-op when KV is unavailable or `ms` is negative / non-finite.
 */
export async function recordLatencySample(
  key: MetricKey,
  ms: number,
): Promise<void> {
  if (!hasKv) return;
  if (!Number.isFinite(ms) || ms < 0) return;
  try {
    const sample = Math.min(Math.round(ms), SAMPLE_CAP_MS);
    const samplesKey = `${key}:samples`;
    const prior = (await kv.get<number[]>(samplesKey)) ?? [];
    const next = [...prior, sample];
    if (next.length > HISTOGRAM_MAX_SAMPLES) {
      next.splice(0, next.length - HISTOGRAM_MAX_SAMPLES);
    }
    const p95 = percentile(next, 95);
    await kv.set(samplesKey, next);
    const snapshot: MetricSnapshot = {
      value: p95,
      updated_at: new Date().toISOString(),
    };
    await kv.set(key, snapshot);
  } catch {
    /* swallow */
  }
}

/**
 * Read a metric snapshot. Returns `null` when KV is unavailable,
 * the key has never been written, the read errors, or the stored
 * value is not in the expected shape.
 *
 * Handles three storage shapes transparently:
 *   1. MetricSnapshot — written by recordMetric / recordLatencySample
 *   2. number — written by incrementMetric (counter case); the
 *      updated_at lives at `${key}:updated_at`
 *   3. anything else — treated as "no data" and surfaces as null
 */
export async function readMetric(
  key: MetricKey,
): Promise<MetricSnapshot | null> {
  if (!hasKv) return null;
  try {
    const stored = await kv.get<MetricSnapshot | number>(key);
    if (stored === null || stored === undefined) return null;
    if (typeof stored === "number") {
      const ts = await kv.get<string>(`${key}:updated_at`);
      return {
        value: stored,
        updated_at:
          typeof ts === "string" ? ts : new Date().toISOString(),
      };
    }
    if (isMetricSnapshot(stored)) return stored;
    return null;
  } catch {
    return null;
  }
}

/* ── Lumina tool telemetry + eval (Sub-PR 4.3) ──────────────────
 *
 * The 13-tool Lumina registry needs per-tool observability without
 * adding 26 entries to METRIC_KEYS. We use a single KV hash per
 * metric class — Upstash supports HINCRBY for atomic field
 * increments and HGETALL for a single-round-trip read. Compatible
 * with @vercel/kv's hash surface.
 *
 * Schema (V4 § 2.13 extension):
 *   v4:adoption:lumina-tools:invocations  → hash { toolName: count }
 *   v4:adoption:lumina-tools:errors       → hash { toolName: count }
 *   v4:eval:lumina-tools:summary          → string (JSON eval blob)
 *
 * `error` here means EITHER an exception thrown inside execute()
 * OR an execute() return value of shape `{ error: ... }`. From the
 * operator's POV both are "this tool didn't deliver useful output";
 * splitting them isn't useful at the Phase 4 maturity stage.
 *
 * All four helpers are graceful no-ops when KV is unavailable. */

export const LUMINA_TOOL_INVOCATIONS_HASH_KEY =
  "v4:adoption:lumina-tools:invocations";
export const LUMINA_TOOL_ERRORS_HASH_KEY =
  "v4:adoption:lumina-tools:errors";
/** Sub-PR 4.5 — router decision counter. Hash field per agent id
 *  (e.g. "lumina", "architecture-critic"). Visible on the brain
 *  page once Sub-PR 4.5's transparency loop ships, just like the
 *  per-tool counts. */
export const LUMINA_ROUTER_DECISIONS_HASH_KEY =
  "v4:adoption:lumina-router:decisions";

/** Increment the invocation counter for a single tool. Fire-and-
 *  forget from the tool wrapper — never blocks the chat turn. */
export async function recordToolInvocation(name: string): Promise<void> {
  if (!hasKv) return;
  if (!name || typeof name !== "string") return;
  try {
    await kv.hincrby(LUMINA_TOOL_INVOCATIONS_HASH_KEY, name, 1);
  } catch {
    /* swallow */
  }
}

/** Increment the error counter for a single tool. Counts both
 *  thrown exceptions and `{error: ...}` return values. */
export async function recordToolError(name: string): Promise<void> {
  if (!hasKv) return;
  if (!name || typeof name !== "string") return;
  try {
    await kv.hincrby(LUMINA_TOOL_ERRORS_HASH_KEY, name, 1);
  } catch {
    /* swallow */
  }
}

/** Read the entire invocation hash. Returns an empty object when KV
 *  is unavailable, the hash hasn't been touched yet, or the read
 *  errors. Used by /lumina/brain and the eval script. */
export async function readToolInvocationCounts(): Promise<
  Record<string, number>
> {
  if (!hasKv) return {};
  try {
    const stored = await kv.hgetall<Record<string, number | string>>(
      LUMINA_TOOL_INVOCATIONS_HASH_KEY,
    );
    if (!stored || typeof stored !== "object") return {};
    return normaliseHashNumbers(stored);
  } catch {
    return {};
  }
}

/** Read the entire error hash. Same shape + failure posture as
 *  readToolInvocationCounts. */
export async function readToolErrorCounts(): Promise<
  Record<string, number>
> {
  if (!hasKv) return {};
  try {
    const stored = await kv.hgetall<Record<string, number | string>>(
      LUMINA_TOOL_ERRORS_HASH_KEY,
    );
    if (!stored || typeof stored !== "object") return {};
    return normaliseHashNumbers(stored);
  } catch {
    return {};
  }
}

/** Increment the router-decision counter for a given agent id.
 *  Fired fire-and-forget from the chat route after every routing
 *  decision — never blocks the chat turn. */
export async function recordRoutingDecision(agent: string): Promise<void> {
  if (!hasKv) return;
  if (!agent || typeof agent !== "string") return;
  try {
    await kv.hincrby(LUMINA_ROUTER_DECISIONS_HASH_KEY, agent, 1);
  } catch {
    /* swallow */
  }
}

/** Read all router-decision counts. Returns an empty object on
 *  miss / error, same posture as the tool-count readers. */
export async function readRoutingDecisions(): Promise<
  Record<string, number>
> {
  if (!hasKv) return {};
  try {
    const stored = await kv.hgetall<Record<string, number | string>>(
      LUMINA_ROUTER_DECISIONS_HASH_KEY,
    );
    if (!stored || typeof stored !== "object") return {};
    return normaliseHashNumbers(stored);
  } catch {
    return {};
  }
}

/* @vercel/kv returns hash field values as strings sometimes (Upstash
 * REST quirk depending on the API version) and as numbers others.
 * Normalise to number, dropping anything that doesn't parse. */
function normaliseHashNumbers(
  raw: Record<string, number | string>,
): Record<string, number> {
  const out: Record<string, number> = {};
  for (const [k, v] of Object.entries(raw)) {
    const n = typeof v === "number" ? v : Number(v);
    if (Number.isFinite(n)) out[k] = n;
  }
  return out;
}

function percentile(values: number[], p: number): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  /* Linear interpolation between adjacent indices — the same flavour
   * numpy.percentile defaults to. Stable for a 100-sample window and
   * avoids the off-by-one issue you get from naive index math at
   * small N (where ceil and floor land on the same element). */
  const idx = (p / 100) * (sorted.length - 1);
  const lo = Math.floor(idx);
  const hi = Math.ceil(idx);
  const lower = sorted[lo] ?? 0;
  const upper = sorted[hi] ?? 0;
  return Math.round(lower + (upper - lower) * (idx - lo));
}
