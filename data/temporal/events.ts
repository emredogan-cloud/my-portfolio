import type { EvolutionEvent } from "@/lib/v5/temporal/schema";

/**
 * V5 Phase 7 Sub-PR 7.1 — the engineering memory layer's data
 * file. The canonical, hand-curated registry of architectural
 * events the ecosystem chooses to REMEMBER.
 *
 * Editorial rules
 *   - One paragraph for `summary` (declarative, plain language,
 *     the architecture-mattering part of what happened).
 *   - Optional one paragraph for `rationale` (the WHY — the
 *     engineering memory bit that justifies including the event
 *     in this registry rather than only in /changelog).
 *   - `date` is ISO-8601 (YYYY-MM-DD) and reflects when the
 *     architectural shift LANDED.
 *   - `commitSha` is the 7-char short SHA when one exists.
 *   - `provenance` declares where the memory comes from.
 *   - `category` is the architectural axis the event sits on.
 *   - Status defaults to "current"; the registry derive pass
 *     flips an entry to "superseded" when a later entry's
 *     `supersedes` field points at it.
 *
 * What this registry IS:
 *   - Engineering memory. The events that explain how the
 *     ecosystem matured — versions, architectures, AI subsystems
 *     coming online, topology surfaces, OSS releases, phase
 *     closures.
 *
 * What this registry is NOT:
 *   - A changelog. The raw commit firehose lives at /changelog
 *     and is generated from GitHub. Every commit shows up there;
 *     only ARCHITECTURALLY LOAD-BEARING moments show up here.
 *   - A diary. No daily notes, no personal moments, no progress
 *     reports.
 *   - A roadmap. Future plans live in
 *     `PORTFOLYO_V5_FUTURE_SYSTEMS.md`; this registry is
 *     append-only and only records what has actually landed.
 *
 * Adding a new entry
 *   1. Add a new object to the array (any position — the derive
 *      pass sorts).
 *   2. Give it a stable kebab-case `id` (these become URL
 *      anchors and don't change once an event has been
 *      referenced externally).
 *   3. Write the summary + optional rationale in the voice
 *      already established below — declarative, technical,
 *      no marketing.
 *   4. Add the `commitSha` when the event corresponds to a
 *      single commit; otherwise pick the most-architectural
 *      commit and record it.
 *   5. Run the eval consistency check (`npm run typecheck`)
 *      to make sure the schema accepts every field.
 *
 * The initial seed (this file's lifetime contents) covers the
 * V1 → V5 evolution of the portfolio ecosystem — fourteen
 * memory-bearing events selected for architectural weight, not
 * activity volume.
 */

