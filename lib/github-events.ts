import { kv } from "@vercel/kv";

/**
 * V4 Phase 1 — Sub-PR 1.4: GitHub events ingestion for /changelog.
 *
 * Walks GitHub's public events feed for `emredogan-cloud`, flattens
 * PushEvents into individual commit entries, and exposes a typed
 * surface that /changelog can render without re-shaping the raw API
 * response.
 *
 * Caching contract (V4 § 5.1.4): 30-minute KV cache keyed by user.
 * Cold path: hit GitHub, write to KV. Warm path: read KV. Anonymous
 * GitHub allows 60 req/hr/IP — at one cold hit per 30 min we never
 * approach the ceiling.
 *
 * Why a separate module from the existing /api/github-feed route:
 *   - github-feed serves raw events JSON for the homepage live feed;
 *     this surface shapes commits for the changelog UI.
 *   - github-feed caches under `gh-feed:emredogan-cloud` (1 h TTL);
 *     changelog caches under `v4:changelog:commits:v1` (30 m TTL) so
 *     refreshes hit at the cadence /changelog actually needs.
 *   - WHY parsing is opinionated to commit-message convention and
 *     belongs near the consumer, not the raw-feed proxy.
 *
 * Graceful no-op contract: when KV is unavailable, fall through to a
 * direct GitHub fetch each call. When GitHub itself is unavailable,
 * return an empty array so /changelog renders a "no recent activity"
 * state rather than 5xx'ing.
 */

const KV_CACHE_KEY = "v4:changelog:commits:v1";
const KV_CACHE_TTL_SECONDS = 30 * 60; // 30 minutes
const GITHUB_USER = "emredogan-cloud";
const GITHUB_EVENTS_URL = `https://api.github.com/users/${GITHUB_USER}/events/public`;
const DEFAULT_LIMIT = 50;

const hasKv = Boolean(
  process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN,
);

interface RawCommit {
  sha: string;
  message: string;
  author?: { name?: string; email?: string };
  url?: string;
}

interface RawPushEvent {
  id: string;
  type: string;
  actor: { login: string };
  repo: { name: string };
  created_at: string;
  payload: {
    commits?: RawCommit[];
    head?: string;
    ref?: string;
  };
}

export interface ChangelogCommit {
  /** Short SHA (7 chars), used for display + the GitHub URL. */
  sha: string;
  /** The full SHA (40 chars) — used for the canonical commit URL. */
  fullSha: string;
  /** First line of the commit message — the imperative subject. */
  subject: string;
  /** First paragraph after the blank line beneath the subject. Null
   *  when the commit has no body (subject-only commits). */
  why: string | null;
  /** Conventional-commit type extracted from the subject prefix
   *  (`feat`, `fix`, `chore`, `phase4-v4`, etc.). Null when the
   *  message has no `<type>:` prefix or `<type>(<scope>):` shape. */
  type: string | null;
  /** Repo short name (e.g. `my-portfolio`, not `emredogan-cloud/my-portfolio`). */
  repo: string;
  /** ISO timestamp when GitHub recorded the push. */
  timestamp: string;
  /** Author display name, falling back to `actor.login` from the push. */
  author: string;
  /** Canonical commit URL on github.com. */
  url: string;
}

/**
 * Parse the WHY paragraph from a full commit message.
 *
 * Convention: subject line, blank line, then a paragraph or more of
 * motivation. We grab the text from the first non-blank line after
 * the first blank line, up to the next blank line (so a single
 * paragraph). Returns null when no body exists or it's whitespace.
 */
function parseWhy(message: string): string | null {
  const parts = message.split(/\n\n+/);
  if (parts.length < 2) return null;
  const body = parts[1]?.trim();
  if (!body) return null;
  /* Collapse internal newlines inside the paragraph into spaces so
   * the UI can render the WHY as a single fluid sentence-or-two. */
  const collapsed = body.replace(/\s*\n\s*/g, " ").trim();
  /* Cap at 280 chars — anything beyond reads as a long-form note
   * not a changelog line. Keeps the card stack uniform. */
  if (collapsed.length > 280) {
    return collapsed.slice(0, 279) + "…";
  }
  return collapsed;
}

/**
 * Pull the conventional-commit type out of a subject line. Handles:
 *   feat: ...
 *   fix(scope): ...
 *   phase4-v4: ship X
 *   chore(deps): ...
 *
 * Returns null when no `<type>[(scope)]:` prefix is present.
 */
