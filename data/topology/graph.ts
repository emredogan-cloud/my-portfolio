import type { TopologyGraph } from "@/lib/v5/topology/schema";

/**
 * V5 Phase 8 Sub-PR 8.1 — the engineering-cognition data file.
 *
 * The canonical, hand-curated topology of the portfolio
 * ecosystem. Twenty-one nodes + twenty-five relationships
 * describing how the systems, projects, phases, architectures,
 * tools, memories, and telemetries relate to each other.
 *
 * What this registry IS
 *   - Engineering cognition. The relationship graph that lets
 *     future Phase 8.2+ renderers + Lumina sub-agents + the
 *     operational twin (Phase 9) answer questions like:
 *       "What depends on the perception layer?"
 *       "Which phase introduced /lab?"
 *       "What evolved into the V5 memory layer?"
 *
 * What this registry is NOT
 *   - A changelog. The raw commit firehose lives at /changelog.
 *   - An event log. The temporal registry lives at
 *     `data/temporal/events.ts`.
 *   - A marketing diagram. No `vibe`, no `mood`, no
 *     presentation-layer data anywhere.
 *
 * Editorial rules
 *   - One declarative sentence in `description`.
 *   - `evolution_event_ids` references actual event ids from
 *     `data/temporal/events.ts`. The registry's derive pass
 *     does NOT enforce these — bad ids just break the
 *     cross-link, the graph stays valid.
 *   - `perception_categories` references the closed allow-list
 *     in `lib/v5/perception/buckets.ts`. Same posture.
 *   - Relationships use the 7 closed verbs from
 *     `lib/v5/topology/schema.ts`; the relationship `id`
 *     follows the `<from>-<verb>-<to>` convention but can
 *     deviate when readability demands it.
 *
 * Adding a node
 *   1. Add a new object to `nodes`.
 *   2. Pick the right `kind` from the 9 allow-listed values.
 *   3. Give it a stable kebab-case `id`.
 *   4. Cross-link to evolution events when applicable; the
 *     graph derive pass validates the whole shape.
 *
 * Adding a relationship
 *   1. Add a new object to `relationships`.
 *   2. Pick the right `kind` from the 7 verbs.
 *   3. Both `from` and `to` must already exist in `nodes`.
 *   4. The graph validator catches self-loops and references
 *      to unknown nodes.
 *
 * Phase 8 cognition note
 *   The graph is the FIRST piece of infrastructure that lets
 *   the ecosystem describe its own structure declaratively. The
 *   future renderer reads from here; the future Lumina sub-agent
 *   does too. Both share the same source of truth — no
 *   competing schemas, no drift.
 */

