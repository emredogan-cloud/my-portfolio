import { projectsData } from "@/data/projects";

/**
 * Public projects manifest — V4 Phase 2, Sub-PR 2.4.
 *
 * Returns a compact JSON list of the live projects for the
 * `@emredogan/cli` `project list` command. The shape is a small
 * subset of the internal `data/projects.ts` `Project` type —
 * we drop the multi-paragraph `detailedDescription`, `techStack`
 * array, and `images` array because the CLI surfaces a single
 * stdout line per project.
 *
 * Cache: aggressive. The projects manifest changes ~quarterly
 * at most — `Cache-Control: s-maxage=3600, stale-while-revalidate=60`
 * lets Vercel's edge cache serve almost every request from
 * memory, and the SWR window gives us painless rotation when a
 * deploy changes the list.
 *
 * Runtime: edge. No SDK, no KV, no Bedrock — pure data
 * projection. Tiny cold start, sub-50ms latency.
 */

export const runtime = "edge";

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

const CACHE_HEADERS = {
  "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=60",
} as const;

export function GET() {
  const body: ProjectsResponse = {
    projects: projectsData.map((p) => ({
      id: p.id,
      title: p.title,
      blurb: p.shortDescription,
      status: p.status,
      liveUrl: p.liveUrl ?? null,
      githubUrl: p.githubUrl ?? null,
    })),
  };
  return Response.json(body, { headers: CACHE_HEADERS });
}
