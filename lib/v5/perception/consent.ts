/**
 * V5 Phase 6 Sub-PR 6.1 — perception consent resolution.
 *
 * The perception layer engages only when BOTH gates are open:
 *
 *   1. Env gate: `V5_PERCEPTION_ENABLED === "1"` — operator-side
 *      master switch. Without this, the entire perception subsystem
 *      is dark; no telemetry endpoint accepts writes, no client
 *      observer fires. Mirror of the `PLAYGROUND_FLAG_*` pattern
 *      from Phase 5: env-driven, edge-safe, no admin UI surface.
 *
 *   2. Visitor gate: the consent cookie `v5_perception_consent`
 *      must equal `"granted"`. The cookie is set client-side on
 *      opt-in (see the transparency page). Without it, all non-
 *      adoption events drop at the endpoint.
 *
 * Default state is OFF on both gates. The visitor never tracks
 * passively; the V5 doc § 4.1 "perception layer opt-in oluyor —
 * default inactive" is enforced at every entry point.
 *
 * What the adoption category bypasses:
 *   Recording the opt-in / revoke / deny decision itself cannot
 *   require prior consent — the decision IS the consent. The
 *   endpoint enforces:
 *     - env gate must be on (operator can dark-launch by leaving
 *       V5_PERCEPTION_ENABLED unset; no event records at all)
 *     - cookie gate is bypassed only for `category === "adoption"`
 *
 * Edge-safety: pure reads from `process.env` and HTTP `Cookie`
 * header. No DOM access in any server-side helper. The client-side
 * helpers are gated behind `typeof window !== "undefined"`.
 */

/** Env var that controls the perception subsystem master switch.
 *  Operator sets this in the deploy environment. Without it, the
 *  endpoint silently no-ops every event — no KV writes, no opt-in
 *  recordings, nothing. */
export const PERCEPTION_ENABLED_ENV = "V5_PERCEPTION_ENABLED";

/** Cookie name read by the edge endpoint to verify the visitor
 *  has opted into perception tracking. Set client-side on the
 *  transparency page. */
export const PERCEPTION_CONSENT_COOKIE = "v5_perception_consent";

/** localStorage key paired with the cookie. The cookie is
 *  authoritative for the endpoint (because edge code can't read
 *  localStorage); the localStorage flag is what the UI reads to
 *  reflect current state. */
export const PERCEPTION_CONSENT_STORAGE = "v5:perception:consent";

/** The value a granted-consent cookie / storage entry must equal.
 *  Anything else (including absence) is treated as "not opted in". */
export const PERCEPTION_CONSENT_GRANTED = "granted";

/** Days of life for the consent cookie. Mirrors the 14-day Lumina
 *  memory TTL — same posture: an active visitor keeps the
 *  preference, an abandoned session drops it. */
export const PERCEPTION_CONSENT_TTL_DAYS = 14;

/** True when the perception subsystem master switch is on.
 *  Edge-safe: reads only `process.env`. */
export function isPerceptionEnabled(): boolean {
  return process.env[PERCEPTION_ENABLED_ENV] === "1";
}

/**
 * Parse a `Cookie:` header value and return the perception
 * consent token if present. Returns `null` on absence, parse
 * failure, or any non-`"granted"` value.
 *
 * Why we don't use the platform `cookies()` helper:
 *   `cookies()` from `next/headers` works in App Router server
 *   components and route handlers, but at the *route handler*
 *   layer for an edge endpoint we already have the `Request`
 *   object — parsing the header directly avoids an extra import
 *   and keeps the function pure / testable.
 */
export function readConsentCookie(cookieHeader: string | null): string | null {
  if (typeof cookieHeader !== "string" || !cookieHeader) return null;
  /* Cookie header shape: "name=value; other=value". Names are
   * case-sensitive in practice; values are URI-encoded but the
   * grant token is a plain ASCII literal so no decode is needed. */
  const pairs = cookieHeader.split(";");
  for (const raw of pairs) {
    const eq = raw.indexOf("=");
    if (eq < 0) continue;
    const name = raw.slice(0, eq).trim();
    if (name !== PERCEPTION_CONSENT_COOKIE) continue;
    const value = raw.slice(eq + 1).trim();
    return value || null;
  }
  return null;
}

/** True when the inbound request carries a granted-consent cookie. */
export function hasGrantedConsent(cookieHeader: string | null): boolean {
  return readConsentCookie(cookieHeader) === PERCEPTION_CONSENT_GRANTED;
}

/* ── Client-side helpers ──────────────────────────────────────
 *
 * These helpers run only in the browser. They're safe to import
 * into a Server Component because TypeScript erases the body at
 * compile time — only callers behind `"use client"` actually
 * execute them.
 *
 * Each helper guards against `typeof window === "undefined"` so
 * accidentally calling one during SSR / build is a silent no-op
 * rather than a crash.
 */

/** Read the consent state from localStorage. Returns true ONLY
 *  when storage holds the literal `"granted"`. Any other value,
 *  blocked storage, or SSR context returns false. */
export function readConsentFromStorage(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return (
      window.localStorage.getItem(PERCEPTION_CONSENT_STORAGE) ===
      PERCEPTION_CONSENT_GRANTED
    );
  } catch {
    return false;
  }
}

/** Set the consent state to "granted" in both localStorage and a
 *  same-origin cookie. The cookie is `SameSite=Lax`, `Path=/`,
 *  not `Secure` (so it works on localhost) — the perception
 *  consent isn't a security boundary, just a preference signal. */
export function writeConsentGranted(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(
      PERCEPTION_CONSENT_STORAGE,
      PERCEPTION_CONSENT_GRANTED,
    );
  } catch {
    /* sessionStorage blocked (Safari private mode etc.) — fall
     * through. The cookie alone is enough for the endpoint to
     * recognise consent; localStorage is the UI's source of
     * truth, which will simply read as "not granted" on next
     * load. Honest degradation. */
  }
  try {
    const maxAge = PERCEPTION_CONSENT_TTL_DAYS * 24 * 60 * 60;
    document.cookie =
      `${PERCEPTION_CONSENT_COOKIE}=${PERCEPTION_CONSENT_GRANTED}; ` +
      `Path=/; Max-Age=${maxAge}; SameSite=Lax`;
  } catch {
    /* document.cookie inaccessible — no-op */
  }
}

/** Clear the consent state from both storage and cookie. Called
 *  on visitor revoke. */
export function clearConsent(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(PERCEPTION_CONSENT_STORAGE);
  } catch {
    /* ignore */
  }
  try {
    document.cookie =
      `${PERCEPTION_CONSENT_COOKIE}=; Path=/; Max-Age=0; SameSite=Lax`;
  } catch {
    /* ignore */
  }
}
