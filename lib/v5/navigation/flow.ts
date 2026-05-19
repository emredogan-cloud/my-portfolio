/**
 * V5 Phase 6 Sub-PR 6.2 — path → flow-slug helpers.
 *
 * The 6.1 perception schema accepts `navigation-flow` events with
 * a bucket of shape `<from-slug>>` or `<from-slug>>to-slug`, where
 * each slug is kebab-case ASCII (per
 * `isValidDynamicBucket` in `lib/v5/perception/buckets.ts`).
 *
 * Pathnames from Next.js `usePathname()` look like `/projects/cwh`
 * or `/lumina/brain/architecture-critic`. This module:
 *
 *   - Normalises a pathname to a single kebab-case slug
 *     (`/projects/cwh` → `projects-cwh`).
 *   - Builds the bucket label for the perception endpoint from a
 *     previous + next path pair.
 *   - Refuses to emit a slug for anything that doesn't look like
 *     a stable, public route (query strings, fragments, deep
 *     dynamic segments). When in doubt, return `null` so the
 *     observer drops the event rather than poison the aggregate.
 *
 * Pure data; no DOM access; edge-safe.
 *
 * What this module does NOT do:
 *   - It does NOT fire HTTP. The observer
 *     (`components/v5/CognitionAwareNavigationObserver.tsx`) is
 *     the only HTTP caller.
 *   - It does NOT enforce consent. The endpoint enforces consent;
 *     this layer just shapes the bucket label.
 */

/** Maximum slug length per path side. Mirrors the 41-char cap in
 *  the `isValidDynamicBucket` regex (a kebab slug plus 40 chars of
 *  payload). Keeps the aggregate bucket cardinality bounded. */
const MAX_SLUG_LENGTH = 41;

/** Pathnames that should never appear in navigation-flow buckets.
 *  Either internal Next.js plumbing or routes that would inflate
 *  the bucket cardinality without adding signal. */
const PATH_DENYLIST: ReadonlySet<string> = new Set([
  "/_not-found",
  "/manifest.webmanifest",
  "/robots.txt",
  "/sitemap.xml",
  "/opengraph-image",
]);

/**
 * Normalise a pathname into a slug suitable for the
 * `navigation-flow` bucket field. Returns `null` when the
 * pathname is empty, on the denylist, or would produce a slug
 * that violates the perception endpoint's bucket regex.
 *
 * Rules:
 *   - Trim leading `/` and any trailing `/`.
 *   - Treat the root path (`/`) as the literal slug `home`.
 *   - Replace inner `/` with `-` (kebab join).
 *   - Strip any query string or fragment (drop everything after
 *     `?` or `#`).
 *   - Lowercase the result.
 *   - Reject if the slug contains non-`[a-z0-9-]` characters
 *     after normalisation (defensive — paths normally don't, but
 *     a UTF-8 path or a localized route could).
 *   - Reject if the slug exceeds `MAX_SLUG_LENGTH`.
 */
export function pathToSlug(pathname: string | null | undefined): string | null {
  if (typeof pathname !== "string" || pathname.length === 0) return null;

  /* Strip query + fragment. */
  let raw = pathname;
  const queryIdx = raw.indexOf("?");
  if (queryIdx >= 0) raw = raw.slice(0, queryIdx);
  const fragIdx = raw.indexOf("#");
  if (fragIdx >= 0) raw = raw.slice(0, fragIdx);

  if (PATH_DENYLIST.has(raw)) return null;

  /* Root → "home". */
  if (raw === "/" || raw === "") return "home";

  /* Strip leading / trailing slashes. */
  if (raw.startsWith("/")) raw = raw.slice(1);
  if (raw.endsWith("/")) raw = raw.slice(0, -1);
  if (!raw) return "home";

  const slug = raw.replace(/\//g, "-").toLowerCase();

  if (slug.length === 0 || slug.length > MAX_SLUG_LENGTH) return null;
  /* Defensive: kebab-case ASCII only. The endpoint's bucket
   * validator would reject anything else; better to drop it
   * here than waste an HTTP round-trip. */
  if (!/^[a-z0-9][a-z0-9-]*$/.test(slug)) return null;

  return slug;
}

/**
 * Build the `navigation-flow` bucket from a previous + next
 * pathname pair. The two pathnames are normalised via
 * `pathToSlug`; if either fails to normalise, the helper returns
 * `null` and the caller drops the event.
 *
 * The bucket shape is `<from-slug>>to-slug` (no spaces). This
 * matches the `from-slug>to-slug` pattern documented on the
 * transparency page (`/v5/perception` section 02).
 *
 * Edge cases:
 *   - `from === to` (same path): returns null. The endpoint's
 *     bucket validator would accept it, but a self-loop carries
 *     no signal and would distort the aggregate.
 *   - `from === null` (initial mount, no prior page): the caller
 *     should bucket as an "arrival" cognition signal instead of
 *     emitting a navigation-flow event.
 */
export function bucketNavigationFlow(
  from: string | null | undefined,
  to: string | null | undefined,
): string | null {
  if (from == null || to == null) return null;
  const fromSlug = pathToSlug(from);
  const toSlug = pathToSlug(to);
  if (!fromSlug || !toSlug) return null;
  if (fromSlug === toSlug) return null;
  const combined = `${fromSlug}>${toSlug}`;
  /* The endpoint's combined-slug validator caps at 83 chars
   * (41 + 1 + 41). Belt + braces with the slug cap above. */
  if (combined.length > 83) return null;
  return combined;
}
