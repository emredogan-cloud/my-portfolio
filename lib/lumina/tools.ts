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
 * Each tool is a pure data accessor — no side effects, no external
 * network calls except KV reads (build beacon, telemetry snapshots)
 * + the GitHub Public Events feed for the changelog (KV-cached at
 * 30-min TTL inside `lib/github-events`). All execute() bodies are
 * Edge-compatible (no Node-only deps), matching the chat route's
 * runtime: edge.
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

export const LUMINA_TOOLS = {
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
