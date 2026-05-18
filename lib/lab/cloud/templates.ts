/**
 * Cloud Lab template strings — Sub-PR 3.5.
 *
 * The Cloud Lab is content-only: there is no server-side AWS call.
 * This module produces the actual IaC text a visitor would deploy
 * to their own AWS account to set up the cross-account STS pattern
 * Cloud Waste Hunter uses for production scanning.
 *
 * Public surface:
 *   - validateAccountId(value) — true for a 12-digit AWS account id
 *   - generateExternalId()    — random UUID for the confused-deputy mitigation
 *   - buildCloudformation({ parentAccountId, externalId })
 *   - buildTerraform({ parentAccountId, externalId })
 *   - buildVerifyCommand({ roleArn, externalId })
 *
 * Why a separate module:
 *   The strings are long enough that inlining them in the React
 *   client island would dominate the file. Keeping them here also
 *   means they're testable in isolation and can be re-used by a
 *   future Lumina tool (e.g. `getCloudLabTemplate`) without
 *   importing client-only code.
 *
 * Bundle posture:
 *   This module is plain TypeScript with no AWS SDK / Node imports.
 *   It is safe to import from client components — Webpack tree-
 *   shakes the unused functions per build.
 */

export interface TemplateInputs {
  /** The AWS account id that will be allowed to assume this role.
   *  Twelve numeric digits. */
  parentAccountId: string;
  /** Shared-secret value placed in the trust policy's
   *  `sts:ExternalId` condition. The same value must be passed by
   *  the parent account on AssumeRole — without it the trust
   *  policy denies. */
  externalId: string;
}

/** Strict 12-digit numeric check. AWS account ids are exactly twelve
 *  ASCII digits — no separators, no leading "AWS-". */
export function validateAccountId(value: string): boolean {
  return /^\d{12}$/.test(value.trim());
}

/** Generate a fresh random external id. Uses crypto.randomUUID when
 *  available (modern browsers, Node 19+), falls back to a hand-rolled
 *  hex sequence so older environments still get something usable. */
export function generateExternalId(): string {
  if (
    typeof globalThis !== "undefined" &&
    typeof globalThis.crypto !== "undefined" &&
    typeof globalThis.crypto.randomUUID === "function"
  ) {
    return globalThis.crypto.randomUUID();
  }
  /* Hex fallback — 32 chars of random material. Not RFC 4122
   * formatted, but unambiguously unique enough for the trust
   * policy's purpose. */
  const buf = new Uint8Array(16);
  if (
    typeof globalThis !== "undefined" &&
    typeof globalThis.crypto !== "undefined" &&
    typeof globalThis.crypto.getRandomValues === "function"
  ) {
    globalThis.crypto.getRandomValues(buf);
  } else {
    for (let i = 0; i < buf.length; i++) {
      buf[i] = Math.floor(Math.random() * 256);
    }
  }
  return Array.from(buf, (b) => b.toString(16).padStart(2, "0")).join("");
}

/* ── CloudFormation ──────────────────────────────────────────────── */

export function buildCloudformation({
  parentAccountId,
  externalId,
}: TemplateInputs): string {
  return `AWSTemplateFormatVersion: '2010-09-09'
Description: >
  Cross-account IAM role for the Cloud Lab pattern.

  Deploying this stack creates a role in YOUR account that account
  ${parentAccountId} can assume — and ONLY that account, ONLY with
  the external-id below. The role permissions below are an example;
  replace them with the AWS API surface you actually need to grant.

Parameters:
  RoleName:
    Type: String
    Default: cloud-lab-cross-account-role
    Description: Name for the IAM role.

Resources:
  CrossAccountRole:
    Type: AWS::IAM::Role
    Properties:
      RoleName: !Ref RoleName
      MaxSessionDuration: 3600
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Sid: TrustParentAccount
            Effect: Allow
            Principal:
              # The parent account that will be allowed to AssumeRole.
              AWS: 'arn:aws:iam::${parentAccountId}:root'
            Action: 'sts:AssumeRole'
            Condition:
              StringEquals:
                # The external-id is a shared secret. The parent MUST
                # pass it on AssumeRole or the trust policy denies —
                # this is the confused-deputy mitigation.
                'sts:ExternalId': '${externalId}'
      Policies:
        - PolicyName: CloudLabExamplePermissions
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              # Replace this Statement with the permissions you
              # want to grant. The example below allows the parent
              # account to invoke Claude Haiku via Bedrock — the
              # narrowest reasonable demo permission.
              - Sid: ExampleInvokeBedrock
                Effect: Allow
                Action: 'bedrock:InvokeModel'
                Resource:
                  - !Sub 'arn:aws:bedrock:\${AWS::Region}::foundation-model/anthropic.claude-3-5-haiku-20241022-v1:0'

Outputs:
  RoleArn:
    Description: ARN to paste back into the parent system.
    Value: !GetAtt CrossAccountRole.Arn
  ExternalId:
    Description: External-id value the parent must pass on AssumeRole.
    Value: '${externalId}'
`;
}