function parseType(subject: string): string | null {
  const match = /^([a-z][a-z0-9-]*)(?:\(([^)]+)\))?:/i.exec(subject);
  if (!match) return null;
  return match[1] ?? null;
}

function shapeCommit(
  raw: RawCommit,
  repo: string,
  timestamp: string,
  actorLogin: string,
): ChangelogCommit {
  const message = (raw.message ?? "").trim();
  const subject = message.split("\n", 1)[0]?.trim() ?? "";
  const why = parseWhy(message);
  const type = parseType(subject);
  const fullSha = raw.sha ?? "";
  const sha = fullSha.slice(0, 7);
  return {
    sha,
    fullSha,
    subject,
    why,
    type,
    repo,
    timestamp,
    author: raw.author?.name ?? actorLogin,
    url: `https://github.com/${GITHUB_USER}/${repo}/commit/${fullSha}`,
  };
}

async function fetchEventsFromGitHub(): Promise<RawPushEvent[]> {
  try {
    const res = await fetch(GITHUB_EVENTS_URL, {
      headers: {
        "User-Agent": "emredogan.com /changelog",
        Accept: "application/vnd.github+json",
      },
      cache: "no-store",
    });
    if (!res.ok) return [];
    const data = (await res.json()) as RawPushEvent[];
    if (!Array.isArray(data)) return [];
    return data.filter((e) => e?.type === "PushEvent");
  } catch {
    return [];
  }
}

/**
 * Read the cached commit list from KV. Returns null when KV is
 * unavailable, the key is unset, the value is the wrong shape, or
 * the read errors.
 */
async function readCache(): Promise<ChangelogCommit[] | null> {
  if (!hasKv) return null;
  try {
    const cached = await kv.get<ChangelogCommit[]>(KV_CACHE_KEY);
    if (!Array.isArray(cached)) return null;
    return cached;
  } catch {
    return null;
  }
}

async function writeCache(commits: ChangelogCommit[]): Promise<void> {
  if (!hasKv) return;
  try {
    await kv.set(KV_CACHE_KEY, commits, { ex: KV_CACHE_TTL_SECONDS });
  } catch {
    /* swallow — the page can re-fetch on the next render */
  }
}

/**
 * Walk the recent PushEvents, flatten to individual commits, sort
 * newest-first, and cap at `limit`. This is what /changelog renders.
 *
 * Each call:
 *   1. Check KV cache → return on hit
 *   2. Cache miss → fetch fresh from GitHub
 *   3. Shape into ChangelogCommit[]
 *   4. Write back to KV (best-effort, never blocks return)
 */
export async function getRecentCommits(
  limit: number = DEFAULT_LIMIT,
): Promise<ChangelogCommit[]> {
  const cached = await readCache();
  if (cached) return cached.slice(0, limit);

  const events = await fetchEventsFromGitHub();
  const out: ChangelogCommit[] = [];
  for (const event of events) {
    const commits = event.payload?.commits;
    if (!Array.isArray(commits) || commits.length === 0) continue;
    const repo = event.repo.name.split("/").pop() ?? event.repo.name;
    /* Push payloads list commits oldest-first. We reverse so the
     * tip commit of each push reads first within its bucket. */
    for (let i = commits.length - 1; i >= 0; i--) {
      const c = commits[i];
      if (!c?.sha || !c.message) continue;
      out.push(shapeCommit(c, repo, event.created_at, event.actor.login));
    }
  }
  /* The events feed is already newest-first; the reverse above
   * keeps that ordering at the commit level too. We still sort
   * defensively in case GitHub ever changes the ordering. */
  out.sort((a, b) => b.timestamp.localeCompare(a.timestamp));

  /* Persist the full set; callers slice on demand so a small-limit
   * caller doesn't poison the cache for a large-limit caller. */
  void writeCache(out);

  return out.slice(0, limit);
}

/**
 * Unique repo names in the current commit set, ordered by recency.
 * Used by /changelog's filter UI to populate the project picker
 * without a second GitHub round-trip.
 */
export function uniqueRepos(commits: readonly ChangelogCommit[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const c of commits) {
    if (!seen.has(c.repo)) {
      seen.add(c.repo);
      out.push(c.repo);
    }
  }
  return out;
}
