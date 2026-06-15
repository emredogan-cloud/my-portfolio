/**
 * Canonical site URL resolution. Evaluated on the server at build /
 * request time — `metadataBase`, every per-page `canonical`, the
 * OpenGraph/Twitter `url` fields, the JSON-LD Person `url`, the sitemap,
 * robots, and the auto-tweet share links all read from here, so this is
 * the single source of truth for the site's absolute origin. Order of
 * precedence:
 *
 *   1. NEXT_PUBLIC_SITE_URL — explicit override. Set in the Vercel
 *                             project env (or .env.local) to pin the
 *                             origin without a code change. Always wins.
 *   2. Production           — https://emredogan.work, the live custom
 *                             domain wired in front of Vercel. Returned
 *                             for every production deployment so
 *                             canonical / OG / sitemap URLs resolve to
 *                             the real domain regardless of what Vercel
 *                             reports for the project host.
 *   3. Preview              — the per-deployment Vercel host
 *                             (VERCEL_URL), so branch previews stay
 *                             self-referential and never leak the
 *                             production domain into preview metadata.
 *   4. Localhost            — local `next dev` / `next build` and any
 *                             other non-Vercel environment.
 *
 * Always returns an absolute URL with no trailing slash so callers can
 * safely append `/sitemap.xml`, `/notes/...`, etc.
 */

/** The live production origin — the canonical custom domain. */
export const PRODUCTION_SITE_URL = "https://emredogan.work";

export function getSiteUrl(): string {
  // 1. Explicit override always wins (custom domain pinned via env).
  const explicit = process.env.NEXT_PUBLIC_SITE_URL;
  if (explicit) return explicit.replace(/\/$/, "");

  // 2. Production deployments resolve to the live custom domain.
  if (process.env.VERCEL_ENV === "production") return PRODUCTION_SITE_URL;

  // 3. Preview / branch deployments stay self-referential so OG cards
  //    and absolute links resolve within the preview itself. Prefer the
  //    per-deployment VERCEL_URL; fall back to the project production
  //    host for any older preview runner that only exposes that.
  if (process.env.VERCEL_ENV === "preview") {
    const previewHost =
      process.env.VERCEL_URL ?? process.env.VERCEL_PROJECT_PRODUCTION_URL;
    if (previewHost) return `https://${previewHost}`;
  }

  // 4. Local development / non-Vercel build.
  return "http://localhost:3000";
}
