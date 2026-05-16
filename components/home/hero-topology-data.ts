/**
 * Hero Topology — concentric-ring constellation data.
 *
 * Three rings of nodes orbiting a central identity:
 *   Ring 0 (center): Emre Doğan
 *   Ring 1 (inner):  shipped + building + planning projects
 *   Ring 2 (middle): focus areas (Cloud Architecture, FinOps, AI Systems, …)
 *   Ring 3 (outer):  tech stack vocabulary (AWS, Bedrock, Terraform, …)
 *
 * Edges are deliberately sparse: center→project (5), project→focus
 * (selective), focus→tech (selective). A fully-connected graph would
 * read as a hairball; the chosen edges trace the actual "how does
 * this project use these technologies" path that a reader can follow
 * with their eye.
 *
 * Coordinates are polar (degrees, 0° = +X, growing clockwise — same
 * convention as topology-data.ts in projects/[slug]/_components). The
 * component projects them onto a 1000×1000 viewBox.
 */

export type RingId = "center" | "projects" | "focus" | "tech";

export interface HeroNode {
  id: string;
  label: string;
  ring: RingId;
  /** Polar angle in degrees, 0° = +X. Ignored for the center node. */
  angleDeg: number;
  /** Optional richer description surfaced in the hover tooltip. */
  blurb?: string;
}

export interface HeroEdge {
  from: string;
  to: string;
}

/* ── Ring radii (in viewBox units, viewBox is 1000×1000) ─────────── */

export const VIEWBOX = { x: 0, y: 0, w: 1000, h: 1000 } as const;
export const CENTER = { x: 500, y: 500 } as const;
export const RADII = {
  projects: 200,
  focus: 320,
  tech: 450,
} as const;

/* ── Node radii (visual sizing inside the SVG) ───────────────────── */

export const NODE_R = {
  center: 46,
  projects: 22,
  focus: 14,
  tech: 9,
} as const;

/* ── Nodes ───────────────────────────────────────────────────────── */

/* Ring 1 — Projects (5, evenly spaced starting at -90° = top).
 *
 * Order chosen so the shipped flagship (CWH) anchors the top of the
 * ring; building projects orbit east + south-east; planning projects
 * fill west + south-west. Visually, a reader's eye lands first on
 * the project closest to "done", then sweeps outward. */
const PROJECTS: readonly HeroNode[] = [
  {
    id: "cwh",
    label: "Cloud Waste Hunter",
    ring: "projects",
    angleDeg: -90,
    blurb:
      "Shipped. Production FinOps SaaS on AWS — cross-account scanner + Bedrock remediation. cloudwastehunter.io.",
  },
  {
    id: "vibing-coder-ai",
    label: "VibingCoderAI",
    ring: "projects",
    angleDeg: -18,
    blurb:
      "Live. Prompt-engineering-as-a-service. Next.js + AWS Lambda monorepo, Anthropic Claude API. vibingcoderai.com.",
  },
  {
    id: "formai",
    label: "FormAI",
    ring: "projects",
    angleDeg: 54,
    blurb:
      "Building. Flutter native fitness coach — real-time pose detection via Google ML Kit, Supabase + RevenueCat.",
  },
  {
    id: "pawdoc",
    label: "PawDoc",
    ring: "projects",
    angleDeg: 126,
    blurb:
      "Development started. AI pet-health triage — computer vision + multimodal AI against a structured triage framework.",
  },
  {
    id: "aevum",
    label: "Aevum",
    ring: "projects",
    angleDeg: 198,
    blurb:
      "Concept phase. AI eldercare coordination platform — a unified OS for adult children managing aging parents.",
  },
] as const;

/* Ring 2 — Focus Areas (6, evenly spaced starting at -90°). */
const FOCUS: readonly HeroNode[] = [
  { id: "cloud-arch", label: "Cloud Architecture", ring: "focus", angleDeg: -90, blurb: "AWS multi-region, IAM hardening, Terraform IaC, cross-account STS." },
  { id: "ai-systems", label: "AI Systems",         ring: "focus", angleDeg: -30, blurb: "Claude on Bedrock, streaming, tool-use, multi-step reasoning, retrieval." },
  { id: "fullstack",  label: "Full-Stack",         ring: "focus", angleDeg:  30, blurb: "Next.js 16 App Router, edge runtime, TypeScript strict, Server Components." },
  { id: "finops",     label: "FinOps",             ring: "focus", angleDeg:  90, blurb: "CUR 2.0 over Athena, cost attribution, waste detection, remediation." },
  { id: "devops",     label: "DevOps",             ring: "focus", angleDeg: 150, blurb: "Terraform, GitHub Actions, Vercel, sigstore provenance, edge deploys." },
  { id: "mobile",     label: "Mobile",             ring: "focus", angleDeg: 210, blurb: "Flutter native, on-device ML inference, RevenueCat, Supabase real-time." },
] as const;

/* Ring 3 — Tech Stack (12, evenly spaced starting at -90°).
 *
 * Picked to read as Emre's actual vocabulary, not a buzzword shelf:
 * services he writes Terraform for, libraries that ship in his
 * package.json files, models he calls on Bedrock. */
