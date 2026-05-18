import { tool } from "ai";
import { z } from "zod";
import { kv } from "@vercel/kv";
import { projectsData, type Project } from "@/data/projects";
import { notesData, type Note } from "@/data/notes";
import { readMetric, METRIC_KEYS } from "@/lib/telemetry/metrics";
import { getRecentCommits } from "@/lib/github-events";
import { LAB_EXPERIMENTS } from "@/lib/lab/registry";

/**
 * Lumina tool registry.
 *
 * Static tools are pure data accessors — no side effects, no external
 * network calls except KV reads (build beacon, telemetry snapshots)
 * + the GitHub Public Events feed for the changelog (KV-cached at
 * 30-min TTL inside `lib/github-events`). All static execute() bodies
 * are Edge-compatible (no Node-only deps), matching the chat route's
 * runtime: edge.
 *
 * Lab-invocation tools (Sub-PR 3.2) require per-request context —
 * the originating Request's IP headers — so they're exposed via
 * `createLuminaTools(req)` rather than the static export. They
 * loopback-fetch the existing `/api/lab/*` nodejs routes (which run
 * Bedrock); the chat route can't import the Bedrock SDK directly
 * because it would crash the edge runtime (precedent:
 * `app/api/cwh-demo/route.ts`). The loopback forwards `x-real-ip`
 * and `x-forwarded-for` so rate-limit and cost-cap budgets stay
 * attributed to the originating visitor — invoking a lab experiment
 * via Lumina costs the same rate-limit slot as invoking it directly
 * from the lab page.
 *
 * Tool groups
 *   Portfolio reads  — listProjects, getProjectDetails, searchNotes,
 *                      getRecentCommits. The 4 original v2 tools.
 *   Operator reads   — getCurrentTelemetry, getRecentEngineering,
 *                      getLabStatus. V3 expansion (Sub-PR 3.1) that
 *                      gives Lumina sharp, calm, infrastructure-
 *                      native awareness of the platform's own state.
 *                      The reads tap the same KV + lib primitives
 *                      that /telemetry, /changelog, and /lab already
 *                      consume — no new infrastructure.
 *   Lab invocation   — translateIamPolicy, rescuePrompt,
 *                      narrateCommits. V3 expansion (Sub-PR 3.2)
 *                      that lets Lumina run the three existing /lab
 *                      experiments on behalf of the visitor. Each
 *                      tool is an HTTP-loopback to the corresponding
 *                      /api/lab/* nodejs route — same rate-limit,
 *                      same cost cap, same telemetry counters as a
 *                      direct visitor invocation.
 *
 * Why not more tools (e.g. live AWS scans, blog drafts, etc.):
 *  - the registry is whitelisted via system-prompt descriptions, and
 *    every tool surfaces in the UI as "Lumina is checking …". Adding
 *    tools that don't return value visitors care about would just be
 *    visual noise.
 *  - V4 § 4.4 Sub-PR 4.2 lists 3 additional repo-aware tools
 *    (file-read, diff-read, etc.); those are write-adjacent and
 *    land in a later sub-PR if they earn it.
 */

const hasKv = Boolean(
  process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN,
);

interface LastCommit {
  at: string;
  repo: string;
  message: string;
  sha: string;
}

// Trimmed shape returned to the model — strips fields that would
// just inflate the token count (full image arrays, etc.).
function summarizeProject(p: Project) {
  return {
    id: p.id,
    title: p.title,
    status: p.status,
    shortDescription: p.shortDescription,
    techStack: p.techStack,
    liveUrl: p.liveUrl ?? null,
    githubUrl: p.githubUrl ?? null,
    detailedDescription: p.detailedDescription,
  };
}

function summarizeNote(n: Note) {
  return {
    slug: n.slug,
    title: n.title,
    excerpt: n.excerpt,
    date: n.date,
    readTime: n.readTime,
    tags: n.tags,
  };
}

