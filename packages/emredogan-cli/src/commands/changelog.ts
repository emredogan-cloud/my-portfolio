import { getApiBase } from "../api-base.js";
import { formatAgo, wrapText } from "../format.js";

/**
 * `emredogan changelog` — print the last 5 commits with their
 * WHY annotations.
 *
 * V4 Phase 2, CLI v0.1.1 expansion. Fetches `/api/cli/changelog`
 * (same KV-cached source as the `/changelog` web page) and
 * renders each commit as a multi-line block in stdout.
 *
 * Render shape:
 *
 *   [shortSha] subject  (repo · ago)
 *     WHY paragraph wrapped at 76 cols with a 4-space indent.
 *     Continued lines align under the WHY.
 *
 *     ---
 *
 * Exit codes:
 *   0  - clean print
 *   2  - network / fetch error
 *   5  - unexpected upstream error
 */

interface RemoteChangelogCommit {
  shortSha: string;
  subject: string;
  why: string | null;
  type: string | null;
  repo: string;
  timestamp: string;
  url: string;
}

interface ChangelogResponse {
  commits: RemoteChangelogCommit[];
}

const WRAP_WIDTH = 76;
const WHY_INDENT = "    ";

export async function runChangelog(): Promise<number> {
  const url = `${getApiBase()}/api/cli/changelog`;
  let res: Response;
  try {
    res = await fetch(url, {
      headers: {
        Accept: "application/json",
        "User-Agent": "emredogan-cli",
      },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "unknown";
    process.stderr.write(`[emredogan] network error: ${msg}\n`);
    return 2;
  }

  if (!res.ok) {
    process.stderr.write(
      `[emredogan] upstream returned ${res.status} while fetching changelog.\n`,
    );
    return 5;
  }

  let body: ChangelogResponse;
  try {
    body = (await res.json()) as ChangelogResponse;
  } catch {
    process.stderr.write(
      `[emredogan] upstream returned non-JSON for /api/cli/changelog.\n`,
    );
    return 5;
  }

  const commits = Array.isArray(body.commits) ? body.commits : [];
  if (commits.length === 0) {
    process.stdout.write("(no recent commits)\n");
    return 0;
  }

  for (let i = 0; i < commits.length; i++) {
    const c = commits[i]!;
    /* Header line: `[shortSha] subject  (repo · ago)`. We wrap
     * only the WHY paragraph; the header stays on one line even
     * if it overflows a narrow terminal — the visitor knows
     * what they pasted in. */
    process.stdout.write(
      `  [${c.shortSha}] ${c.subject}  (${c.repo} · ${formatAgo(
        c.timestamp,
      )})\n`,
    );

    if (c.why) {
      const lines = wrapText(c.why, WRAP_WIDTH, `  ${WHY_INDENT}`);
      for (const line of lines) {
        process.stdout.write(`${line}\n`);
      }
    } else {
      process.stdout.write(`  ${WHY_INDENT}(no WHY paragraph)\n`);
    }

    if (i < commits.length - 1) {
      process.stdout.write("\n");
    }
  }

  return 0;
}
