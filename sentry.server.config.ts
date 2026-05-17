import * as Sentry from "@sentry/nextjs";

/**
 * Sentry — server runtime initialization.
 *
 * V4 Phase 1 — Sub-PR 1.5.
 *
 * Loaded by `instrumentation.ts` when `process.env.NEXT_RUNTIME === "nodejs"`.
 * Captures unhandled exceptions in Node.js function routes
 * (`app/api/og/*`, server actions, the contact pipeline, etc.).
 *
 * Activation contract:
 *   - When SENTRY_DSN is missing, `Sentry.init({ dsn: undefined })` is
 *     a documented Sentry no-op — the SDK initialises with no transport
 *     and silently discards every captureException call. Same posture
 *     as our other graceful-no-op libs (`lib/lumina/memory.ts`,
 *     `lib/telemetry/metrics.ts`).
 *   - tracesSampleRate is intentionally `0` for v1 — performance
 *     monitoring + session replay both add cost and don't earn their
 *     keep at Phase 1 traffic levels. Errors only.
 *   - debug: false in production; we surface errors via the dashboard,
 *     not via console noise.
 */

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  tracesSampleRate: 0,
  enabled: Boolean(process.env.SENTRY_DSN),
  environment: process.env.VERCEL_ENV ?? "development",
  /* Release tag — when Vercel builds the deployment, VERCEL_GIT_COMMIT_SHA
   * is the source-of-truth commit identifier. Falls back to undefined
   * outside Vercel, which Sentry treats as "no release". */
  release: process.env.VERCEL_GIT_COMMIT_SHA,
  /* Filter out the noisy "AbortError" class — every cancelled stream
   * raises one and they're not actionable. */
  ignoreErrors: ["AbortError", "ResponseAborted"],
});
