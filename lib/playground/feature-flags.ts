/**
 * Playground feature flag resolution — V4 Phase 5 Sub-PR 5.1.
 *
 * Resolution rules:
 *   - Each experiment slug maps to an env var:
 *     PLAYGROUND_FLAG_<UPPERCASE_SNAKE_SLUG>
 *     (slug "webgpu-topology" → env "PLAYGROUND_FLAG_WEBGPU_TOPOLOGY")
 *   - Env var value `"1"` enables the experiment.
 *   - Any other value (or missing var) disables it.
 *   - Default state of the entire playground: every flag OFF.
 *
 * Why env vars instead of a KV-backed admin UI:
 *   - Phase 5 is conditional + isolated; flag rotation cadence is
 *     low (per sub-PR, not per request). An env var change + redeploy
 *     is the right friction-to-power ratio.
 *   - A KV-backed flag system would require an auth surface for the
 *     toggle endpoint, which adds attack surface for zero current
 *     value. Defer until traction earns it.
 *   - Env-var resolution is synchronous and free — the flag check
 *     adds < 1 µs to any caller.
 *
 * Edge / Node compatibility:
 *   - `process.env` works in both edge and node runtimes on Vercel.
 *   - The function is a pure read; no I/O, no side effects.
 */

/** Convert a kebab-case experiment slug into the canonical env var
 *  name. Exported for tests and for the audit surface — visitors
 *  reading the registry can also see which env var to set. */
export function flagEnvName(slug: string): string {
  return `PLAYGROUND_FLAG_${slug.toUpperCase().replace(/-/g, "_")}`;
}

/** Return true when the given experiment slug is enabled.
 *  Conservative: any non-`"1"` value returns false. */
export function isExperimentEnabled(slug: string): boolean {
  if (!slug || typeof slug !== "string") return false;
  const name = flagEnvName(slug);
  return process.env[name] === "1";
}