const STATIC_TOOLS = {
  /**
   * Lists every project Emre has documented in this portfolio. Returns
   * compact summaries (id + title + status + shortDescription) so the
   * model can pick which one to drill into via getProjectDetails.
   * Use this first when the visitor asks a generic "what projects has
   * he built" or "what's he working on".
   */
  listProjects: tool({
    description:
      "List all projects in Emre's portfolio with their ids, titles, status, and one-sentence descriptions. Use this when the visitor asks broadly about his work, or as a first step before getProjectDetails when you don't know the project id yet.",
    inputSchema: z.object({}).strict(),
    execute: async () => {
      return projectsData.map((p) => ({
        id: p.id,
        title: p.title,
        status: p.status,
        shortDescription: p.shortDescription,
      }));
    },
  }),

  /**
   * Returns full detail (description + tech stack + URLs) for a single
   * project by id. The id matches the URL slug at /projects/{id}, e.g.
   * "aws-waste-hunter" or "vibing-coder-ai".
   */
  getProjectDetails: tool({
    description:
      "Return the full case-study record for one project: detailed description, tech stack, status, live URL if any, GitHub URL if any. The projectId matches the slug at /projects/{id} — for example 'aws-waste-hunter', 'vibing-coder-ai', 'sixpack-ai'. Call listProjects first if you don't already know the id.",
    inputSchema: z.object({
      projectId: z
        .string()
        .min(1)
        .describe(
          "The project id (slug). Must match an id returned by listProjects.",
        ),
    }).strict(),
    execute: async ({ projectId }) => {
      const project = projectsData.find((p) => p.id === projectId);
      if (!project) {
        return { error: "not-found", projectId };
      }
      return summarizeProject(project);
    },
  }),

  /**
   * Search Emre's long-form notes (technical write-ups). Lightweight
   * substring match across title + excerpt + tags + body. Returns up
   * to 5 hits; if the visitor asks broadly ("what has he written
   * about") just call with an empty query.
   */
  searchNotes: tool({
    description:
      "Search Emre's long-form notes for a query string. Matches across title, excerpt, tags, and body. Returns at most 5 hits (slug + title + excerpt + date + tags). Pass an empty query to list every note.",
    inputSchema: z.object({
      query: z
        .string()
        .describe(
          "Free-text search term. Empty string lists every note (newest first).",
        ),
    }).strict(),
    execute: async ({ query }) => {
      const q = query.trim().toLowerCase();
      const haystack =
        q === ""
          ? notesData
          : notesData.filter((n) => {
              const blob = (
                n.title +
                " " +
                n.excerpt +
                " " +
                n.tags.join(" ") +
                " " +
                n.body
              ).toLowerCase();
              return blob.includes(q);
            });
      return haystack.slice(0, 5).map(summarizeNote);
    },
  }),

  /**
   * Returns the most recent commit Emre shipped (head commit of his
   * last `git push`). Sourced from the same KV key the Build Beacon
   * polls — the GitHub webhook keeps it fresh within ~60s.
   */
  getRecentCommits: tool({
    description:
      "Return Emre's most recent code push: timestamp, repository name, commit message, and SHA. Use when the visitor asks 'what's he working on right now', 'last commit', 'what did he just ship'.",
    inputSchema: z.object({}).strict(),
    execute: async () => {
      if (!hasKv) {
        return { error: "kv-unavailable" };
      }
      try {
        const record = await kv.get<LastCommit>("build:last_commit");
        if (!record) {
          return { error: "no-commit-recorded" };
        }
        return record;
      } catch {
        return { error: "kv-read-failed" };
      }
    },
  }),

  /* ── Operator-awareness tools (Sub-PR 3.1) ────────────────
   *
   * The three tools below give Lumina sharp, calm, infrastructure-
   * native awareness of the platform's own state. They read the
   * same data surfaces the `/telemetry` dashboard, `/changelog`
   * page, and `/lab` index already consume — same KV namespace,
   * same caching semantics — so adding them carries zero new
   * infrastructure and zero new failure modes beyond what the
   * existing public surfaces already shipped.
   *
   * Voice contract (see lib/lumina/system-prompt § "Operator
   * awareness"): when Lumina invokes these, the model is
   * instructed to read the result as an operator would — terse,
   * specific, no breathless dashboard summary. */

  /**
   * Return a curated snapshot of platform telemetry: Lumina p95
   * latency, auto-tweet successes, IAM translator runs, weekly
   * npm downloads, notes audio plays. Six metrics — the same
   * subset surfaced by /api/cli/telemetry and the CLI's
   * `emredogan telemetry` command.
   */
  getCurrentTelemetry: tool({
    description:
      "Return a snapshot of the platform's current operational telemetry: Lumina p95 latency, auto-tweet successes (lifetime), IAM translator completions, weekly npm downloads for @emredogan/lumina-chat and @emredogan/cli, and notes audio plays. Use when the visitor asks operator-shaped questions: 'how is the platform doing', 'what's the current Lumina latency', 'how many people have used the lab', 'is the auto-tweet cron healthy'. Do NOT invoke this for casual questions — only when the visitor is genuinely asking about platform state. Read the result like an operator: name the metric, the value, the freshness. Skip metrics that are null (no data yet) rather than padding the answer.",
    inputSchema: z.object({}).strict(),
    execute: async () => {
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
      return {
        metrics: [
          {
            label: "lumina p95 latency",
            value: p95?.value ?? null,
            unit: "ms",
            updated_at: p95?.updated_at ?? null,
          },
          {
            label: "auto-tweet successes",
            value: autotweetSuccesses?.value ?? null,
            updated_at: autotweetSuccesses?.updated_at ?? null,
          },
          {
            label: "iam translator runs",
            value: iamRuns?.value ?? null,
            updated_at: iamRuns?.updated_at ?? null,
          },
          {
            label: "@emredogan/lumina-chat weekly",
            value: luminaChatDls?.value ?? null,
            unit: "downloads/week",
            updated_at: luminaChatDls?.updated_at ?? null,
          },
          {
            label: "@emredogan/cli weekly",
            value: cliDls?.value ?? null,
            unit: "downloads/week",
            updated_at: cliDls?.updated_at ?? null,
          },
          {
            label: "notes audio plays",
            value: audioPlays?.value ?? null,
            updated_at: audioPlays?.updated_at ?? null,
          },
        ],
      };
    },
  }),

  /**
   * Return the last 5 commits Emre pushed, each with the WHY
   * paragraph the public /changelog page parses out of the
   * commit body. Sourced from `lib/github-events.getRecentCommits`
   * — the same KV-cached read the /changelog page uses (30-min
   * TTL), so this tool's marginal cost is one cache hit per
   * conversation in the warm case.
   */
  getRecentEngineering: tool({
    description:
      "Return the last 5 commits Emre pushed, with subject, repo, timestamp, and the WHY paragraph parsed from the commit body. Use when the visitor asks about recent shipping: 'what has he shipped this week', 'what's the latest engineering work', 'what changes landed recently'. Different from getRecentCommits (which returns ONE commit — the head) — this returns five with context for each. Read each commit conversationally: subject, when, and what the WHY paragraph says. Skip the SHA unless the visitor specifically asks.",
    inputSchema: z.object({}).strict(),
    execute: async () => {
      try {
        const commits = await getRecentCommits(5);
        return {
          commits: commits.map((c) => ({
            sha: c.sha,
            subject: c.subject,
            why: c.why,
            type: c.type,
            repo: c.repo,
            timestamp: c.timestamp,
            url: c.url,
          })),
        };
      } catch {
        return { error: "changelog-unavailable" };
      }
    },
  }),

  /**
   * Return the current state of the /lab experiment registry
   * plus the last-run timestamp for each cron-driven surface
   * (auto-tweet daily / weekly). Snapshot only — no per-IP rate-
   * limit or cost-cap data (those are KV-bucketed per slug ×
   * IP and not designed for tool-time aggregation).
   */
  getLabStatus: tool({
    description:
      "Return the current /lab experiment registry: each entry's name, purpose, status (active | coming-soon | archived), and URL. Use when the visitor asks: 'what experiments are running', 'what's in the lab', 'is the IAM translator live', 'what can I try'. Answer with the active experiments first; mention coming-soon entries only if relevant.",
    inputSchema: z.object({}).strict(),
    execute: async () => {
      return {
        experiments: LAB_EXPERIMENTS.map((e) => ({
          slug: e.slug,
          name: e.name,
          purpose: e.purpose,
          status: e.status,
          url: `/lab/${e.slug}`,
        })),
      };
    },
  }),
} as const;

