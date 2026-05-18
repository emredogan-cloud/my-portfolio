import { kv } from "@vercel/kv";

/**
 * Edge-safe GitHub helpers for the V4 Phase 4 Sub-PR 4.2
 * repo-aware tool group.
 *
 * Posture decisions:
 *   - Direct fetch to api.github.com, NOT Octokit. The chat route
 *     runs on edge (Web Fetch only); Octokit pulls Node-specific
 *     deps and would force the route to nodejs, breaking the
 *     latency contract for every chat — not just the new tools.
 *     Precedent: `lib/github-events.ts` already uses direct fetch
 *     for the same reason.
 *   - Hardcoded `owner/repo`. The portfolio's public repo is the
 *     single allowed surface — `emredogan-cloud/my-portfolio`. The
 *     V4 doc § 5.4 Sub-PR 4.2 requires "public-only repos"; the
 *     simplest enforcement is no path that accepts an arbitrary
 *     `owner/repo` in the first place.
 *   - KV-cached reads with separate TTLs per resource type. File
 *     contents change at every push (1h TTL is a reasonable
 *     freshness/cost tradeoff). Commits are immutable once pushed
 *     (7-day TTL just to expire the KV slot eventually).
 *   - Graceful no-op when KV is unavailable — falls through to a
 *     direct fetch, never blocks the tool from answering.
 *   - Optional `GITHUB_PAT_PUBLIC_REPOS` env var unlocks the
 *     authenticated 5000-req/hr quota when present. Anonymous
 *     fallback uses the 60-req/hr unauthenticated quota.
 *
 * Public surface:
 *   - validateRepoPath(path)  → boolean
 *   - validateCommitSha(sha)  → boolean
 *   - fetchPublicFile({ path })  → { content, sha, size, truncated } | { error }
 *   - fetchCommitDetail({ sha }) → CommitDetail | { error }
 */

const OWNER = "emredogan-cloud";
const REPO = "my-portfolio";
const GITHUB_API = "https://api.github.com";

const FILE_CACHE_PREFIX = "v4:lumina:repo:file:";
const COMMIT_CACHE_PREFIX = "v4:lumina:repo:commit:";
const FILE_CACHE_TTL_SECONDS = 60 * 60; // 1 hour
const COMMIT_CACHE_TTL_SECONDS = 60 * 60 * 24 * 7; // 7 days

const MAX_FILE_BYTES = 50_000;
const MAX_BODY_CHARS = 2000;
const FETCH_TIMEOUT_MS = 4_500;

const hasKv = Boolean(
  process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN,
);

/* ── Validation ────────────────────────────────────────────────── */

/** Repo-relative path: no leading slash, no `..` traversal, no
 *  control chars, max 300 chars. Bytes outside the conservative
 *  alphabet (letters, digits, dot, slash, hyphen, underscore) are
 *  rejected — the repo doesn't contain anything wilder. */
export function validateRepoPath(value: string): boolean {
  if (typeof value !== "string") return false;
  if (value.length === 0 || value.length > 300) return false;
  if (value.startsWith("/") || value.startsWith(".")) return false;
  if (value.includes("..")) return false;
  return /^[a-zA-Z0-9_./\-]+$/.test(value);
}

/** Commit SHA: 7-40 hexadecimal characters. */
export function validateCommitSha(value: string): boolean {
  return typeof value === "string" && /^[0-9a-f]{7,40}$/i.test(value);
}

/* ── Internal: GitHub HTTP wrapper ─────────────────────────────── */

interface FetchedJson<T> {
  ok: true;
  data: T;
}
interface FetchedError {
  ok: false;
  status: number;
  error: string;
}
type FetchedResult<T> = FetchedJson<T> | FetchedError;

function buildHeaders(): HeadersInit {
  const headers: Record<string, string> = {
    Accept: "application/vnd.github+json",
    "User-Agent": "emredogan-portfolio-lumina",
  };
  const token = process.env.GITHUB_PAT_PUBLIC_REPOS;
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
}

async function fetchJson<T>(url: string): Promise<FetchedResult<T>> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      headers: buildHeaders(),
      signal: controller.signal,
      cache: "no-store",
    });
    clearTimeout(timer);
    if (!res.ok) {
      return {
        ok: false,
        status: res.status,
        error:
          res.status === 404
            ? "not-found"
            : res.status === 403
              ? "rate-limited"
              : "github-error",
      };
    }
    const data = (await res.json()) as T;
    return { ok: true, data };
  } catch {
    clearTimeout(timer);
    return { ok: false, status: 0, error: "fetch-failed" };
  }
}

/* ── File reads ────────────────────────────────────────────────── */

export interface FileReadResult {
  path: string;
  sha: string;
  size: number;
  truncated: boolean;
  encoding: "utf8";
  content: string;
}

export interface FileReadError {
  error: string;
  path?: string;
}

interface GitHubContentResponse {
  type: string;
  encoding?: string;
  size?: number;
  content?: string;
  sha?: string;
  path: string;
}

/** Best-effort base64 decode of a GitHub blob content payload.
 *  Falls back to the raw string when atob isn't available (older
 *  edge runtimes) — this is unlikely on modern Vercel edges but
 *  doesn't hurt. */