const TECH: readonly HeroNode[] = [
  { id: "aws",        label: "AWS",        ring: "tech", angleDeg: -90, blurb: "Primary cloud — Lambda, API Gateway, DynamoDB, CloudFront, Cognito, Bedrock." },
  { id: "bedrock",    label: "Bedrock",    ring: "tech", angleDeg: -60, blurb: "Claude Haiku / Sonnet over Bedrock for remediation, tool-use, streaming chat." },
  { id: "claude",     label: "Claude",     ring: "tech", angleDeg: -30, blurb: "Anthropic Claude — both Bedrock and direct API. Lumina runs on this." },
  { id: "nextjs",     label: "Next.js",    ring: "tech", angleDeg:   0, blurb: "Next.js 16 App Router. This portfolio + VibingCoderAI both run on it." },
  { id: "typescript", label: "TypeScript", ring: "tech", angleDeg:  30, blurb: "TypeScript strict mode — every frontend, every Lambda, every Lumina tool." },
  { id: "vercel",     label: "Vercel",     ring: "tech", angleDeg:  60, blurb: "Edge runtime, Vercel KV, cron, sigstore-attested npm publishes." },
  { id: "terraform",  label: "Terraform",  ring: "tech", angleDeg:  90, blurb: "Every AWS resource provisioned in code. No console-clicked infrastructure." },
  { id: "lambda",     label: "Lambda",     ring: "tech", angleDeg: 120, blurb: "Container images + Function URLs + self-invoke pattern for long jobs." },
  { id: "dynamodb",   label: "DynamoDB",   ring: "tech", angleDeg: 150, blurb: "Single-table designs, GSIs, streams. The state behind CWH and Lumina." },
  { id: "cognito",    label: "Cognito",    ring: "tech", angleDeg: 180, blurb: "User pools + Google IdP federation + custom email Lambda triggers." },
  { id: "flutter",    label: "Flutter",    ring: "tech", angleDeg: 210, blurb: "Flutter 3.22 + Riverpod 3.3 — FormAI runs on this stack natively." },
  { id: "supabase",   label: "Supabase",   ring: "tech", angleDeg: 240, blurb: "Postgres + auth + real-time for the FormAI backend." },
] as const;

export const CENTER_NODE: HeroNode = {
  id: "emre",
  label: "Emre Doğan",
  ring: "center",
  angleDeg: 0,
  blurb:
    "Cloud & SaaS engineer in Adana, Türkiye. Drag to pan, scroll to zoom.",
};

export const HERO_NODES: readonly HeroNode[] = [
  CENTER_NODE,
  ...PROJECTS,
  ...FOCUS,
  ...TECH,
];

/* ── Edges ───────────────────────────────────────────────────────── */

/* Center → projects: every project radiates from the identity. */
const CENTER_EDGES: readonly HeroEdge[] = PROJECTS.map((p) => ({
  from: "emre",
  to: p.id,
}));

/* Project → focus: one or two focus areas per project that best
 * describe what the project actually demands. */
const PROJECT_FOCUS_EDGES: readonly HeroEdge[] = [
  { from: "cwh",             to: "cloud-arch" },
  { from: "cwh",             to: "finops"     },
  { from: "vibing-coder-ai", to: "ai-systems" },
  { from: "vibing-coder-ai", to: "fullstack"  },
  { from: "formai",          to: "mobile"     },
  { from: "formai",          to: "ai-systems" },
  { from: "pawdoc",          to: "ai-systems" },
  { from: "aevum",           to: "fullstack"  },
];

/* Focus → tech: representative technologies per focus area. Not every
 * focus owns every relevant tech — picked the canonical 1-2 each. */
const FOCUS_TECH_EDGES: readonly HeroEdge[] = [
  { from: "cloud-arch", to: "aws"        },
  { from: "cloud-arch", to: "terraform"  },
  { from: "ai-systems", to: "bedrock"    },
  { from: "ai-systems", to: "claude"     },
  { from: "fullstack",  to: "nextjs"     },
  { from: "fullstack",  to: "typescript" },
  { from: "finops",     to: "dynamodb"   },
  { from: "finops",     to: "lambda"     },
  { from: "devops",     to: "terraform"  },
  { from: "devops",     to: "vercel"     },
  { from: "mobile",     to: "flutter"    },
  { from: "mobile",     to: "supabase"   },
];

export const HERO_EDGES: readonly HeroEdge[] = [
  ...CENTER_EDGES,
  ...PROJECT_FOCUS_EDGES,
  ...FOCUS_TECH_EDGES,
];

/* ── Visual constants ────────────────────────────────────────────── */

/** Brand cyan + descending opacity stack per ring. */
export const RING_STYLE = {
  center: { fill: "#ffffff", glow: "rgba(0,210,255,0.55)" },
  projects: { fill: "#00d2ff", glow: "rgba(0,210,255,0.45)" },
  focus: { fill: "#5db4f5", glow: "rgba(93,180,245,0.35)" },
  tech: { fill: "#aee5ff", glow: "rgba(174,229,255,0.25)" },
} as const;

/** Edge opacity per "depth" from center — brightest near root, fading
 *  outward so the eye traces center → project → focus → tech. */
export const EDGE_OPACITY = {
  centerToProject: 0.45,
  projectToFocus: 0.22,
  focusToTech: 0.12,
} as const;
