import { tool } from "ai";
import { z } from "zod";
import { kv } from "@vercel/kv";
import { projectsData, type Project } from "@/data/projects";
import { notesData, type Note } from "@/data/notes";

/**
 * Lumina tool registry.
 *
 * Each tool is a pure data accessor — no side effects, no external
 * network calls except KV reads for the build beacon state already
 * written by /api/github-webhook. All execute() bodies are
 * Edge-compatible (no Node-only deps), matching the chat route's
 * runtime: edge.
 *
 * Why not more tools (e.g. live AWS scans, blog drafts, etc.):
 *  - the registry is whitelisted via system-prompt descriptions, and
 *    every tool surfaces in the UI as "Lumina is checking …". Adding
 *    tools that don't return value visitors care about would just be
 *    visual noise.
 *  - data/projects.ts + data/notes.ts already cover ~95% of what
 *    visitors actually ask Lumina about; the build beacon adds
 *    "what was Emre just doing".
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
} as const;