const TOPOLOGY: TopologyGraph = {
  nodes: [
    /* ── Systems (top-level surfaces) ─────────────────── */
    {
      id: "portfolio",
      kind: "system",
      label: "Portfolio",
      description:
        "The ecosystem itself — the umbrella surface that hosts every other system.",
      href: "/",
      source_path: "app/page.tsx",
    },
    {
      id: "lumina",
      kind: "system",
      label: "Lumina",
      description:
        "The AI-native chat surface plus its 13-tool registry, operator awareness, and architecture-critic sub-agent.",
      href: "/lumina/brain",
      source_path: "lib/lumina",
      evolution_event_ids: [
        "v4-architecture-critic-sub-agent",
        "v4-lumina-public-transparency",
        "v4-lumina-v3-persistent-memory",
      ],
    },
    {
      id: "lab",
      kind: "system",
      label: "Public Engineering Lab",
      description:
        "Three streaming Bedrock-backed AI experiments running with rate limits, cost caps, and per-experiment funnel telemetry.",
      href: "/lab",
      source_path: "app/lab",
      evolution_event_ids: ["v4-public-lab-foundation"],
    },
    {
      id: "playground",
      kind: "system",
      label: "Experimental Playground",
      description:
        "Quarantined namespace for capability-detected experimental surfaces; isolated from the cinematic identity bundle.",
      href: "/playground",
      source_path: "app/playground",
      evolution_event_ids: ["v4-phase-5-playground-foundation"],
    },
    {
      id: "evolution-surface",
      kind: "system",
      label: "Evolution Archive",
      description:
        "The public engineering memory surface that renders the temporal registry as an editorial archive plus a scrubbable cursor.",
      href: "/evolution",
      source_path: "app/evolution/page.tsx",
    },

    /* ── Phases (development eras) ────────────────────── */
    {
      id: "v4-phase-4",
      kind: "phase",
      label: "V4 Phase 4 — Operating Layer",
      description:
        "The AI-native operating layer phase that shipped public Lumina transparency, repo-aware tools, evals, and the first sub-agent.",
      version: "V4 Phase 4",
      evolution_event_ids: [
        "v4-lumina-public-transparency",
        "v4-architecture-critic-sub-agent",
      ],
    },
    {
      id: "v5-phase-6",
      kind: "phase",
      label: "V5 Phase 6 — Sensory Awakening",
      description:
        "The five sub-PR foundation phase that introduced the perception layer, cognition observer, pacing engine, memory V5, and the transparency page that closed Phase 6.",
      version: "V5 Phase 6",
      evolution_event_ids: [
        "v5-phase-6-close",
        "v5-perception-foundation",
        "v5-cognition-aware-navigation",
        "v5-cinematic-pacing-engine",
        "v5-memory-layer-extensions",
      ],
    },
    {
      id: "v5-phase-7",
      kind: "phase",
      label: "V5 Phase 7 — Temporal Architecture",
      description:
        "The four sub-PR phase that introduced the temporal schema, the deterministic playback primitive, the WAI-ARIA timeline slider, and the architecture-page integration.",
      version: "V5 Phase 7",
    },

    /* ── Projects (production case studies) ───────────── */
    {
      id: "cloud-waste-hunter",
      kind: "project",
      label: "Cloud Waste Hunter",
      description:
        "Cross-account FinOps SaaS: STS AssumeRole scanner, Glue + Athena cost attribution, Bedrock-streamed remediation, Lemon Squeezy billing.",
      href: "/architecture/cloud-waste-hunter",
      source_path: "app/architecture/cloud-waste-hunter",
      evolution_event_ids: [
        "v3-aws-topology-3d-scene",
        "cwh-hero-topology-transplant",
        "cwh-pro-monetization",
      ],
    },
    {
      id: "vibing-coder-ai",
      kind: "project",
      label: "VibingCoderAI",
      description:
        "Decoupled Next.js + Lambda + Anthropic SDK service that translates casual ideas into senior-grade AI agent briefs.",
      href: "/architecture/vibing-coder-ai",
      source_path: "app/architecture/vibing-coder-ai",
    },
    {
      id: "sixpack-ai",
      kind: "project",
      label: "FormAI — Fitness Koçu",
      description:
        "Flutter edge-ML fitness coach: on-device pose detection at 30 fps, Supabase sync, RevenueCat-fronted subscriptions.",
      href: "/architecture/sixpack-ai",
      source_path: "app/architecture/sixpack-ai",
    },

    /* ── Architectures (engines, not surfaces) ────────── */
    {
      id: "aws-topology-3d",
      kind: "architecture",
      label: "AWS Topology — 3D Constellation",
      description:
        "Three.js + @xyflow/react WebGL scene that renders Cloud Waste Hunter's production AWS architecture; powered the hero constellation transplant.",
      source_path: "components/cwh",
      evolution_event_ids: [
        "v3-aws-topology-3d-scene",
        "cwh-hero-topology-transplant",
      ],
    },
    {
      id: "scrollstory-engine",
      kind: "architecture",
      label: "ScrollStory Engine",
      description:
        "Project-agnostic scroll-narrative engine that pairs per-project milestone data with SVG illustrations and IntersectionObserver-driven section tracking.",
      source_path: "app/architecture/_components/ScrollStory.tsx",
    },
    {
      id: "temporal-playback",
      kind: "architecture",
      label: "Temporal Playback Primitive",
      description:
        "Deterministic frame-interpolation engine with RAF injection, reduced-motion snap, and zero idle CPU when inactive — the cursor primitive every Phase 7 + 8 surface reads.",
      source_path: "lib/v5/temporal/playback.ts",
    },

    /* ── Tools / Lab experiments ──────────────────────── */
    {
      id: "iam-translator",
      kind: "lab",
      label: "IAM Translator",
      description:
        "Streaming Bedrock endpoint that turns plain-English AWS access requests into hardened least-privilege IAM JSON; rate-limited, cost-capped.",
      href: "/lab/iam-translator",
      source_path: "app/lab/iam-translator",
      evolution_event_ids: ["v4-public-lab-foundation"],
    },
    {
      id: "prompt-rescuer",
      kind: "lab",
      label: "Prompt Rescuer",
      description:
        "Lab experiment that rewrites under-specified prompts into structured AI agent briefs; same rate-limit + cost-cap chassis as IAM Translator.",
      href: "/lab/prompt-rescuer",
      source_path: "app/lab/prompt-rescuer",
    },
    {
      id: "commit-narrator",
      kind: "lab",
      label: "Commit Narrator",
      description:
        "Lab experiment that synthesises engineering-grade summaries from a project's recent commit history.",
      href: "/lab/commit-narrator",
      source_path: "app/lab/commit-narrator",
    },

    /* ── Memory subsystems ────────────────────────────── */
    {
      id: "lumina-memory",
      kind: "memory",
      label: "Lumina Memory Layer",
      description:
        "KV-backed session memory at `lumina:session:<id>` with 14-30 day TTL, PII redaction, 8-turn verbatim window, and a Haiku-generated session summary.",
      source_path: "lib/lumina/memory.ts",
      evolution_event_ids: [
        "v4-lumina-v3-persistent-memory",
        "v5-memory-layer-extensions",
      ],
    },
    {
      id: "pages-index",
      kind: "memory",
      label: "Per-Session Pages Index",
      description:
        "Sibling KV key `lumina:session:<id>:pages` carrying the visitor's recently-visited page slugs; foundation for Phase 10 ambient awareness.",
      source_path: "lib/v5/memory/pages.ts",
      evolution_event_ids: ["v5-memory-layer-extensions"],
    },

    /* ── Telemetry subsystems ─────────────────────────── */
    {
      id: "perception-layer",
      kind: "telemetry",
      label: "Perception Telemetry Layer",
      description:
        "Phase 6 foundation: closed-schema, consent-gated, aggregate-only telemetry across eight perception categories.",
      href: "/v5/perception",
      source_path: "lib/v5/perception",
      evolution_event_ids: ["v5-perception-foundation"],
      perception_categories: [
        "scroll-velocity",
        "dwell-time",
        "section-engagement",
        "tab-visibility",
        "navigation-flow",
        "cognition-signal",
        "pacing-transition",
        "adoption",
      ],
    },
    {
      id: "timeline-engagement",
      kind: "telemetry",
      label: "Timeline Engagement",
      description:
        "Phase 7.3 + 7.4 adoption hash: per-session mounted/engaged counters globally plus per-architecture-page engagement at v5:topology:architecture-page.",
      source_path: "lib/v5/temporal/timeline-telemetry.ts",
    },
    {
      id: "playback-adoption",
      kind: "telemetry",
      label: "Playback Adoption",
      description:
        "Phase 7.2 adoption hash recording the five playback verbs (seek / scrub / play / pause / step) across every slider mount in the ecosystem.",
      source_path: "lib/v5/temporal/playback-telemetry.ts",
    },
  ],
  relationships: [
    /* The portfolio composes every top-level system. */
    {
      id: "portfolio-powers-lumina",
      kind: "powers",
      from: "portfolio",
      to: "lumina",
      description: "The portfolio embeds Lumina as its single chat surface.",
    },
    {
      id: "portfolio-powers-lab",
      kind: "powers",
      from: "portfolio",
      to: "lab",
    },
    {
      id: "portfolio-powers-playground",
      kind: "powers",
      from: "portfolio",
      to: "playground",
    },
    {
      id: "portfolio-powers-evolution-surface",
      kind: "powers",
      from: "portfolio",
      to: "evolution-surface",
    },

    /* Lumina depends on its memory + observes perception. */
    {
      id: "lumina-depends-on-lumina-memory",
      kind: "depends_on",
      from: "lumina",
      to: "lumina-memory",
      description:
        "Every chat turn loads + persists through the memory layer.",
    },
    {
      id: "lumina-memory-evolved-into-pages-index",
      kind: "evolved_into",
      from: "lumina-memory",
      to: "pages-index",
      description:
        "Phase 6.4 extended the memory layer with the per-session pages-index sibling key.",
    },

    /* Phase 4 introduced Lumina's operating layer. */
    {
      id: "v4-phase-4-introduced-lumina",
      kind: "introduced",
      from: "v4-phase-4",
      to: "lumina",
    },

    /* Phase 6 introduced perception. */
    {
      id: "v5-phase-6-introduced-perception-layer",
      kind: "introduced",
      from: "v5-phase-6",
      to: "perception-layer",
    },
    {
      id: "v5-phase-6-introduced-lumina-memory",
      kind: "influences",
      from: "v5-phase-6",
      to: "lumina-memory",
      description:
        "The Phase 6.4 extensions added TTL configurability, IPv6 redaction, and the pages-index sibling key.",
    },

    /* Phase 7 introduced the temporal layer + evolution archive. */
    {
      id: "v5-phase-7-introduced-evolution-surface",
      kind: "introduced",
      from: "v5-phase-7",
      to: "evolution-surface",
    },
    {
      id: "v5-phase-7-introduced-temporal-playback",
      kind: "introduced",
      from: "v5-phase-7",
      to: "temporal-playback",
    },
    {
      id: "v5-phase-7-introduced-timeline-engagement",
      kind: "introduced",
      from: "v5-phase-7",
      to: "timeline-engagement",
    },
    {
      id: "v5-phase-7-introduced-playback-adoption",
      kind: "introduced",
      from: "v5-phase-7",
      to: "playback-adoption",
    },

    /* The lab system composes its three experiments. */
    {
      id: "lab-powers-iam-translator",
      kind: "powers",
      from: "lab",
      to: "iam-translator",
    },
    {
      id: "lab-powers-prompt-rescuer",
      kind: "powers",
      from: "lab",
      to: "prompt-rescuer",
    },
    {
      id: "lab-powers-commit-narrator",
      kind: "powers",
      from: "lab",
      to: "commit-narrator",
    },

    /* Lumina has tools that invoke each lab experiment. */
    {
      id: "iam-translator-related-to-lumina",
      kind: "related_to",
      from: "iam-translator",
      to: "lumina",
      description:
        "Lumina's `translateIamPolicy` tool loopback-invokes the lab endpoint.",
    },
    {
      id: "prompt-rescuer-related-to-lumina",
      kind: "related_to",
      from: "prompt-rescuer",
      to: "lumina",
      description: "Lumina's `rescuePrompt` tool loopback-invokes the lab.",
    },
    {
      id: "commit-narrator-related-to-lumina",
      kind: "related_to",
      from: "commit-narrator",
      to: "lumina",
      description: "Lumina's `narrateCommits` tool loopback-invokes the lab.",
    },

    /* The 3D AWS topology powers CWH; the engine influenced the
     * ScrollStory engine that powers every architecture page. */
    {
      id: "aws-topology-3d-powers-cloud-waste-hunter",
      kind: "powers",
      from: "aws-topology-3d",
      to: "cloud-waste-hunter",
    },
    {
      id: "aws-topology-3d-influences-scrollstory-engine",
      kind: "influences",
      from: "aws-topology-3d",
      to: "scrollstory-engine",
      description:
        "The topology engine's chunk-quarantine pattern shaped the ScrollStory engine's per-project composition model.",
    },
    {
      id: "scrollstory-engine-powers-cloud-waste-hunter",
      kind: "powers",
      from: "scrollstory-engine",
      to: "cloud-waste-hunter",
    },
    {
      id: "scrollstory-engine-powers-vibing-coder-ai",
      kind: "powers",
      from: "scrollstory-engine",
      to: "vibing-coder-ai",
    },
    {
      id: "scrollstory-engine-powers-sixpack-ai",
      kind: "powers",
      from: "scrollstory-engine",
      to: "sixpack-ai",
    },

    /* The temporal playback primitive powers the evolution
     * surface (the slider on /evolution + each architecture
     * page is the same controller). */
    {
      id: "temporal-playback-powers-evolution-surface",
      kind: "powers",
      from: "temporal-playback",
      to: "evolution-surface",
    },

    /* Telemetry observation chains. */
    {
      id: "evolution-surface-observes-perception-layer",
      kind: "observes",
      from: "evolution-surface",
      to: "perception-layer",
      description:
        "The /evolution surface fires both view + category_view + event_view adoption events through the perception infrastructure.",
    },
    {
      id: "perception-layer-powers-timeline-engagement",
      kind: "powers",
      from: "perception-layer",
      to: "timeline-engagement",
      description:
        "The perception endpoint + buckets + telemetry chassis are reused by the timeline-engagement subsystem.",
    },
    {
      id: "perception-layer-powers-playback-adoption",
      kind: "powers",
      from: "perception-layer",
      to: "playback-adoption",
    },
  ],
} as const;

export const TOPOLOGY_GRAPH: TopologyGraph = TOPOLOGY;
