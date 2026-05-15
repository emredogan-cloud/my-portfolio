/**
 * Bedrock runtime client used by /api/cwh-demo.
 *
 * Kept in its own module so the route handler stays focused on
 * streaming + rate-limit logic, and future endpoints (Phase 3's
 * /api/cwh/live-metrics, etc.) can share a single configuration
 * surface — IAM credentials, region, retry posture.
 *
 * Reads credentials from the Vercel env:
 *   AWS_BEDROCK_ACCESS_KEY     — IAM user with bedrock:InvokeModelWithResponseStream
 *   AWS_BEDROCK_SECRET_KEY     — paired secret
 *   AWS_BEDROCK_REGION         — optional override; defaults to us-east-1
 *
 * Throws at construction time if either credential is missing, so a
 * misconfigured deploy fails loudly during the first request rather
 * than silently leaking unauthenticated requests against the
 * default AWS credential chain.
 */

import {
  BedrockRuntimeClient,
  type BedrockRuntimeClientConfig,
} from "@aws-sdk/client-bedrock-runtime";

const DEFAULT_REGION = "us-east-1";

export function getBedrockClient(): BedrockRuntimeClient {
  const accessKeyId = process.env.AWS_BEDROCK_ACCESS_KEY;
  const secretAccessKey = process.env.AWS_BEDROCK_SECRET_KEY;
  if (!accessKeyId || !secretAccessKey) {
    throw new Error("bedrock-not-configured");
  }

  const config: BedrockRuntimeClientConfig = {
    region: process.env.AWS_BEDROCK_REGION ?? DEFAULT_REGION,
    credentials: { accessKeyId, secretAccessKey },
  };

  return new BedrockRuntimeClient(config);
}

/** Bedrock-side model id for Claude 3.5 Haiku, matching the model
 *  Cloud Waste Hunter uses in production (see data/projects.ts). */
export const CLAUDE_HAIKU_BEDROCK_ID =
  "anthropic.claude-3-5-haiku-20241022-v1:0";

/** Bedrock anthropic version pin — required in every InvokeModel
 *  payload for anthropic.* models. */
export const BEDROCK_ANTHROPIC_VERSION = "bedrock-2023-05-31";
