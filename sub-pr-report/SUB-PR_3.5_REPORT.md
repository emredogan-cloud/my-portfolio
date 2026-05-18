# Sub-PR 3.5 — Lumina V3: Cloud Lab (Educational + Template Generator)

**Branch:** `feat/v4-phase3-operator-systems`
**Phase:** V4 Phase 3 — AI-Native Operator Systems (user-reframed)
**Scope:** New `/lab/cloud` page. Pure educational content + a
client-side template generator. Zero new dependencies. Zero
server-side AWS calls. Zero ongoing operational cost.

---

## 1. Mission

The V4 § 4.4 Sub-PR 4.5 envisioned a Bedrock-against-visitor's-
own-AWS surface — full cross-account STS plumbing, audit log,
per-visitor cost cap. That would have shipped real liability and
real maintenance for a portfolio surface that may see one or two
serious uses per month.

3.5 deliberately ships the educational foundation instead: the
visitor reads the architecture, plugs their parent-account id into
a client-side form, and downloads deployable CloudFormation /
Terraform — the same cross-account STS pattern Cloud Waste Hunter
uses for production scanning, generated for their account. The
verification step is a CLI snippet they run from their OWN side.
Our infrastructure never touches their credentials.

If real cross-account invocation ever earns its place, a future
sub-PR can layer it on top of this foundation. For now, the
content demo is operator-grade and honest about the boundary.

---

## 2. Architecture demonstrated

The page explains and emits IaC for this trust pattern:

```
                                                    ┌──────────────┐
                                                    │ External id  │
                                                    │ shared secret│
                                                    └──────┬───────┘
                                                           │
   Parent account (123456789012)              Your account ──────────────────┐
                  │                                        │                  │
                  │  sts:AssumeRole(role-arn, external-id) │                  │
                  ├───────────────────────────────────────►│                  │
                  │                                        │                  │
                  │  ◄───── temporary credentials ─────────│  Role's trust    │
                  │           (15 min)                     │  policy: allow   │
                  │                                        │  if Principal +  │
                  │                                        │  external-id     │
                  ▼                                        │  match           │
   Acts on your behalf within                              │                  │
   role's permission policy.                               └──────────────────┘
```

Three actors, one trust boundary, zero shared long-term credentials.
The Principal in the trust policy controls WHO can assume; the
external-id mitigates the confused-deputy problem; the permission
policy controls WHAT the assumed session can do.

---

## 3. What changed

| File | Change |
|------|--------|
| `lib/lab/registry.ts` | + 5th ExperimentEntry (`cloud`, index `05`, status `active`). The lab index and Lumina's `getLabStatus` tool both read from this registry, so the new surface appears in both automatically. |
| `lib/lab/cloud/templates.ts` (new) | Pure-TypeScript template builders. `buildCloudformation`, `buildTerraform`, `buildVerifyCommand`. Helpers: `validateAccountId` (strict 12-digit), `generateExternalId` (crypto.randomUUID with hex fallback). No AWS SDK, no Node imports — safe to import from client code. |
| `app/lab/cloud/page.tsx` (new) | Server component, uses the shared `ExperimentFrame`. Sets metadata, renders the architecture brief, slots in the client island. Custom footer reads "Content-only · No server-side AWS calls · Inputs stay in your browser" — the visitor knows exactly what they're getting. |
| `app/lab/cloud/_components/CloudTemplateGenerator.tsx` (new) | Client island. Two inputs (parent account id + external id), three tabs (CloudFormation / Terraform / CLI), copy + download affordances. Account-id validation surfaces an inline amber pill ("expected 12 numeric digits") without blocking the tabs. External id seeds from `crypto.randomUUID` on mount with a hydration-safe empty-server-render. |

No new dependencies. No new env vars. No new server routes. No
existing files touched except the registry.

---

## 4. The form and its outputs

### Inputs
- **Parent account id** — 12 numeric digits, the AWS account that
  would be allowed to assume your role.
- **External id** — auto-generated UUID; visitor can regenerate
  via a quiet `regen` button or paste their own.

### Outputs (three tabs, copyable + downloadable)
- **CloudFormation** (`cloud-lab-role.cfn.yaml`) — `AWS::IAM::Role`
  with the trust policy + an example permission statement
  (`bedrock:InvokeModel` against Claude Haiku, narrowed to the
  foundation-model ARN). Outputs the role ARN and external id so
  the visitor can copy them post-deploy.
- **Terraform** (`cloud-lab-role.tf`) — same shape using
  `aws_iam_role` + `aws_iam_role_policy` and `aws_iam_policy_document`
  data sources. The external id is marked `sensitive` in the
  outputs block.
