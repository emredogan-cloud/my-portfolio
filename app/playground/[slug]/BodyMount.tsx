"use client";

import ExperimentMount from "@/app/playground/_components/ExperimentMount";
import { createExperimentBody } from "@/lib/playground/lazy";
import type { PlaygroundExperiment } from "@/lib/playground/registry";

/**
 * V4 Phase 5 Sub-PR 5.3 — Client-side experiment dispatcher.
 *
 * Why this exists as a separate client component:
 *   Next.js refuses `next/dynamic({ ssr: false })` calls that are
 *   transitively imported by Server Components. The `[slug]/page.tsx`
 *   route is a Server Component (for metadata + the registry check),
 *   so the dynamic-load dispatch must live in a "use client"
 *   boundary. This file is that boundary.
 *
 * Maintenance contract:
 *   - Every active entry in `lib/playground/registry` MUST appear
 *     in `BODY_REGISTRY` below AND in the `switch` inside
 *     `dispatchBody`. The `eval:playground` script enforces this
 *     alignment at build time.
 *   - Each `createExperimentBody` call wraps the body in
 *     `next/dynamic({ ssr: false })` so its chunk loads only
 *     when the visitor reaches this client island.
 */

const BODY_REGISTRY = {
  "hello-playground": createExperimentBody(
    () => import("@/app/playground/_experiments/hello-playground/Body"),
  ),
} as const;

type KnownSlug = keyof typeof BODY_REGISTRY;

interface BodyMountProps {
  experiment: PlaygroundExperiment;
}

export default function BodyMount({ experiment }: BodyMountProps) {
  switch (experiment.slug as KnownSlug) {
    case "hello-playground": {
      const Body = BODY_REGISTRY["hello-playground"];
      return <ExperimentMount experiment={experiment} BodyComponent={Body} />;
    }
    default: {
      /* Defensive — registry is source of truth, eval script
       * enforces alignment, the route-level error boundary
       * catches if this branch ever fires. */
      throw new Error(
        `Playground experiment "${experiment.slug}" has a registry entry but no dispatch case in BodyMount.`,
      );
    }
  }
}
