"use client";

import dynamic from "next/dynamic";
import type { ComponentType, ReactNode } from "react";

/**
 * Playground lazy-load contract — V4 Phase 5 Sub-PR 5.2.
 *
 * The playground's bundle-isolation rule says experiment bodies
 * MUST NEVER land in the global initial JS bundle. They MUST be
 * loaded only when the visitor specifically navigates to the
 * experiment AND the route's feature flag is on.
 *
 * The simplest way to enforce that is one helper, used uniformly,
 * so each experiment can't roll its own (slightly different,
 * slightly wrong) lazy-load pattern.
 *
 * Why "use client" at the top:
 *   Next.js refuses to render `next/dynamic({ ssr: false })`
 *   that's transitively imported by a Server Component. The
 *   helper must live in a Client Component boundary; consumers
 *   call it from their own "use client" modules (typically a
 *   per-experiment dispatcher).
 *
 * Contract:
 *   - `ssr: false` keeps the body out of the server bundle. The
 *     server renders the loading skeleton; the client hydrates
 *     and then dynamically imports the body.
 *   - The loader function passed in is the standard dynamic-import
 *     callback (`() => import('./Body')`). Webpack splits the
 *     chunk for us — no extra config needed.
 *   - The optional `Skeleton` prop lets each experiment supply
 *     its own loading shape. When omitted, a quiet
 *     PlaygroundLoadingSkeleton renders (defined in the consumer
 *     module, not here, so this file stays a tiny utility).
 *
 * Why a function, not a doc comment:
 *   The 5.1 [slug]/page.tsx file had a doc-block describing the
 *   pattern. Documentation drifts. A function is a load-bearing
 *   contract — if the helper is bypassed, the code review notices.
 */

export interface CreateExperimentBodyOptions {
  /** Optional skeleton renderer. Rendered while the body chunk
   *  loads on the client. Typed to match Next.js's
   *  `DynamicOptions.loading` signature exactly (function-only,
   *  not class components — the same restriction `next/dynamic`
   *  itself enforces). */
  Skeleton?: () => ReactNode;
}

/** Wrap an experiment body in the standard lazy-load pattern.
 *  The returned component is itself a React component that can be
 *  used directly inside the playground's [slug]/page.tsx
 *  switch — no manual `next/dynamic` calls scattered across
 *  experiment surfaces. */
export function createExperimentBody<TProps extends object = object>(
  loader: () => Promise<{ default: ComponentType<TProps> }>,
  options: CreateExperimentBodyOptions = {},
): ComponentType<TProps> {
  /* `ssr: false` is the load-bearing flag. Combined with
   * `next/dynamic`, the body's bundle is split into its own
   * chunk that only loads on the client when this component
   * renders. The platform's global bundle is unaffected.
   *
   * `loading` receives a component reference directly — Next.js
   * renders it while the dynamic chunk fetches. Keeping this
   * file `.ts` (not `.tsx`) avoids polluting the lazy-load
   * helper with JSX. */
  return dynamic(loader, {
    ssr: false,
    loading: options.Skeleton,
  });
}
