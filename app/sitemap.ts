import type { MetadataRoute } from "next";
import { projectsData } from "@/data/projects";
import { notesData } from "@/data/notes";
import { codexBooks } from "@/data/codex";
import { getSiteUrl } from "@/lib/site-url";

const STATIC_ROUTES = [
  "/",
  "/about",
  "/projects",
  "/stack",
  "/notes",
  "/codex",
  "/contact",
  "/architecture",
  "/architecture/cloud-waste-hunter",
  "/architecture/vibing-coder-ai",
  "/architecture/sixpack-ai",
  "/pro",
  "/telemetry",
  "/changelog",
  "/evolution",
  "/lab",
  "/lab/iam-translator",
  "/lab/prompt-rescuer",
  "/lab/commit-narrator",
  "/lab/cli",
] as const;

export default function sitemap(): MetadataRoute.Sitemap {
  const base = getSiteUrl();
  const now = new Date();

  const staticEntries: MetadataRoute.Sitemap = STATIC_ROUTES.map((path) => ({
    url: `${base}${path}`,
    lastModified: now,
    changeFrequency: "monthly",
    priority: path === "/" ? 1.0 : 0.7,
  }));

  const projectEntries: MetadataRoute.Sitemap = projectsData.map((p) => ({
    url: `${base}/projects/${p.id}`,
    lastModified: now,
    changeFrequency: "monthly",
    priority: 0.6,
  }));

  const noteEntries: MetadataRoute.Sitemap = notesData.map((n) => ({
    url: `${base}/notes/${n.slug}`,
    lastModified: now,
    changeFrequency: "monthly",
    priority: 0.6,
  }));

  const codexEntries: MetadataRoute.Sitemap = codexBooks.map((b) => ({
    url: `${base}/codex/${b.slug}`,
    lastModified: now,
    changeFrequency: "monthly",
    priority: 0.6,
  }));

  return [...staticEntries, ...projectEntries, ...noteEntries, ...codexEntries];
}
