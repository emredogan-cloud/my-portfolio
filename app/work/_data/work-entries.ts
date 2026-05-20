/* ──────────────────────────────────────────────────────────────
 *  /work — V6 Sub-PR 14.1
 *
 *  Hand-curated work entries — the 5 projects, ordered by
 *  flagship → live → building → planning. Each entry carries the
 *  identifiers needed to address the project from the unified
 *  /work surface: the project slug for /projects detail, the
 *  architecture slug for /architecture walkthrough (when ready),
 *  and the topology key used to derive the constellation strip.
 *
 *  Spec ref: PORTFOLYO_V6_UI_EXECUTION_SYSTEM.md § Sub-PR 14.1.
 *  Audit ref: PORTFOLYO_V6_UI_AUDIT.md §§ 5.1, 5.2, 5.4, 6.1.
 *
 *  Single source of truth. /projects + /architecture continue to
 *  exist (as redirects) and reuse their existing per-page data.
 *  The unified /work surface reads ONLY from here.
 * ────────────────────────────────────────────────────────────── */

import type { PillKind } from "@/components/ui/Pill";

export type WorkState = "live" | "building" | "planning";

export interface WorkEntry {
  /** Project id matching `data/projects.ts` (used for /projects/{slug}). */
  projectSlug: string;
  /**
   * Architecture slug matching `app/architecture/{slug}` directory
   * (may differ from project slug — CWH uses `cloud-waste-hunter`,
   * project id is `aws-waste-hunter`). `null` when no walkthrough
   * has shipped yet (PawDoc / Aevum).
   */
  architectureSlug: string | null;
  /**
   * Topology key — the project node id inside HeroTopologyData
   * (`cwh`, `vibing-coder-ai`, `formai`, `pawdoc`, `aevum`). Used
   * by ProjectStrip to derive the constellation subgraph.
   */
  topologyId: string;
  /** Display index — "01" through "05", flagship → planning. */
  index: string;
  title: string;
  /** Single-line summary, shown in the lead-block flagship + mono list. */
  oneLine: string;
  /** Slightly longer blurb — shown in Outcomes mode editorial rows. */
  outcome: string;
  /** Representative metric / state, shown in Outcomes mode. */
  metric: string;
  /** Operating state — drives the Pill vocabulary. */
  state: WorkState;
  /** Live URL (optional). */
  liveUrl?: string;
  /** GitHub URL (optional). */
  githubUrl?: string;
}

export const STATE_PILL: Record<WorkState, PillKind> = {
  live: "state-live",
  building: "state-building",
  planning: "state-planning",
};

export const STATE_LABEL: Record<WorkState, string> = {
  live: "Live",
  building: "Building",
  planning: "Planning",
};

/* Flagship first — order matters: 14.1's lead block puts entries[0]
   in the CWH treatment, entries[1..4] as the right-hand mono list. */
export const WORK_ENTRIES: readonly WorkEntry[] = [
  {
    projectSlug: "aws-waste-hunter",
    architectureSlug: "cloud-waste-hunter",
    topologyId: "cwh",
    index: "01",
    title: "Cloud Waste Hunter",
    oneLine:
      "Production FinOps SaaS — cross-account AWS scanning, CUR 2.0 attribution, Bedrock-streamed remediation.",
    outcome:
      "Cross-account AWS scanning over STS AssumeRole. Cost attribution via Glue + Athena over CUR 2.0. Findings enriched with Claude Haiku on Bedrock — the model explains the risk and emits the exact Terraform fix.",
    metric: "Live SaaS · cloudwastehunter.io",
    state: "live",
    liveUrl: "https://www.cloudwastehunter.io/",
  },
  {
    projectSlug: "vibing-coder-ai",
    architectureSlug: "vibing-coder-ai",
    topologyId: "vibing-coder-ai",
    index: "02",
    title: "VibingCoderAI",
    oneLine:
      "Prompt-engineering-as-a-service — casual developer ideas in, senior-grade AI agent briefs out.",
    outcome:
      "Decoupled Next.js + AWS Lambda monorepo. Anthropic Claude API behind a strict master system prompt that enforces structural completeness. The brief is copy-pasteable into Claude Code, Cursor, or Windsurf.",
    metric: "Live · vibingcoderai.com",
    state: "building",
    liveUrl: "https://www.vibingcoderai.com/",
    githubUrl: "https://github.com/emredogan-cloud/VibingCodeAI",
  },
  {
    projectSlug: "sixpack-ai",
    architectureSlug: "sixpack-ai",
    topologyId: "formai",
    index: "03",
    title: "FormAI — Fitness Koçu",
    oneLine:
      "Flutter native — real-time pose detection on the device's NPU, 30 fps, no round-trip to the cloud.",
    outcome:
      "Google ML Kit tracks 33 body landmarks at 30 fps; joint-angle math evaluates rep quality and triggers corrective audio cues. Supabase + RevenueCat behind it. The best cloud architecture is sometimes knowing when not to use the cloud.",
    metric: "30 fps · on-device pose detection",
    state: "building",
  },
  {
    projectSlug: "pawdoc",
    architectureSlug: null,
    topologyId: "pawdoc",
    index: "04",
    title: "PawDoc",
    oneLine:
      "AI pet-health triage — computer vision + multimodal LLM scoring against a structured veterinary framework.",
    outcome:
      "Multimodal model reads photos + symptom descriptions against a structured triage framework. Output is a prioritised recommendation grounded in observable signs — \"monitor at home\" vs \"go to the clinic now\".",
    metric: "Development started · walkthrough drafting",
    state: "planning",
  },
  {
    projectSlug: "aevum",
    architectureSlug: null,
    topologyId: "aevum",
    index: "05",
    title: "Aevum",
    oneLine:
      "Eldercare OS — unified dashboard for adult children managing aging parents. One AI-generated daily briefing.",
    outcome:
      "Medication adherence, appointment coordination, insurance document management, family role-based access. The daily briefing surfaces issues before they become crises — \"Mum's BP was high yesterday; her cardiology appointment is in 3 days\".",
    metric: "Concept phase · architecture drafting",
    state: "planning",
  },
] as const;
