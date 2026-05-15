/**
 * Canonical site URL resolution. Resolved at build/request time on the
 * server. Order of precedence:
 *
 *   1. NEXT_PUBLIC_SITE_URL    — explicit override, set when a custom
 *                                domain is wired in front of Vercel.
 *   2. VERCEL_PROJECT_PRODUCTION_URL — host of the Vercel production
 *                                deployment (no scheme), e.g.
 *                                "my-portfolio.vercel.app".
 *   3. Localhost fallback      — for `next build` outside Vercel.
 *
 * Always returns an absolute URL with no trailing slash so callers
 * can safely append `/sitemap.xml`, `/notes/...`, etc.
 */
export function getSiteUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL;
  if (explicit) return explicit.replace(/\/$/, "");

  const vercelHost = process.env.VERCEL_PROJECT_PRODUCTION_URL;
  if (vercelHost) return `https://${vercelHost}`;

  return "http://localhost:3000";
}