/* ── Terraform ───────────────────────────────────────────────────── */

export function buildTerraform({
  parentAccountId,
  externalId,
}: TemplateInputs): string {
  return `# Cross-account IAM role for the Cloud Lab pattern.
#
# Deploying this module creates a role in YOUR account that account
# ${parentAccountId} can assume — and ONLY that account, ONLY with
# the external-id below.

variable "role_name" {
  description = "IAM role name."
  type        = string
  default     = "cloud-lab-cross-account-role"
}

variable "parent_account_id" {
  description = "AWS account id allowed to assume this role."
  type        = string
  default     = "${parentAccountId}"
}

variable "external_id" {
  description = "Shared secret for the confused-deputy mitigation."
  type        = string
  default     = "${externalId}"
  sensitive   = true
}

data "aws_iam_policy_document" "trust" {
  statement {
    sid     = "TrustParentAccount"
    effect  = "Allow"
    actions = ["sts:AssumeRole"]

    principals {
      type        = "AWS"
      identifiers = ["arn:aws:iam::\${var.parent_account_id}:root"]
    }

    condition {
      test     = "StringEquals"
      variable = "sts:ExternalId"
      values   = [var.external_id]
    }
  }
}

data "aws_region" "current" {}

data "aws_iam_policy_document" "permissions" {
  # Replace this Statement with the permissions you want to grant.
  # The example allows the parent account to invoke Claude Haiku via
  # Bedrock — the narrowest reasonable demo permission.
  statement {
    sid     = "ExampleInvokeBedrock"
    effect  = "Allow"
    actions = ["bedrock:InvokeModel"]
    resources = [
      "arn:aws:bedrock:\${data.aws_region.current.name}::foundation-model/anthropic.claude-3-5-haiku-20241022-v1:0",
    ]
  }
}

resource "aws_iam_role" "cross_account" {
  name                 = var.role_name
  max_session_duration = 3600
  assume_role_policy   = data.aws_iam_policy_document.trust.json
}

resource "aws_iam_role_policy" "permissions" {
  name   = "cloud-lab-example-permissions"
  role   = aws_iam_role.cross_account.id
  policy = data.aws_iam_policy_document.permissions.json
}

output "role_arn" {
  description = "ARN to paste back into the parent system."
  value       = aws_iam_role.cross_account.arn
}

output "external_id" {
  description = "External-id value the parent must pass on AssumeRole."
  value       = var.external_id
  sensitive   = true
}
`;
}

/* ── CLI verification ────────────────────────────────────────────── */

export interface VerifyInputs {
  /** Full ARN of the role you deployed, returned by the IaC stack. */
  roleArn: string;
  /** The external-id baked into the trust policy. */
  externalId: string;
}

export function buildVerifyCommand({
  roleArn,
  externalId,
}: VerifyInputs): string {
  return `# Run from the PARENT account (the one whose credentials are
# active in your shell). This proves the trust policy is correct;
# we never run it on our side.
aws sts assume-role \\
  --role-arn ${roleArn} \\
  --role-session-name cloud-lab-verify \\
  --external-id ${externalId} \\
  --duration-seconds 900

# Success: AWS prints temporary credentials.
# Failure: "Not authorized to perform sts:AssumeRole" — review the
# trust policy, the parent account id, or the external-id.`;
}