/**
 * Backwards-compat re-export. The legacy `LUMINA_TOOLS` symbol resolves
 * to the static 7-tool set. Production code (the chat route) imports
 * `createLuminaTools(req)` which extends this with the lab-invocation
 * tools that require per-request context.
 */
export const LUMINA_TOOLS = STATIC_TOOLS;

/* ── Lab-invocation tools (Sub-PR 3.2) ──────────────────────
 *
 * Edge → nodejs HTTP loopback. The chat route can't import the
 * Bedrock SDK (edge incompatibility), so we POST to the existing
 * `/api/lab/*` nodejs routes the same way a visitor's browser
 * does — but with the visitor's IP headers forwarded, so the
 * rate-limit and cost-cap budgets on the lab side stay attributed
 * to the originating visitor instead of an internal Vercel hop.
 *
 * Response shape: the lab routes stream `text/plain; charset=utf-8`.
 * `response.text()` buffers the entire body — fine here because
 * the model can't consume a stream as a tool result anyway. The
 * tool returns `{ text }` for success or `{ error, ...details }`
 * mirroring the lab route's own error codes (rate-limited /
 * daily-cost-cap-reached / sandbox-offline / etc.) so Lumina's
 * system prompt can give the visitor the right verbal hand-off.
 */

const MAX_LAB_OUTPUT_CHARS = 7000;

