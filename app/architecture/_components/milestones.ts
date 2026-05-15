/**
 * The 8 milestones that make up the /architecture scroll story.
 *
 * This commit (Step 2 / ScrollStory engine) carries titles + short
 * single-sentence bodies — enough for the engine to prove out the
 * intersection-driven transitions. Step 3 will widen each milestone
 * with the richer prose + illustrations.
 *
 * Each milestone also carries:
 *   accent — a small chip/eyebrow shown above the title.
 *   gradient — { x, y } percentages controlling where the cyan
 *              radial blob sits in the background for this section.
 *              All milestones stay inside the cyan/#00d2ff palette;
 *              we vary POSITION, not hue, to honour the cinematic
 *              identity rules ("cyan only, never new hues").
 */

export interface Milestone {
  id: string;
  accent: string;
  title: string;
  body: string;
  /** Background blob position as a percentage of the viewport. */
  gradient: { x: number; y: number; intensity: number };
}

export const MILESTONES: readonly Milestone[] = [
  {
    id: "signup",
    accent: "Step 01 · Cognito",
    title: "A visitor signs up.",
    body:
      "AWS Cognito with Google IdP federation and a custom email Lambda. Account exists before a single AWS resource is touched.",
    gradient: { x: 78, y: 22, intensity: 0.20 },
  },
  {
    id: "assume-role",
    accent: "Step 02 · STS",
    title: "They connect an AWS account.",
    body:
      "STS AssumeRole with a per-customer external id and a strict read-only policy template. No permanent credentials ever stored.",
    gradient: { x: 22, y: 25, intensity: 0.22 },
  },
  {
    id: "lambda-trigger",
    accent: "Step 03 · Lambda",
    title: "The scanner Lambda triggers.",
    body:
      "FastAPI container image deployed behind API Gateway. Async dispatch via a self-invoke pattern bypasses the 30s gateway timeout.",
    gradient: { x: 80, y: 60, intensity: 0.25 },
  },
  {
    id: "fanout",
    accent: "Step 04 · ThreadPool(32)",
    title: "Multi-region fan-out.",
    body:
      "A ThreadPoolExecutor with 32 workers scans every configured region in parallel — hundreds of resources inventoried in seconds, not minutes.",
    gradient: { x: 18, y: 55, intensity: 0.22 },
  },
  {
    id: "dynamodb",
    accent: "Step 05 · DynamoDB",
    title: "Findings land in DynamoDB.",
    body:
      "Six tables: accounts, scans, findings, billing, sessions, audit. Cost figures are anchored to AWS Cost and Usage Report 2.0 via Glue + Athena.",
    gradient: { x: 75, y: 35, intensity: 0.24 },
  },
  {
    id: "bedrock",
    accent: "Step 06 · Bedrock",
    title: "Claude generates remediation.",
    body:
      "Claude 3.5 Haiku on AWS Bedrock streams the explanation, the risk, and the exact CLI or Terraform fix — grounded in the scan data, not invented.",
    gradient: { x: 28, y: 38, intensity: 0.26 },
  },
  {
    id: "dashboard",
    accent: "Step 07 · Dashboard",
    title: "The customer sees the savings.",
    body:
      "Quantified waste by service, prioritised by impact, with one-click remediation buttons backed by the deterministic playbook engine.",
    gradient: { x: 50, y: 30, intensity: 0.22 },
  },
  {
    id: "eventbridge",
    accent: "Step 08 · EventBridge",
    title: "The loop recurs.",
    body:
      "EventBridge cron + SQS dispatch re-runs the scan on a schedule. New waste is caught within minutes of being created — the loop is the product.",
    gradient: { x: 50, y: 60, intensity: 0.20 },
  },
] as const;