function decodeBase64Content(raw: string): string {
  const trimmed = raw.replace(/\n/g, "");
  try {
    if (typeof atob === "function") {
      const binary = atob(trimmed);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
      }
      return new TextDecoder("utf-8", { fatal: false }).decode(bytes);
    }
  } catch {
    /* swallow — fall through */
  }
  return trimmed;
}

export async function fetchPublicFile(
  params: { path: string },
): Promise<FileReadResult | FileReadError> {
  const { path } = params;
  if (!validateRepoPath(path)) {
    return { error: "invalid-path", path };
  }

  const cacheKey = `${FILE_CACHE_PREFIX}${path}`;
  if (hasKv) {
    try {
      const cached = await kv.get<FileReadResult>(cacheKey);
      if (cached && typeof cached.content === "string") return cached;
    } catch {
      /* swallow — fall through to fresh fetch */
    }
  }

  const url = `${GITHUB_API}/repos/${OWNER}/${REPO}/contents/${path}`;
  const result = await fetchJson<GitHubContentResponse>(url);
  if (!result.ok) {
    return { error: result.error, path };
  }

  if (result.data.type !== "file") {
    return { error: "not-a-file", path };
  }
  if (!result.data.content || result.data.encoding !== "base64") {
    return { error: "unsupported-encoding", path };
  }

  const rawSize = typeof result.data.size === "number" ? result.data.size : 0;
  const decoded = decodeBase64Content(result.data.content);

  let body = decoded;
  let truncated = false;
  if (body.length > MAX_FILE_BYTES) {
    body = body.slice(0, MAX_FILE_BYTES);
    truncated = true;
  }

  const payload: FileReadResult = {
    path: result.data.path,
    sha: result.data.sha ?? "",
    size: rawSize,
    truncated,
    encoding: "utf8",
    content: body,
  };

  if (hasKv) {
    try {
      await kv.set(cacheKey, payload, { ex: FILE_CACHE_TTL_SECONDS });
    } catch {
      /* swallow — caching is opportunistic */
    }
  }
  return payload;
}

/* ── Commit reads ──────────────────────────────────────────────── */

export interface CommitDetail {
  sha: string;
  shortSha: string;
  subject: string;
  body: string | null;
  why: string | null;
  author: string;
  date: string;
  stats: { additions: number; deletions: number; changedFiles: number };
  url: string;
}

export interface CommitError {
  error: string;
  sha?: string;
}

interface GitHubCommitResponse {
  sha: string;
  html_url: string;
  commit: {
    message: string;
    author: { name?: string; date: string };
    committer: { name?: string; date: string };
  };
  stats?: { additions?: number; deletions?: number; total?: number };
  files?: ReadonlyArray<unknown>;
}

/** Parse a "WHY:" paragraph out of a commit body. Mirrors the
 *  pattern `lib/github-events` uses on the changelog feed —
 *  commits authored under this repo's discipline include a
 *  "Why:" / "WHY:" prefixed paragraph in the body. */
function parseWhyParagraph(body: string | null): string | null {
  if (!body) return null;
  /* `[\s\S]` is the portable cross-newline match — the `s` flag
   * was rejected by the project's TS target (ES2017). */
  const match = body.match(/^(?:why|WHY):\s*([\s\S]+?)(?:\n\n|$)/im);
  return match ? match[1].trim() : null;
}

export async function fetchCommitDetail(
  params: { sha: string },
): Promise<CommitDetail | CommitError> {
  const { sha } = params;
  if (!validateCommitSha(sha)) {
    return { error: "invalid-sha", sha };
  }

  const cacheKey = `${COMMIT_CACHE_PREFIX}${sha.toLowerCase()}`;
  if (hasKv) {
    try {
      const cached = await kv.get<CommitDetail>(cacheKey);
      if (cached && typeof cached.sha === "string") return cached;
    } catch {
      /* swallow */
    }
  }

  const url = `${GITHUB_API}/repos/${OWNER}/${REPO}/commits/${sha}`;
  const result = await fetchJson<GitHubCommitResponse>(url);
  if (!result.ok) {
    return { error: result.error, sha };
  }

  const fullSha = result.data.sha;
  const message = result.data.commit?.message ?? "";
  const [subject, ...rest] = message.split("\n");
  const body = rest.join("\n").trim();
  const trimmedBody = body.length > MAX_BODY_CHARS
    ? `${body.slice(0, MAX_BODY_CHARS)}…`
    : body || null;

  const detail: CommitDetail = {
    sha: fullSha.slice(0, 7),
    shortSha: fullSha.slice(0, 7),
    subject: subject.trim(),
    body: trimmedBody,
    why: parseWhyParagraph(body),
    author: result.data.commit?.author?.name ?? "unknown",
    date:
      result.data.commit?.committer?.date ??
      result.data.commit?.author?.date ??
      "",
    stats: {
      additions: result.data.stats?.additions ?? 0,
      deletions: result.data.stats?.deletions ?? 0,
      changedFiles: result.data.files?.length ?? 0,
    },
    url: result.data.html_url,
  };

  if (hasKv) {
    try {
      await kv.set(cacheKey, detail, { ex: COMMIT_CACHE_TTL_SECONDS });
    } catch {
      /* swallow */
    }
  }
  return detail;
}