/** Resolve the absolute base URL of the originating request — works
 *  in dev (`http://localhost:3000`), preview, and production. */
function getBaseUrl(req: Request): string {
  return new URL(req.url).origin;
}

/** Build the headers used for internal lab POSTs. Forwards the
 *  visitor's IP so per-IP rate limits remain meaningful. */
function buildLoopbackHeaders(req: Request): HeadersInit {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  const realIp = req.headers.get("x-real-ip");
  const forwardedFor = req.headers.get("x-forwarded-for");
  if (realIp) headers["x-real-ip"] = realIp;
  if (forwardedFor) headers["x-forwarded-for"] = forwardedFor;
  return headers;
}

/** Cap the model-visible payload so a runaway lab response can't
 *  blow the chat turn's token budget. The lab routes themselves
 *  cap output via max_tokens; this is the second-line guard. */
function capLabOutput(text: string): string {
  if (text.length <= MAX_LAB_OUTPUT_CHARS) return text;
  return `${text.slice(0, MAX_LAB_OUTPUT_CHARS)}\n\n[output truncated at ${MAX_LAB_OUTPUT_CHARS} chars]`;
}

interface LabErrorPayload {
  error: string;
  [k: string]: unknown;
}

/** Single HTTP loopback call against one of the lab routes. Returns
 *  either the buffered text or a structured error object that the
 *  caller hands back to the model verbatim. */
async function invokeLab(
  req: Request,
  path: string,
  body: Record<string, unknown>,
): Promise<{ text: string } | LabErrorPayload> {
  let response: Response;
  try {
    response = await fetch(`${getBaseUrl(req)}${path}`, {
      method: "POST",
      headers: buildLoopbackHeaders(req),
      body: JSON.stringify(body),
    });
  } catch {
    return { error: "lab-unreachable" };
  }

  if (!response.ok) {
    /* Lab routes return JSON errors with `{error, ...}`. Pass them
     * through so the prompt can route on the code. */
    try {
      const payload = (await response.json()) as LabErrorPayload;
      return payload;
    } catch {
      return { error: "lab-error", status: response.status };
    }
  }

  const text = await response.text();
  return { text: capLabOutput(text.trim()) };
}

