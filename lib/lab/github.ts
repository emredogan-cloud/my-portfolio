import { Octokit } from "@octokit/rest";

/**
 * GitHub helpers for `/lab/commit-narrator`.
 *
 * V4 Phase 2 — Sub-PR 2.3.
 *
 * Two responsibilities:
 *   1. `parseGitHubRepoUrl` — accept the variety of shapes a
 *      visitor might paste, return a clean `{ owner, repo }` or
 *      `null`. Strict: must be `github.com` (no GitLab, Bitbucket,
 *      enterprise hosts — out of v1 scope).
 *   2. `fetchRecentCommits` — Octokit-backed list-commits call,
 *      capped at 20. Uses `GITHUB_PAT_PUBLIC_REPOS` when present
 *      (5000/hr quota) and falls back to anonymous (60/hr) when
 *      absent. Shaped down to the fields the narrator route +
 *      Claude prompt actually need.
 *
 * Both functions are *server-only* — this module is imported by
 * the route handler under `runtime: "nodejs"`, never by a client
 * component. Octokit bundle stays out of the visitor's JS.
 */

export interface ParsedRepo {
  owner: string;
  repo: string;
  /** Canonical URL for surfacing back to the visitor. */
  url: string;
}

export interface FetchedCommit {
  sha: string;
  /** 7-char display SHA. */
  shortSha: string;
  /** First line of the message. */
  subject: string;
  /** Everything after the blank line beneath the subject — `null`
   *  for subject-only commits. */
  body: string | null;
  author: string;
  /** ISO timestamp of the commit (committer date, NOT author
   *  date — matches what GitHub's UI shows). */
  date: string;
  /** Canonical commit URL on github.com. */
  url: string;
}

/* The slug regex permits the same alphabet GitHub uses:
 *   owner: letters, digits, `-`. Length 1-39.
 *   repo : letters, digits, `-`, `_`, `.`. Length 1-100.
 * We don't enforce GitHub's anti-trailing-hyphen rules — the
 * regex is permissive enough to catch any real repo + strict
 * enough to reject obvious garbage. The actual existence check
 * happens at the Octokit call (404 → caller surfaces a clean
 * error). */
const OWNER_REGEX = /^[a-zA-Z0-9-]{1,39}$/;
const REPO_REGEX = /^[a-zA-Z0-9._-]{1,100}$/;

/**
 * Parse a GitHub repo identifier. Accepts:
 *   - https://github.com/owner/repo
 *   - https://github.com/owner/repo.git
 *   - https://github.com/owner/repo/  (trailing slash)
 *   - http://github.com/owner/repo    (any protocol)
 *   - github.com/owner/repo
 *   - owner/repo                       (shorthand)
 *
 * Returns `null` for anything else — non-GitHub hosts, deeper
 * paths (`/owner/repo/issues`), missing owner or repo, bad chars.
 */
export function parseGitHubRepoUrl(input: string): ParsedRepo | null {
  const raw = input.trim();
  if (!raw) return null;

  /* Strip leading protocol if present, then leading `github.com/`,
   * then trailing `.git` / trailing slashes. What's left should be
   * `owner/repo` (and optionally extra path segments we ignore). */
  let body = raw.replace(/^https?:\/\//i, "");
  if (body.toLowerCase().startsWith("github.com/")) {
    body = body.slice("github.com/".length);
  } else if (body.toLowerCase().startsWith("www.github.com/")) {
    body = body.slice("www.github.com/".length);
  } else if (body.includes("/")) {
    /* Allow the `owner/repo` shorthand only when the input has
     * no host. If it has a `.` in the first segment, it might be
     * a host that isn't github.com — reject. */
    const firstSegment = body.split("/")[0] ?? "";
    if (firstSegment.includes(".") && firstSegment !== "github.com") {
      return null;
    }
  } else {
    return null;
  }

  const segments = body.split("/").filter(Boolean);
  const [owner, repoRaw] = segments;
  if (!owner || !repoRaw) return null;

  /* Strip trailing `.git` from the repo part. */
  const repo = repoRaw.replace(/\.git$/i, "");

  if (!OWNER_REGEX.test(owner)) return null;
  if (!REPO_REGEX.test(repo)) return null;

  return {
    owner,
    repo,
    url: `https://github.com/${owner}/${repo}`,
  };
}

let _octokit: Octokit | null = null;
function getOctokit(): Octokit {
  if (_octokit) return _octokit;
  /* `GITHUB_PAT_PUBLIC_REPOS` is the env var V4 § 6.2.A.5 names.
   * When present, Octokit's auth bumps the rate quota from 60/hr
   * (unauth, per IP) to 5000/hr (auth, per token). Lab usage at
   * 3/IP/hr would never approach 60/hr in practice — the PAT is
   * defensive, not critical. */
  const auth = process.env.GITHUB_PAT_PUBLIC_REPOS;
  _octokit = new Octokit(auth ? { auth } : {});
  return _octokit;
}

interface RawCommit {
  sha: string;
  commit: {
    message: string;
    author?: { name?: string | null; date?: string | null } | null;
    committer?: { date?: string | null } | null;
  };
  author?: { login?: string | null } | null;
  html_url: string;
}

/**
 * Fetch up to `limit` recent commits from the default branch of
 * the given repo. Limit caps at 20 — anything beyond inflates the
 * Claude context past usefulness. Returns `[]` on Octokit error
 * (404, 403, network) — the caller surfaces a clean error.
 */
export async function fetchRecentCommits(
  parsed: ParsedRepo,
  limit: number = 20,
): Promise<FetchedCommit[]> {
  const perPage = Math.min(Math.max(1, Math.floor(limit)), 20);
  try {
    const octokit = getOctokit();
    const res = await octokit.repos.listCommits({
      owner: parsed.owner,
      repo: parsed.repo,
      per_page: perPage,
    });
    if (!Array.isArray(res.data)) return [];
    return res.data.map((c) => shapeCommit(c as RawCommit, parsed));
  } catch (err) {
    /* Surface to console — the route handler captures via Sentry
     * with the parsed slug as a tag. We just return the empty
     * list so the visitor sees "repo not found / private / empty"
     * cleanly. */
    console.warn(
      "[lab:commit-narrator] github fetch failed:",
      err instanceof Error ? err.message : "unknown",
    );
    return [];
  }
}

function shapeCommit(raw: RawCommit, parsed: ParsedRepo): FetchedCommit {
  const message = (raw.commit?.message ?? "").trim();
  const subject = message.split("\n", 1)[0]?.trim() ?? "";
  const bodyRaw = message.split(/\n\n+/).slice(1).join("\n\n").trim();
  const body = bodyRaw.length > 0 ? bodyRaw : null;
  const date =
    raw.commit?.committer?.date ??
    raw.commit?.author?.date ??
    new Date().toISOString();
  const author =
    raw.commit?.author?.name ??
    raw.author?.login ??
    "unknown";
  const sha = raw.sha ?? "";
  return {
    sha,
    shortSha: sha.slice(0, 7),
    subject,
    body,
    author,
    date,
    url: raw.html_url ?? `https://github.com/${parsed.owner}/${parsed.repo}/commit/${sha}`,
  };
}
