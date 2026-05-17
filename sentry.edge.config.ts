import * as Sentry from "@sentry/nextjs";

/**
 * Sentry — edge runtime initialization.
 *
 * V4 Phase 1 — Sub-PR 1.5.
 *
 * Loaded by `instrumentation.ts` when `process.env.NEXT_RUNTIME === "edge"`.
 * Captures unhandled exceptions in edge route handlers — `app/api/chat`,
 * `app/api/auto-tweet`, `app/api/telemetry/[metric]`, the webhook, etc.
 *
 * Same activation contract as the server config: SENTRY_DSN absent →
 * documented Sentry no-op; errors only, no perf tracing in v1.
 *
 * Why a separate file: edge functions run in a Workerd-like runtime
 * (no Node APIs). Sentry ships an edge-compatible build, and the
 * SDK requires per-runtime init so it doesn't load Node-only
 * transports in edge contexts.
 */

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  tracesSampleRate: 0,
  enabled: Boolean(process.env.SENTRY_DSN),
  environment: process.env.VERCEL_ENV ?? "development",
  release: process.env.VERCEL_GIT_COMMIT_SHA,
  ignoreErrors: ["AbortError", "ResponseAborted"],
});
