import type { PlannedItem } from "@/lib/v5/operating/schema";

/**
 * V5 Phase 9 Sub-PR 9.1 — planned-next data file.
 *
 * Hand-curated, append-only register of what the operator
 * (Emre) has declared they're working on next. V5 future
 * § 3.1's table calls this the "Planned next" surface —
 * public roadmap kart that lets visitors see direction
 * without locking the operator into deadlines.
 *
 * Editorial rules
 *   - One title (≤ 80 chars).
 *   - One paragraph for `description` — the WHY, not the
 *     what. Plain operator voice.
 *   - `status` chosen from the closed PLANNED_STATUSES set.
 *   - `added` is ISO-8601 (YYYY-MM-DD).
 *   - `context` optional; free-form pointer to a system /
 *     phase / surface this item relates to.
 *
 * Append-only by convention
 *   When an item ships, MOVE it to the temporal registry
 *   (`data/temporal/events.ts`) as a real evolution event.
 *   When an item is abandoned, remove it (don't leave dead
 *   "considering" entries to grow stale).
 *
 * No deadlines, no estimates, no Gantt
 *   The operator-side discipline V5 § 1.7 demands: visitors
 *   should not get the impression that the operator is
 *   marketing a roadmap. The planned-next list is honest
 *   about uncertainty.
 *
 * Initial seed (this file's lifetime contents) reflects
 * the immediate aftermath of Phase 8's closure + the
 * 90-day observation window that opens before Phase 9
 * surfaces ship visibly.
 */

export const PLANNED_ITEMS: readonly PlannedItem[] = [
  /* The observation window itself — the operator's current
   * primary commitment for the next 90 days. */
  {
    id: "phase-8-observation",
    title: "Phase 8 observation window (90 days)",
    description:
      "Watch how the topology + aura + adaptive-recruiter foundations behave under real visitor traffic before mounting any of them visibly. The five sub-PRs that closed Phase 8 shipped invisible by design; the 90-day window measures whether any of them earns activation.",
    status: "in-progress",
    context: "Phase 8",
    added: "2026-05-19",
  },
  /* Phase 9 itself — the operational twin. */
  {
    id: "phase-9-operational-twin",
    title: "V5 Phase 9 — operational digital twin",
    description:
      "Continue building the operational twin surface that this very planned-next list lives in. The data layer (this sub-PR) is foundation; subsequent sub-PRs ship the public surface + repo intelligence overlay + living journal weekly cron + operational portrait card.",
    status: "in-progress",
    context: "/v5/operating",
    added: "2026-05-19",
  },
  /* Phase 8 foundation activations — deferred per the
   * 90-day window but visible in the planned slate. */
  {
    id: "topology-additional-projects",
    title: "Topology mount expansion (VCAI + SixPack)",
    description:
      "Once the CWH topology page (Phase 8.3) earns observation, add the remaining production projects to ENABLED_SLUGS. Requires a registry editorial pass — each project's subgraph needs more nodes than the current seed carries.",
    status: "next-up",
    context: "/v5/topology",
    added: "2026-05-19",
  },
  {
    id: "aura-provider-mount",
    title: "Aura provider mount + first opt-in surfaces",
    description:
      "Phase 8.4 shipped the aura system unmounted. The natural follow-up: mount AuraProvider in app/layout.tsx behind V5_AURA_ENABLED + opt one or two existing ambient gradients (likely /v5/topology + /v5/perception) into reading var(--v5-aura-accent-rgb).",
    status: "considering",
    context: "/v5/aura",
    added: "2026-05-19",
  },
  {
    id: "adaptive-contact-mount",
    title: "Adaptive recruiter /contact sections",
    description:
      "Phase 8.5 shipped the classifier + Provider unmounted. The visible activation needs: globally-mounted AdaptivePatternProvider (records visited prefixes) + new /contact sections (direct / elevator / engineering / what-id-build / rate-availability) + CSS `order` rules per data-pattern.",
    status: "considering",
    context: "/contact",
    added: "2026-05-19",
  },
];
