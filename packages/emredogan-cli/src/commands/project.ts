import { getApiBase } from "../api-base.js";

/**
 * `emredogan project list` — print live projects to stdout.
 *
 * Fetches the public `/api/projects` JSON endpoint and renders
 * each entry as four mono-readable lines: title + role on one
 * line, blurb wrapped on the next, then github + live URLs.
 *
 * Exit codes:
 *   0  - clean print
 *   1  - usage error (unknown subcommand)
 *   2  - network / fetch error
 *   5  - unexpected upstream error
 */

interface PublicProject {
  id: string;
  title: string;
  blurb: string;
  status: string;
  liveUrl: string | null;
  githubUrl: string | null;
}

interface ProjectsResponse {
  projects: PublicProject[];
}

export async function runProject(subcommand: string | undefined): Promise<number> {
  if (subcommand !== "list") {
    process.stderr.write(
      `[emredogan] unknown project subcommand: ${subcommand ?? "(none)"}\n` +
        `usage: emredogan project list\n`,
    );
    return 1;
  }

  const url = `${getApiBase()}/api/projects`;
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
      `[emredogan] upstream returned ${res.status} while fetching projects.\n`,
    );
    return 5;
  }

  let body: ProjectsResponse;
  try {
    body = (await res.json()) as ProjectsResponse;
  } catch {
    process.stderr.write(
      `[emredogan] upstream returned non-JSON for /api/projects.\n`,
    );
    return 5;
  }

  if (!Array.isArray(body.projects) || body.projects.length === 0) {
    process.stdout.write("(no projects listed)\n");
    return 0;
  }

  for (let i = 0; i < body.projects.length; i++) {
    const p = body.projects[i]!;
    process.stdout.write(`${p.title}  [${p.status}]\n`);
    process.stdout.write(`  ${p.blurb}\n`);
    if (p.liveUrl) process.stdout.write(`  live   ${p.liveUrl}\n`);
    if (p.githubUrl) process.stdout.write(`  github ${p.githubUrl}\n`);
    if (i < body.projects.length - 1) process.stdout.write("\n");
  }
  return 0;
}