function createLabInvocationTools(req: Request) {
  return {
    /**
     * Run the IAM Translator experiment for the visitor. Same path
     * a direct /lab/iam-translator visit would take, with the
     * visitor's IP forwarded so rate-limits and cost caps stay
     * coherent across surfaces.
     */
    translateIamPolicy: tool({
      description:
        "Run the IAM Policy Translator experiment for the visitor: parse an AWS IAM policy JSON and return a structured plain-English explanation. Use when the visitor has pasted (or clearly intends to paste) a JSON IAM policy and asks for a translation, audit, or risk reading. Do NOT invoke for generic 'what does an IAM policy do' questions — call this only when there's actual policy text to translate. Returns the lab's full structured output verbatim. Hand off to /lab/iam-translator if the policy is large (over 4 KB) or if the visitor wants to iterate on edits — the lab page has the proper editor surface.",
      inputSchema: z
        .object({
          policy: z
            .string()
            .min(1)
            .describe(
              "The raw IAM policy JSON text — pass exactly what the visitor provided, do not reformat or summarize. The lab route does its own JSON validation.",
            ),
        })
        .strict(),
      execute: async ({ policy }) => {
        return invokeLab(req, "/api/lab/iam-translate", { policy });
      },
    }),

    /**
     * Run the Prompt Rescuer experiment. Takes the visitor's prose
     * prompt and returns a six-section engineering rewrite.
     */
    rescuePrompt: tool({
      description:
        "Run the Prompt Rescuer experiment for the visitor: take a vague or thin prose prompt and return a six-section engineering rewrite (Diagnosis, Rewrite, Rationale, etc.). Use when the visitor has pasted a prompt they want strengthened, or describes one they intend to send to a model. Do NOT invoke for meta questions about prompt engineering ('how do I write better prompts'); only when there's an actual prompt to rescue. Hand off to /lab/prompt-rescuer if they want to iterate or compare rewrites.",
      inputSchema: z
        .object({
          prompt: z
            .string()
            .min(12)
            .describe(
              "The visitor's prompt text — pass it verbatim, no rewording. The lab route enforces its own 12-char minimum and 4000-char maximum.",
            ),
        })
        .strict(),
      execute: async ({ prompt }) => {
        return invokeLab(req, "/api/lab/prompt-rescue", { prompt });
      },
    }),

    /**
     * Run the Commit Narrator experiment. Highest-cost of the three
     * lab tools — fetches up to 20 commits from GitHub then runs a
     * larger Bedrock context. Per the system prompt, Lumina prefers
     * to hand off to the lab page URL unless the visitor explicitly
     * asks for an in-conversation run.
     */
    narrateCommits: tool({
      description:
        "Run the Commit Narrator experiment for the visitor: fetch the last 20 commits from a public GitHub repository and return a per-commit narration with the engineering 'why' inferred from each subject + body. Use ONLY when the visitor has explicitly pasted a github.com/owner/repo URL AND asked Lumina to narrate or summarize it inline. For exploratory mentions ('check this repo', 'what about XYZ'), respond by pointing them to /lab/commit-narrator instead — this tool runs a heavier Bedrock call (up to ~8 s) and consumes a 3/hr rate-limit slot, so should not fire speculatively. Hand off after one invocation per conversation; do not chain.",
      inputSchema: z
        .object({
          url: z
            .string()
            .min(1)
            .describe(
              "A github.com/owner/repo URL — pass exactly what the visitor provided. The lab route does its own URL parsing and rejects anything that isn't a GitHub repo URL.",
            ),
        })
        .strict(),
      execute: async ({ url }) => {
        return invokeLab(req, "/api/lab/narrate-commits", { url });
      },
    }),
  };
}

/**
 * Build the full Lumina tool registry for one chat request. Static
 * data-accessor tools are merged with the per-request lab-invocation
 * tools that close over the originating Request (for IP forwarding
 * and base URL resolution). Call this per request from the chat
 * route handler — do NOT cache the result across requests.
 */
export function createLuminaTools(req: Request) {
  return {
    ...STATIC_TOOLS,
    ...createLabInvocationTools(req),
  };
}
