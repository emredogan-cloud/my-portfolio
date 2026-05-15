import type { Milestone } from "../../_components/types";

/**
 * VibingCoderAI — four milestones for /architecture/vibing-coder-ai.
 *
 * Mirrors data/projects.ts entry for vibing-coder-ai; the structure
 * here is the architectural cross-section, not a re-write of the
 * case study copy.
 */
export const MILESTONES: readonly Milestone[] = [
  {
    id: "interface",
    accent: "Step 01 · Next.js 16",
    title: "The interface.",
    body:
      "A Next.js 16 App Router frontend hosted on Vercel — Server Components by default, client islands only where interactivity demands. TypeScript strict, Tailwind v4, no CSS-in-JS, no module.css. The visitor's casual idea enters here, leaves shaped like a senior-engineer-grade prompt.",
    gradient: { x: 22, y: 24, intensity: 0.22 },
  },
  {
    id: "brain",
    accent: "Step 02 · Lambda + Claude",
    title: "The agentic brain.",
    body:
      "The frontend calls an AWS Lambda over public HTTPS. The Lambda handler runs the Anthropic Claude SDK against a master system prompt that enforces structural completeness, accessibility, error-handling and explicit out-of-scope boundaries. Output is a copy-pasteable Markdown brief any coding agent can execute without scope drift.",
    gradient: { x: 78, y: 36, intensity: 0.26 },
  },
  {
    id: "infrastructure",
    accent: "Step 03 · Terraform",
    title: "The infrastructure.",
    body:
      "A decoupled monorepo: apps/web on Vercel, apps/lambda packaged as an ECR container image, all of it provisioned via Terraform — ECR registry, Lambda compute, API Gateway HTTP edge, DynamoDB tables. Zero console-clicked resources in the stack. Everything is plan-apply.",
    gradient: { x: 28, y: 64, intensity: 0.22 },
  },
  {
    id: "data",
    accent: "Step 04 · DynamoDB",
    title: "The data layer.",
    body:
      "DynamoDB carries the persistence — prompt history, account-scoped settings, future billing state. On-demand billing keeps the cost flat at low traffic and elastic during a spike. Auth (Clerk) and payments (Stripe) sit in the roadmap behind the same table boundaries.",
    gradient: { x: 72, y: 70, intensity: 0.24 },
  },
] as const;
