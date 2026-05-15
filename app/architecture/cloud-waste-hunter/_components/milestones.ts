/**
 * Cloud Waste Hunter — eight milestones for /architecture/cloud-waste-hunter.
 *
 * The Milestone type lives in app/architecture/_components/types.ts
 * so every project under /architecture/{project} can share the same
 * scroll-story engine while owning its own content.
 */

import type { Milestone } from "../../_components/types";

export const MILESTONES: readonly Milestone[] = [
  {
    id: "signup",
    accent: "Step 01 · Cognito",
    title: "A visitor signs up.",
    body:
      "AWS Cognito user pool with Google IdP federation and a custom email Lambda for verification. The account exists in the SaaS before a single resource in the customer's AWS estate is touched — credentials never travel through the marketing site.",
    gradient: { x: 78, y: 22, intensity: 0.20 },
  },
  {
    id: "assume-role",
    accent: "Step 02 · STS AssumeRole",
    title: "They connect an AWS account.",
    body:
      "The customer launches a CloudFormation template that creates a read-only IAM role bound to the SaaS principal via a per-customer external id. The scanner assumes that role via STS — temporary credentials, scoped policy, no long-lived secret to leak, ever.",
    gradient: { x: 22, y: 25, intensity: 0.22 },
  },
  {
    id: "lambda-trigger",
    accent: "Step 03 · Lambda",
    title: "The scanner Lambda triggers.",
    body:
      "A FastAPI container image runs as a Lambda behind API Gateway. The scan endpoint returns immediately and the Lambda self-invokes via the AWS SDK — that detail is how we bypass the 30-second API Gateway hard timeout and still keep the request path entirely serverless.",
    gradient: { x: 80, y: 60, intensity: 0.25 },
  },
  {
    id: "fanout",
    accent: "Step 04 · ThreadPool(32)",
    title: "Multi-region fan-out.",
    body:
      "Inside the Lambda, a ThreadPoolExecutor with 32 workers scans every configured region in parallel — EC2, EBS, RDS, NAT, EIP, ELB, snapshots, the lot. Hundreds of resources inventoried in seconds instead of minutes, with cost-per-region attribution preserved through the pipeline.",
    gradient: { x: 18, y: 55, intensity: 0.22 },
  },
  {
    id: "dynamodb",
    accent: "Step 05 · DynamoDB",
    title: "Findings land in DynamoDB.",
    body:
      "Six tables — accounts, scans, findings, billing, sessions, audit — capture the inventory. Cost figures are anchored to AWS Cost and Usage Report 2.0 via a Glue catalogue + Athena, so every dollar figure in the dashboard is reconcilable against a real CUR line item.",
    gradient: { x: 75, y: 35, intensity: 0.24 },
  },
  {
    id: "bedrock",
    accent: "Step 06 · Bedrock",
    title: "Claude generates remediation.",
    body:
      "Claude 3.5 Haiku on AWS Bedrock streams an explanation, the risk, and the exact CLI or Terraform snippet to fix each finding. The model is grounded in the scan data — never invents resource ids or costs — and chat streaming goes through a Lambda Function URL to bypass the API Gateway timeout entirely.",
    gradient: { x: 28, y: 38, intensity: 0.26 },
  },
  {
    id: "dashboard",
    accent: "Step 07 · Dashboard",
    title: "The customer sees the savings.",
    body:
      "Waste quantified by service, prioritised by dollar impact, with one-tap remediation buttons that fire deterministic playbook commands — not LLM-generated ones. The customer sees the number, the cause, and the exact action that closes the gap, in one screen.",
    gradient: { x: 50, y: 30, intensity: 0.22 },
  },
  {
    id: "eventbridge",
    accent: "Step 08 · EventBridge",
    title: "The loop recurs.",
    body:
      "EventBridge cron schedules + SQS-decoupled dispatch re-run every customer's scan on cadence. New waste is caught within minutes of being created and a Slack notification fires before the bill closes. The loop — not any individual scan — is the product.",
    gradient: { x: 50, y: 60, intensity: 0.20 },
  },
] as const;