export const EVOLUTION_EVENTS: readonly EvolutionEvent[] = [
  /* ── V5 — Phase 6 (Sensory Awakening) ──────────────────── */

  {
    id: "v5-phase-6-close",
    date: "2026-05-19",
    title: "V5 Phase 6 closes — Sensory Awakening complete",
    category: "milestone",
    version: "V5 Phase 6",
    system: "portfolio",
    status: "current",
    summary:
      "Five sub-PRs landed Phase 6 of the V5 operating constitution: perception telemetry foundation, cognition observer, cinematic pacing engine, memory layer V5 extensions, and the public transparency page that closed the phase. The 60-90 day observation window opened on the same commit; no further perception surface ships until Phase 7's foundation lands.",
    rationale:
      "V5 § 0.2 makes the post-phase observation window mandatory — skipping it accumulates maintenance debt the doc treats as a circuit-breaker. The Phase 6 surface area was deliberately small (one transparency page, three observers, one memory extension) so the observation period could measure adoption without competing surfaces drowning out the signal.",
    commitSha: "20af4ae",
    refs: [
      {
        kind: "report",
        label: "Sub-PR 6.5 report",
        path: "sub-pr-report/SUB-PR_6.5_REPORT.md",
      },
      {
        kind: "doc",
        label: "V5 Execution System",
        path: "PORTFOLYO_V5_EXECUTION_SYSTEM.md",
      },
    ],
    provenance: "synthesis",
  },

  {
    id: "v5-memory-layer-extensions",
    date: "2026-05-19",
    title: "Memory layer V5 — configurable TTL, IPv6 redaction, pages index",
    category: "ai-system",
    version: "Sub-PR 6.4",
    system: "memory",
    status: "current",
    summary:
      "The V4 Lumina memory layer gained four V5 extensions without breaking the V4 storage shape: configurable 14-30 day TTL via `V5_MEMORY_TTL_DAYS`, IPv6 PII redaction ordered before IPv4, a per-session recently-visited pages index at `lumina:session:<id>:pages` (foundation only — no observer yet), and a memory adoption hash that drives the live hit-rate tile on /lumina/brain. V4 visitors' sessions continue to read through the same keys with the same parser.",
    rationale:
      "Phase 10's ambient awareness needs longer context windows and a pages index it can read without ever revealing perception to the visitor. Shipping those primitives during the Phase 6 foundation pass — rather than at Phase 10 launch — keeps the V5 foundation work fully isolated from the eventual ambient surface.",
    commitSha: "694feab",
    refs: [
      {
        kind: "report",
        label: "Sub-PR 6.4 report",
        path: "sub-pr-report/SUB-PR_6.4_REPORT.md",
      },
    ],
    provenance: "commit",
  },

  {
    id: "v5-cinematic-pacing-engine",
    date: "2026-05-19",
    title: "Cinematic pacing engine — multiplier provider + visibility beacon",
    category: "ai-system",
    version: "Sub-PR 6.3",
    system: "pacing",
    status: "current",
    summary:
      "Four-tier duration multiplier taxonomy (FULL / MID / SNAPPY / STILL ≡ 1.0 / 0.85 / 0.65 / 0.0) derived from the cognition signal plus the visitor's reduced-motion preference. Exposed as a React Context with `usePacing()`. A once-per-session `pacing-transition` beacon fires on `visibilitychange:hidden` via `navigator.sendBeacon` with sessionStorage dedupe.",
    rationale:
      "V5 § 2.5 declares pacing an emotional engine, not visual ornament. The four discrete tiers replace the continuous multipliers other sites bikeshed over — a 0.83 vs 0.84 difference is invisible noise, but a 0.85 vs 1.0 difference is a perceptual shift. Spring physics is banned by the type signature, not just by convention.",
    commitSha: "01fe54a",
    refs: [
      {
        kind: "report",
        label: "Sub-PR 6.3 report",
        path: "sub-pr-report/SUB-PR_6.3_REPORT.md",
      },
    ],
    provenance: "commit",
  },

  {
    id: "v5-cognition-aware-navigation",
    date: "2026-05-19",
    title: "Cognition-aware navigation — first perception observer",
    category: "ai-system",
    version: "Sub-PR 6.2",
    system: "perception",
    status: "current",
    summary:
      "The cognition state taxonomy (arrival / exploring / engaged) plus a layout-mounted observer that watches `usePathname()` and fires `cognition-signal` and `navigation-flow` events to the 6.1 endpoint when the visitor has opted in. Renders null. Idle CPU is zero — the only work runs on pathname change, which is a user action.",
    rationale:
      "The three buckets are deliberately few: two collapses to new-vs-returning, four invites bikeshedding without adding decision value. The transitions are monotone in the per-session page counter so the inference layer never regresses a session from engaged back to exploring.",
    commitSha: "8f0949a",
    refs: [
      {
        kind: "report",
        label: "Sub-PR 6.2 report",
        path: "sub-pr-report/SUB-PR_6.2_REPORT.md",
      },
    ],
    provenance: "commit",
  },

  {
    id: "v5-perception-foundation",
    date: "2026-05-19",
    title: "Perception telemetry foundation — schema + endpoint + transparency",
    category: "architecture",
    version: "Sub-PR 6.1",
    system: "perception",
    status: "current",
    summary:
      "The first commit on the V5 operating constitution. Six perception categories (scroll-velocity, dwell-time, section-engagement, tab-visibility, navigation-flow, adoption) backed by an edge POST endpoint that gates every write behind an operator env switch, a closed schema allow-list, and a same-origin consent cookie. The /v5/perception page documents the contract publicly. No observer ships in 6.1 — the chassis is the deliverable.",
    rationale:
      "V5 § 4.1 demands that creepiness be architecturally impossible, not merely policy. The endpoint accepts only bucket labels (never raw values); the storage is six HINCRBY counters; the read path returns aggregate maps. The information a `we noticed you spent 8 minutes on X` message would need does not exist anywhere in the system.",
    commitSha: "5eb14c3",
    refs: [
      {
        kind: "report",
        label: "Sub-PR 6.1 report",
        path: "sub-pr-report/SUB-PR_6.1_REPORT.md",
      },
      {
        kind: "doc",
        label: "V5 Execution System",
        path: "PORTFOLYO_V5_EXECUTION_SYSTEM.md",
      },
    ],
    provenance: "commit",
  },

  /* ── V4 — Phase 5 (Experimental Foundation) ─────────────── */

  {
    id: "v4-phase-5-playground-foundation",
    date: "2026-05-18",
    title: "Experimental playground — namespace + triple-gate access",
    category: "infrastructure",
    version: "V4 Phase 5",
    system: "playground",
    status: "current",
    summary:
      "A dedicated `/playground` namespace with capabilities-detection infrastructure, lazy-loaded experiment shells, per-experiment funnel telemetry (visit / mount / capability-miss hashes), and the diagnostic `hello-playground` experiment shipped as proof-of-contract. Triple-gate access: env feature flag, browser capability detection, explicit visitor opt-in.",
    rationale:
      "Quarantining experimental surfaces from the production portfolio's bundle + Lighthouse posture meant the experimentation cadence could rise without dragging the cinematic identity down. Phase 6+ surfaces that need WebGPU, heavy 3D, or experimental APIs land here first.",
    commitSha: "8d99aba",
    refs: [
      {
        kind: "report",
        label: "Sub-PR 5.4 report",
        path: "sub-pr-report/SUB-PR_5.4_REPORT.md",
      },
    ],
    provenance: "synthesis",
  },

  /* ── V4 — Phase 4 (AI-Native Operating Layer) ──────────── */

  {
    id: "v4-architecture-critic-sub-agent",
    date: "2026-05-18",
    title: "First Lumina sub-agent — architecture-critic",
    category: "ai-system",
    version: "V4 Phase 4 · Sub-PR 4.5",
    system: "lumina",
    status: "current",
    summary:
      "A heuristic router selects between Lumina and the architecture-critic sub-agent based on critique-verb + architecture-noun signals in the user's message. The sub-agent appends its discipline overlay onto Lumina's base system prompt (inheriting the voice and tool registry); a synthetic init tool surfaces the routing decision through the existing tool-pill UI. Routing decisions land in a KV hash for observability.",
    rationale:
      "A second inference call for routing would have doubled cold-start latency. The deterministic classifier returns in under a millisecond. ONE sub-agent only — the V4 doc explicitly forbids the multi-agent mesh other AI portfolios sprawl into.",
    commitSha: "bedc3d0",
    refs: [
      {
        kind: "report",
        label: "Sub-PR 4.5 report",
        path: "sub-pr-report/SUB-PR_4.5_REPORT.md",
      },
    ],
    provenance: "commit",
  },

  {
    id: "v4-lumina-public-transparency",
    date: "2026-05-18",
    title: "Public Lumina transparency — /lumina/brain + /lumina/failures",
    category: "ai-system",
    version: "V4 Phase 4 · Sub-PR 4.1",
    system: "lumina",
    status: "current",
    summary:
      "Two public surfaces document Lumina end-to-end: `/lumina/brain` exposes the system prompt, the tool registry, the memory contract, and the runtime topology; `/lumina/failures` is an append-only corrections log where every operator-grade mistake gets a what / why / fix paragraph triplet. V4 § 2.3 turned transparency from a footer link into a brand surface.",
    rationale:
      "Lumina would otherwise read as a black box whose behavior visitors had to take on faith. The transparency pages make every claim grep-able in the public repo, which is the asymmetry V5 § 2.3 later codified as a brand contract.",
    commitSha: "d33b234",
    refs: [
      {
        kind: "report",
        label: "Sub-PR 4.1 report",
        path: "sub-pr-report/SUB-PR_4.1_REPORT.md",
      },
    ],
    provenance: "commit",
  },

  /* ── V4 — Phase 3 (AI-Native Operator Systems) ─────────── */

  {
    id: "v4-lumina-v3-persistent-memory",
    date: "2026-05-18",
    title: "Lumina V3 persistent memory — 14-day TTL + redaction + recap",
    category: "ai-system",
    version: "V4 Phase 3",
    system: "lumina",
    status: "superseded",
    summary:
      "KV-backed session memory at `lumina:session:<id>`: full thread persistence for 14 days, PII redaction (emails, phones, AWS keys, IPv4, TC Kimlik, API key prefixes), an 8-turn verbatim context window, and a Haiku-generated session summary at `lumina:summary:<id>` once a thread crosses the cap. The chat survives reloads without leaking identity through the redaction net.",
    rationale:
      "The aim was operator-grade memory without `welcome back, Emre` ambient profile theatre. The redaction net is purely additive; the visitor-facing controls (opt-out + forget-me) shipped as separate sub-PRs once the memory layer itself was stable.",
    commitSha: "9103d14",
    refs: [
      {
        kind: "commit",
        label: "Forget-Me hotfix",
        sha: "a99af07",
      },
    ],
    provenance: "commit",
  },

  /* ── V4 — Phase 2 (Public Engineering Lab) ─────────────── */

  {
    id: "v4-public-lab-foundation",
    date: "2026-05-18",
    title: "/lab scaffold + IAM Translator — first public AI experiment",
    category: "ai-system",
    version: "V4 Phase 2 · Sub-PR 2.1",
    system: "lab",
    status: "current",
    summary:
      "The `/lab` namespace opens with the IAM Translator: a streaming Bedrock-backed endpoint that turns plain-English AWS access requests into hardened least-privilege IAM JSON. Triple-gate budget — per-IP rate limit, per-experiment daily cost cap, server-side allow-list of input shapes — keeps experimentation cheap. Edge runtime; cost telemetry to the V4 dashboard.",
    rationale:
      "Phase 2's wedge was public-facing AI experiments that DEMONSTRATE Lumina's operating discipline rather than describe it. IAM Translator is the canonical example: the security-sensitive output forces the architecture to handle prompt injection, cost caps, and streaming failure modes correctly.",
    commitSha: "e36a9ea",
    refs: [
      {
        kind: "report",
        label: "Sub-PR 2.1 report",
        path: "sub-pr-report/SUB-PR_2.1_REPORT.md",
      },
    ],
    provenance: "commit",
  },

  /* ── V4 — Phase 1 (OSS Launch + Transparency) ──────────── */

  {
    id: "v4-public-telemetry-dashboard",
    date: "2026-05-17",
    title: "Public telemetry dashboard — /telemetry",
    category: "infrastructure",
    version: "V4 Phase 1 · Sub-PR 1.2",
    system: "portfolio",
    status: "current",
    summary:
      "A public `/telemetry` page renders every observable axis the platform tracks: Lumina p95 latency, auto-tweet success rate, npm download counts, MRR, lab adoption funnels. Backed by `lib/telemetry/metrics.ts` — a single allow-listed metric registry that gates every KV write and read against the V4 § 2.13 schema. Graceful no-op when KV is unavailable.",
    rationale:
      "The telemetry surface became the platform's first explicit operator console — a contract that turned `claims about how the site works` into `live numbers the visitor can audit`. Every subsequent V4 + V5 sub-PR has had to declare which metric slot it occupies before merging.",
    commitSha: "1f56fb6",
    refs: [
      {
        kind: "report",
        label: "Sub-PR 1.2 report",
        path: "sub-pr-report/SUB-PR_1.2_REPORT.md",
      },
    ],
    provenance: "commit",
  },

  {
    id: "v4-lumina-chat-npm-package",
    date: "2026-05-17",
    title: "@emredogan/lumina-chat published — first OSS release",
    category: "release",
    version: "0.1.0",
    system: "lumina-chat",
    status: "current",
    summary:
      "Lumina extracted as a standalone React package and published to npm. The portfolio consumes the same package the public consumes — there is no internal-only fork. 23.7 kB unpacked tarball; the package surface tracks Lumina's V3 + V4 invariants exactly.",
    rationale:
      "Distribution before perfection. The OSS contract enforced a clean API boundary that the V4 + V5 transparency surfaces (and the eventual sub-agent registry) had to respect.",
    commitSha: "4ac54e4",
    refs: [
      {
        kind: "external",
        label: "@emredogan/lumina-chat on npm",
        url: "https://www.npmjs.com/package/@emredogan/lumina-chat",
      },
    ],
    provenance: "external",
  },

  /* ── V3 — Phase 2 (3D Topology) ────────────────────────── */

  {
    id: "v3-aws-topology-3d-scene",
    date: "2026-05-15",
    title: "3D AWS topology — Cloud Waste Hunter explorer",
    category: "topology",
    version: "V3 Phase 2",
    system: "cloud-waste-hunter",
    status: "current",
    summary:
      "A WebGL scene representing the Cloud Waste Hunter architecture as a 12-node 3D constellation. Three.js with @react-three/fiber + @react-three/drei; mobile falls back to a 2D hierarchical view. Renders only on the project sub-page (route-isolated chunk) so the global bundle stays cinematic-fast.",
    rationale:
      "V3's signal experiment: a project case study where the topology is the protagonist, not a static SVG. The route quarantine kept the WebGL cost out of the global bundle; the same pattern is the foundation for Phase 8's cinematic topology (one route, one spectacle).",
    commitSha: "aa3e77e",
    refs: [
      {
        kind: "commit",
        label: "3D scene introduced",
        sha: "c71c96d",
      },
      {
        kind: "commit",
        label: "Mobile 2D fallback",
        sha: "c098a49",
      },
    ],
    provenance: "synthesis",
  },

  /* ── V3 — Phase 1 (Foundation Hardening) ──────────────── */

  {
    id: "v3-edge-kv-and-foundation",
    date: "2026-05-15",
    title: "Edge runtime + KV cache + reduced-motion guard — V3 foundation",
    category: "infrastructure",
    version: "V3 Phase 1",
    system: "portfolio",
    status: "current",
    summary:
      "Five small foundation commits hardened the platform for what V4 would later need: the GitHub events feed moved behind an edge KV cache; the Lumina chat endpoint migrated to edge; conversations persisted across reloads; the global reduced-motion guard collapsed every animation to 0.01ms under the OS preference; a sitemap + robots + JSON-LD + skip-to-content + 44px touch targets shipped together.",
    rationale:
      "The cinematic identity required a performance posture rigid enough to absorb the V4 + V5 AI surface area without ever sacrificing Lighthouse Mobile 98+. Phase 1 was where that contract became architectural rather than aspirational.",
    commitSha: "ec3cc7c",
    refs: [
      {
        kind: "commit",
        label: "Edge chat",
        sha: "18da6eb",
      },
      {
        kind: "commit",
        label: "Reduced-motion guard",
        sha: "a0a3692",
      },
      {
        kind: "commit",
        label: "PWA manifest + icons",
        sha: "039d067",
      },
    ],
    provenance: "synthesis",
  },

  /* ── V1 — Genesis ───────────────────────────────────────── */

  {
    id: "v1-cinematic-identity-genesis",
    date: "2026-05-14",
    title: "Cinematic identity — genesis commit",
    category: "milestone",
    version: "V1",
    system: "portfolio",
    status: "current",
    summary:
      "The initial cinematic identity: black canvas, Geist typography, the #00d2ff accent, the editorial vocabulary the rest of the ecosystem inherits. Three production project case studies (Cloud Waste Hunter, VibingCoderAI, FormAI), three long-form notes, the V3 roadmap document.",
    rationale:
      "The genesis commit framed the engineering work as a single coherent surface rather than a sequence of demos. Every subsequent system — Lumina, /lab, /telemetry, /v5/perception, /evolution — has had to inherit that voice or be rejected.",
    commitSha: "5fee409",
    provenance: "commit",
  },
] as const;
