import * as Sentry from "@sentry/nextjs";

/**
 * Sentry capture helpers — V4 Phase 1, Sub-PR 1.5.
 *
 * Thin wrappers over `Sentry.captureException` / `captureMessage` that
 * mirror the graceful-no-op contract used by `lib/lumina/memory.ts`
 * and `lib/telemetry/metrics.ts`:
 *
 *   - When SENTRY_DSN is missing, every call is a silent no-op.
 *     `Sentry.init({ dsn: undefined })` in the runtime configs makes
 *     the SDK itself a no-op, but we still guard here so a caller
 *     can rely on "errors never block the response path" even if
 *     the SDK changes its semantics in a future version.
 *   - Any internal Sentry error is swallowed. Telemetry never blocks
 *     the caller's primary work — V4 § 2.2 + § 2.10 invariants.
 *
 * Why a separate file rather than importing @sentry/nextjs directly:
 *   - Single audit point for every Sentry call in the codebase.
 *   - Consumers don't have to remember the no-op gate; calling
 *     `captureRouteError(err, { route: "/api/chat" })` is enough.
 *   - Easy to mock in tests later (Sub-PR 2.x+) — replace this file
 *     with a stub, not surgical edits across every route.
 */

const isEnabled = Boolean(process.env.SENTRY_DSN);

interface CaptureContext {
  /** Logical route path (e.g. "/api/chat") so the Sentry sidebar
   *  can group errors by surface without inspecting stack frames. */
  route?: string;
  /** Free-form tags surfaced as Sentry tags. Keys must be plain
   *  alphanumerics; values are coerced to strings. */
  tags?: Record<string, string | number | boolean>;
  /** Arbitrary key/value attached to the event under `extra:`. */
  extra?: Record<string, unknown>;
}

function withScope(
  context: CaptureContext | undefined,
  body: (scope: Sentry.Scope) => void,
): void {
  Sentry.withScope((scope) => {
    if (context?.route) scope.setTag("route", context.route);
    if (context?.tags) {
      for (const [k, v] of Object.entries(context.tags)) {
        scope.setTag(k, String(v));
      }
    }
    if (context?.extra) {
      for (const [k, v] of Object.entries(context.extra)) {
        scope.setExtra(k, v);
      }
    }
    body(scope);
  });
}

/**
 * Capture an exception. Use inside catch blocks where you want the
 * error logged + reported but the request to continue.
 */
export function captureRouteError(
  err: unknown,
  context?: CaptureContext,
): void {
  if (!isEnabled) return;
  try {
    withScope(context, () => {
      if (err instanceof Error) {
        Sentry.captureException(err);
      } else {
        Sentry.captureException(new Error(String(err)));
      }
    });
  } catch {
    /* swallow — telemetry never blocks the caller */
  }
}

/**
 * Capture a string message at a configurable severity. Use for
 * non-throw warning paths ("draft was empty", "media upload fell
 * back to text-only") where Sentry would help observe the
 * frequency over time.
 */
export function captureRouteMessage(
  message: string,
  level: "info" | "warning" | "error" = "info",
  context?: CaptureContext,
): void {
  if (!isEnabled) return;
  try {
    withScope(context, () => {
      Sentry.captureMessage(message, level);
    });
  } catch {
    /* swallow */
  }
}
