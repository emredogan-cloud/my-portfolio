import type { Instrumentation } from "next";

/**
 * Next 16 instrumentation hook — V4 Phase 1, Sub-PR 1.5.
 *
 * `register()` runs once per server boot (per runtime). We lazy-import
 * the appropriate Sentry runtime config based on which runtime called
 * us, so:
 *   - The Node.js server-only config never touches the edge build
 *   - The edge config never pulls Node-only Sentry transports
 *
 * `onRequestError` is Next 16's hook for catching server-side request
 * errors before they 5xx. Wiring it through Sentry means every
 * unhandled error in any server-rendered route, route handler, or
 * server action lands in the Sentry dashboard automatically — without
 * try/catch boilerplate in each consumer.
 *
 * Client-side Sentry is intentionally NOT initialised here. V4
 * § 5.1.5 caps the bundle delta at 10 KB; auto-initialising
 * @sentry/nextjs on the client would blow that budget by an order
 * of magnitude. Server + edge capture covers the bulk of value;
 * client-side error capture can be added in a future hardening
 * sub-PR via a lazy dynamic import.
 */

export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("./sentry.server.config");
  }
  if (process.env.NEXT_RUNTIME === "edge") {
    await import("./sentry.edge.config");
  }
}

export const onRequestError: Instrumentation.onRequestError = async (
  err,
  request,
  context,
) => {
  /* Dynamic import so the Sentry symbol resolution happens in the
   * same runtime context register() already initialised. */
  const Sentry = await import("@sentry/nextjs");
  Sentry.captureRequestError(err, request, context);
};
