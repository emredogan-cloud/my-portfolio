import { kv } from "@vercel/kv";

import { isValidSessionId } from "@/lib/lumina/memory";
import { resolveTtlSeconds } from "./ttl";

/**
 * V5 Phase 6 Sub-PR 6.4 — per-session page index.
 *
 * Sub-PR 6.4 ships the foundation for V5 § 3.3 "Memory-as-
 * Environment" — the Phase 10 surface where Lumina V5 reads the
 * visitor's session pacing as ambient context (without ever
 * mentioning it). One axis of that ambient context is the list
 * of recently-visited pages.
 *
 * Schema:
 *   Key:   lumina:session:<sessionId>:pages
 *   Value: JSON array of page slugs, most-recent-LAST
 *   Cap:   20 entries (older drop off the front)
 *   TTL:   matches the session TTL — `resolveTtlSeconds()`
 *
 * Why a SEPARATE key from the V4 session bucket:
 *   - Backward compatibility (V5 § 5.1 mandate): V4 readers of
 *     `lumina:session:<sessionId>` see the same `UIMessage[]`
 *     shape; the page index sits in a sibling key the V4 code
 *     never queries.
 *   - Append latency: appending to a sibling key is one round-
 *     trip; reading + rewriting the V4 bucket to add metadata
 *     would be two.
 *   - Rollback: deleting `lib/v5/memory/pages.ts` orphans the
 *     pages key harmlessly. Existing sessions never lose their
 *     UIMessage[] history.
 *
 * What this module does NOT do in 6.4:
 *   - It is NOT mounted to any observer in 6.4. The helpers
 *     exist as the chassis Phase 10's Lumina V5 ambient
 *     awareness will wire when it ships. Adding the observer
 *     here would be scope expansion into 6.5+ territory.
 *
 * Privacy posture:
 *   - The page slug is the SAME slug Sub-PR 6.2's
 *     `bucketNavigationFlow` produces — kebab-case, max 41
 *     chars, denylist-filtered for Next.js plumbing routes.
 *   - The list is per-session, anonymous, TTL-bounded. Same
 *     guarantees as the V4 UIMessage[] history.
 *   - When KV is unavailable, both helpers are graceful no-ops
 *     (record returns silent, load returns []). Consumers
 *     should always handle the empty-array case.
 */

const PAGES_KEY_SUFFIX = ":pages";

/** Maximum entries kept in the per-session pages index. Older
 *  entries fall off the front when the list grows past this. */
export const MAX_RECENT_PAGES = 20;

const hasKv = Boolean(
  process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN,
);

/** Compose the KV key for a session's pages index. Sits in
 *  the `lumina:session:` namespace so a single TTL refresh
 *  pattern keeps the page index aligned with the message
 *  history's lifetime. */
function pagesKey(sessionId: string): string {
  return `lumina:session:${sessionId}${PAGES_KEY_SUFFIX}`;
}

/**
 * Append one page slug to the session's recent-pages index.
 * Trims to `MAX_RECENT_PAGES` from the front. Refreshes the
 * TTL so an actively-visiting session keeps the index alive.
 *
 * Graceful no-op when:
 *   - KV is unavailable
 *   - sessionId fails `isValidSessionId`
 *   - pageSlug is empty / non-string
 *   - the read or write throws
 *
 * Deduplication policy: if the most-recent entry equals
 * `pageSlug`, the helper silently skips the append. This avoids
 * inflating the index on rapid same-page reloads while
 * preserving the order signal for distinct navigations.
 */
export async function recordPageVisit(
  sessionId: string,
  pageSlug: string,
): Promise<void> {
  if (!hasKv) return;
  if (!isValidSessionId(sessionId)) return;
  if (typeof pageSlug !== "string" || !pageSlug) return;
  try {
    const key = pagesKey(sessionId);
    const prior = (await kv.get<string[]>(key)) ?? [];
    if (!Array.isArray(prior)) {
      /* Storage corrupted by a non-array write — reset. */
      await kv.set(key, [pageSlug], { ex: resolveTtlSeconds() });
      return;
    }
    /* Dedupe consecutive repeats. */
    if (prior.length > 0 && prior[prior.length - 1] === pageSlug) {
      /* Refresh TTL so an actively-reloading visitor keeps the
       * index alive; no append. */
      await kv.expire(key, resolveTtlSeconds());
      return;
    }
    const next = [...prior, pageSlug];
    if (next.length > MAX_RECENT_PAGES) {
      next.splice(0, next.length - MAX_RECENT_PAGES);
    }
    await kv.set(key, next, { ex: resolveTtlSeconds() });
  } catch {
    /* swallow — page index is decorative ambient context, not
     * critical to memory or chat. */
  }
}

/**
 * Read the session's recent-pages index. Returns an empty
 * array when KV is unavailable, the index is empty / absent,
 * the read errors, or the stored value is not an array of
 * strings.
 */
export async function loadRecentPages(
  sessionId: string,
): Promise<string[]> {
  if (!hasKv) return [];
  if (!isValidSessionId(sessionId)) return [];
  try {
    const stored = await kv.get<string[]>(pagesKey(sessionId));
    if (!Array.isArray(stored)) return [];
    return stored.filter((s): s is string => typeof s === "string" && s.length > 0);
  } catch {
    return [];
  }
}

/** Delete the per-session pages index. Called by the V4
 *  `forgetSession` flow when the visitor clicks Forget-Me so
 *  the pages index is purged alongside the message history. */
export async function forgetSessionPages(sessionId: string): Promise<void> {
  if (!hasKv) return;
  if (!isValidSessionId(sessionId)) return;
  try {
    await kv.del(pagesKey(sessionId));
  } catch {
    /* swallow */
  }
}
