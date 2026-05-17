/**
 * API base URL resolution.
 *
 * Reads `EMREDOGAN_API_URL` from the environment; falls back to
 * the production site. Used by every command that talks to the
 * server (`ask`, `project list`, `demo` for slug validation).
 *
 * Trims trailing slashes so call sites can concatenate paths
 * starting with `/`.
 */

const DEFAULT_BASE = "https://emredogan.com";

export function getApiBase(): string {
  const raw = process.env.EMREDOGAN_API_URL;
  if (!raw || raw.trim().length === 0) return DEFAULT_BASE;
  return raw.replace(/\/$/, "");
}