- **CLI verify** — an `aws sts assume-role` command the visitor
  runs from THEIR terminal to confirm the trust policy works.
  Copy-only (no download — it's a single command).

### What stays in the browser
- Both inputs
- Both generated templates
- The CLI snippet
- The copied / downloaded files
- Nothing reaches our server. Ever.

---

## 5. Visual contract

Matches the existing `/lab/*` vocabulary verbatim:

- `ExperimentFrame` chrome (breadcrumb eyebrow, two-line hero,
  framing paragraph, custom footer)
- `bg-black` + ambient cyan gradient
- text-primary / text-secondary / text-tertiary / text-quiet / text-faint
- `font-mono uppercase tracking-[0.20em] text-[10px]` mono labels
- `#00d2ff` accent on active tab + `regen` hover state
- amber pill (`text-amber-300/80`) for the account-id validation
  error — same vocabulary the lab error states use elsewhere
- Reveal motion on hero, paragraph, body, footer (handled by
  ExperimentFrame; no new motion primitives)

---

## 6. Invariants verified

| Invariant                                                                       | Status |
|---------------------------------------------------------------------------------|--------|
| `tsc --noEmit` clean                                                            | ✓ exit 0 |
| `eslint` clean on touched files                                                 | ✓ exit 0 |
| Production build green — all routes intact                                      | ✓ exit 0 |
| `/lab/cloud` registered as a static route                                       | ✓      |
| Zero new npm dependencies                                                       | ✓      |
| Zero new env vars                                                               | ✓      |
| Zero new server routes                                                          | ✓      |
| `@aws-sdk` / `@sentry/nextjs` / `@octokit/rest` absent from client chunks       | ✓ (0 matches) |
| Operator + lab + memory server symbols absent from client chunks                | ✓ (0 matches) |
| `@xyflow/react` still single dynamic chunk                                      | ✓      |
| `@emredogan/lumina-chat` tarball: 29 files / 23.7 kB                            | ✓ unchanged |
| `@emredogan/cli` tarball: 15 files / 13.5 kB                                    | ✓ unchanged |
| Cinematic identity: `#00d2ff`, Geist, `bg-black`                                | ✓      |
| Reduced-motion support intact                                                   | ✓ (no new motion surfaces) |
| Client island compiles + ships template strings                                 | ✓ (AWSTemplateFormatVersion present in 1 chunk) |

One `eslint-disable-next-line react-hooks/set-state-in-effect` was
added to the client island's mount-time UUID seed. The pattern is
deliberate to avoid a hydration mismatch — server renders an
empty string, client populates on first commit. The rationale is
captured in a code comment.

---

## 7. Cost + privacy posture

### Cost
- **Build-time:** zero. The page is statically rendered (`/lab/cloud ○ Static`).
- **Per-visit:** zero. The client island runs entirely in-browser.
  No server-side AWS calls, no Bedrock calls, no STS calls.
- **Per-template-download:** zero. `URL.createObjectURL` against
  an in-memory Blob.

### Privacy
- The visitor's parent-account id and external id are never
  transmitted. Both inputs stay in the React component's state,
  never round-trip to a server.
- The generated templates are emitted into the visitor's clipboard
  or as a file download — the platform has no copy of either.
- The downloadable `.tf` and `.yaml` files contain the external
  id in plaintext (it's a deployment artifact). The visitor is
  responsible for storing it securely once it leaves the browser.

---

## 8. Rollback

Single-commit revert removes:
- The registry entry → `getLabStatus` and `/lab` index stop
  surfacing the cloud entry
- The page route → `/lab/cloud` 404s
- The client island file
- The templates module

Nothing else references any of this. Clean revert.

---

## 9. Out-of-scope acknowledgements

The user explicitly opted for the "Educational + template
generator" scope when 3.5 was planned. Deferred items:

- **Live STS verify endpoint** — would require `@aws-sdk/client-sts`
  and a credential rotation surface on our side. Skipped — the CLI
  snippet lets the visitor verify from THEIR side, cleaner trust
  boundary.
- **Bedrock-through-assumed-role invocation** — the full V4 § 4.4
  spec. Skipped for liability / maintenance / cost reasons. The
  permission policy in the template uses `bedrock:InvokeModel`
  against Claude Haiku specifically so a future sub-PR can plug
  in actual invocation without changing the template surface.
- **Audit log + per-visitor cost cap** — only relevant if actual
  invocation lands.
- **System prompt change** — `getLabStatus` already reads from the
  registry, so Lumina knows about the new lab automatically. The
  `purpose` string is short enough to read in her voice
  ("cross-account STS pattern... no credentials shared"). No
  prompt edit needed.

---

## 10. Phase 3 status — COMPLETE under the reframed mission

| Sub-PR | Title                        | Status      | Surface |
|--------|------------------------------|-------------|---------|
| 3.1    | Operator Awareness           | ✅ shipped   | Server tools |
| 3.2    | Lab Invocation               | ✅ shipped   | Server tools |
| 3.3    | Persistent Memory            | ✅ shipped   | Server library |
| 3.3a   | Forget-Me Hotfix             | ✅ shipped   | Client + server route |
| 3.4    | Voice Persistent Button      | ✅ shipped   | Client only |
| 3.5    | Cloud Lab MVP                | ✅ this PR   | New page + client island |

Phase 3 delivered five operator-grade Lumina capabilities + one
new lab surface — all under the strict "operator console
intelligence, NOT AI playground" framing the user established at
phase open.

Net impact on the platform:
- Three new Lumina tools that read live operator state
- Three new Lumina tools that operate the existing /lab sandboxes
- A bounded, redacted, summarized session-memory layer with
  explicit Forget-Me control
- A sticky voice-mode toggle for hands-free output
- A new educational lab surface demonstrating the cross-account
  STS pattern Cloud Waste Hunter ships in production

Zero new top-level dependencies across the entire phase.
All client-bundle invariants intact at every sub-PR step.
Lumina's tarball, CLI's tarball: unchanged sizes.
Cinematic identity preserved end-to-end.

Phase 3 is closed pending merge of the branch. Ready for review.
