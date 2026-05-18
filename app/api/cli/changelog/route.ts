import { getRecentCommits } from "@/lib/github-events";

/**
 * CLI changelog endpoint — V4 Phase 2, CLI v0.1.1 expansion.
 *
 * Returns the last N commits in the same `ChangelogCommit` shape
 * the `/changelog` page consumes (V4 Sub-PR 1.4). Reuses
 * `getRecentCommits` directly — both surfaces share the
 * `v4:changelog:commits:v1` KV cache (30-min TTL), so the CLI
 * hit is effectively free after the first warm read.
 *
 * Limit: 5 commits. The CLI prints a multi-line block per commit
 * (subject + repo + time-ago + WHY paragraph) and 20 of those
 * would scroll the terminal off-screen. 5 fits one shell window
 * comfortably.
 *
 * Cache: `s-maxage=1800, stale-while-revalidate=120` matches the
 * underlying KV TTL — visitors hit Vercel's edge cache most of
 * the time and revalidation happens in the background.
 *
 * Runtime: edge. `getRecentCommits` is Web-fetch-backed (no Node
 * APIs); KV reads are edge-safe.
 */

export const runtime = "edge";

const CHANGELOG_LIMIT = 5;

export async function GET() {
  const commits = await getRecentCommits(CHANGELOG_LIMIT);
  return Response.json(
    { commits },
    {
      headers: {
        "Cache-Control":
          "public, s-maxage=1800, stale-while-revalidate=120",
      },
    },
  );
}
