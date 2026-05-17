# SUB-PR 1.1 REPORT — `@emredogan/lumina-chat` publish preparation

> **Phase:** V4 Phase 1 — OSS Launch & Distribution Foundation
> **Sub-PR:** 1.1 of 5 (1.1 → 1.2 → 1.3 → 1.4 → 1.5)
> **Branch:** `feat/v4-phase1-oss-launch` (branched from `origin/main` per V4 doc § 6.1.A.7-8)
> **Mode:** Disciplined sub-PR execution. Sub-PR 1.2 deliberately not started.
> **Date:** 2026-05-17

---

## 1. Mission

Prepare `@emredogan/lumina-chat` for its first public npm publish. Bring the
package into compliance with V4 Section 2.1 (OSS Publishing Disiplini) and
the success criteria in V4 Section 4.1, without triggering the actual publish
(which is a human-gated workflow action — see §6 of this report).

---

## 2. Pre-scan summary (V4 § 6.1.A)

**Constitution re-read:** PORTFOLYO_V4_EXECUTION_SYSTEM.md sections 1, 2,
4.1, 5.1, 6.1, 9, 10. PORTFOLYO_V4_FUTURE_SYSTEMS.md section 4 (Global
Distribution Systems).

**Baseline confirm (V4 § 6.1.A.4):**

| Check | Result |
|---|---|
| `git status` clean tree | ✓ (after starting new branch) |
| `npx tsc --noEmit` | ✓ clean |
| `npm run build` | ✓ green, all routes prerendered |
| `ls packages/lumina-chat/dist/` | ✓ 25 artifact files present |
| `ls .github/workflows/publish-lumina-chat.yml` | ✓ present |

**Reference file scan (V4 § 6.1.A.5):**

| File | One-line takeaway |
|---|---|
| `packages/lumina-chat/package.json` | Version 0.1.0; `publishConfig.provenance: true`; `exports`/`sideEffects`/`peerDeps`/`files` all wired |
| `packages/lumina-chat/README.md` | 218 lines — matches V4 § 2.1 README pattern (hero, badges, install, quick start, props table, composition, server contract, browser support, performance, roadmap, license) |
| `.github/workflows/publish-lumina-chat.yml` | Manual dispatch with typed-version gate, `id-token: write` for OIDC, `npm pack --dry-run` step before publish, `--provenance --access=public` on `npm publish` |
| `app/api/auto-tweet/route.ts` | Existing V3 cron path (Sub-PR 1.3 will refactor; **not touched here**) |
| `app/api/cwh/live-metrics/route.ts` | KV metric read/write pattern reference (Sub-PR 1.2 will reuse; **not touched here**) |
| `lib/lumina/memory.ts` | KV key prefix pattern + graceful no-op when KV not provisioned |
| `vercel.json` | Single cron `/api/auto-tweet @ 0 6 * * *` |

**Vercel env / GitHub secrets (V4 § 6.1.A.6):** out-of-band — see §6.

---

## 3. Gaps identified vs V4 § 2.1 OSS Publishing Disiplini

| Requirement (§ 2.1) | State on entry | Action in 1.1 |
|---|---|---|
| README pattern (hero/badges/install/.../license) | ✓ already compliant | none |
| Sigstore provenance enabled | ✓ `publishConfig.provenance: true` + workflow `--provenance` | none |
| GitHub Actions publish workflow w/ typed-version gate | ✓ already present | none |
| SemVer bumping discipline | N/A first publish | none |
| **CHANGELOG.md per release** | ✗ **missing** | **added `packages/lumina-chat/CHANGELOG.md`** |
| Tarball file list dry-run-verified | confirmed clean: 28 files / 22.7 kB | re-verified after fix: 29 files / 23.7 kB |
| Per-file ESM emission | ✓ `dist/index.js`, `dist/LuminaAvatar.js`, etc. | none |
| Peer dependencies explicit | ✓ `react`, `react-dom` >=18 | none |
| **Distribution-first** (Twitter/LinkedIn/blog ready before publish day) | content not drafted | **flagged for human — out of dev scope** |

---

## 4. What was implemented

### 4.1 `packages/lumina-chat/CHANGELOG.md` (new file, 2.4 kB)

Keep-a-Changelog 1.1.0 format. Documents the 0.1.0 surface:

- All public exports (`LuminaChat`, `LuminaWindow`, `LuminaTrigger`,
  `LuminaAvatar`)
- All prop surfaces (`transport.apiEndpoint`, `transport.bodyExtras`,
  `theme.brandColor`, `theme.avatarSrc`, `theme.glowIntensity`,
  `toolLabels`, `persistence.*`)
- Engineering claims that V4 § 2.1 requires public attestation for:
  per-file ESM emission, React 18+19 peer support, sigstore provenance,
  idle-CPU-zero, `prefers-reduced-motion` honoured

The `[Unreleased]` and `[0.1.0]` comparison links point at the
repository tag `v0.1.0` — that tag does not exist yet; it will be
auto-created when the GitHub release for the publish is cut, or can
be created manually by the maintainer.

### 4.2 `packages/lumina-chat/package.json` (modified — 1 line)

`files` array extended: `["dist", "README.md", "LICENSE"]` → `["dist",
"README.md", "LICENSE", "CHANGELOG.md"]` so the changelog ships in the
published tarball.

Verified with `npm pack --dry-run`:
- Before: 28 files, 22.7 kB tarball, 73.1 kB unpacked
- After: 29 files, 23.7 kB tarball, 75.6 kB unpacked
- CHANGELOG line: `npm notice 2.4kB CHANGELOG.md`

Both sizes well under V4 § 2.7 hard limit (`lumina-chat npm package
gzipped < 35 KB`).

### 4.3 `README.md` (portfolio root, +20 lines)

Added an "Open source" section placed between **Architecture** and
**Tech Stack**. Contains:

- Section heading and one-sentence framing
- Four shields.io badges for `@emredogan/lumina-chat`:
  - `npm` version
  - `npm dw` weekly downloads
  - `npm types`
  - `bundlephobia minzip`
  All tinted with the brand `#00d2ff` cyan to match the package README.
- One-line install snippet
- Provenance attestation note linking npm's docs
- Cross-link to `packages/lumina-chat/README.md` for the full prop surface

Per V4 § 6.1.B step 9. Badges will 404 until the human dispatches the
publish workflow; shields.io renders "invalid" placeholders in that
state — acceptable trade-off for landing the section once and avoiding
a chase-the-publish second commit.

---

## 5. What was deliberately NOT touched

Per the user directive ("DO NOT: start Sub-PR 1.2 · touch telemetry
systems · touch changelog systems · touch auto-content systems · touch
sponsors systems · implement adjacent ideas · silently expand scope"):

- `app/api/auto-tweet/route.ts` — Sub-PR 1.3 territory
- `app/telemetry/page.tsx` (does not exist yet) — Sub-PR 1.2
- `app/changelog/page.tsx` (does not exist yet) — Sub-PR 1.4
- `vercel.json` cron list — Sub-PR 1.3 will add new schedules
- `lib/sentry.ts` / `@sentry/nextjs` dep — Sub-PR 1.5
- GitHub Sponsors metadata — Sub-PR 1.5
- The publish workflow YAML — already compliant; modifying it would
  be scope creep
- The portfolio CI/CD section claim ("No GitHub Actions workflows are
  currently configured") — technically stale now that the publish
  workflow exists, but rewording it is unrelated to Sub-PR 1.1's
  publish-prep objective. Flag for Sub-PR 1.5 README polish.

**Anti-pattern checks (V4 § 9):**

- ❌ No new npm dependency added (1 unnecessary dep = bundle bloat)
- ❌ No design refactor of the package
- ❌ No "while we're here" tile/section additions
- ❌ No identity drift (brand color stays `#00d2ff`)
- ❌ Cool Demo Syndrome filter — passed: every change traces to a
  doc-mandated requirement

---

## 6. Human-gated steps for completing Sub-PR 1.1

The following are NOT in this commit because they require credentials
or external services I cannot access:

| Step | What | Where |
|---|---|---|
| H1 | Confirm `NPM_TOKEN` secret exists in the repo | github.com/emredogan-cloud/my-portfolio/settings/secrets/actions |
| H2 | Verify the npm scope `@emredogan` exists on npm and the token has publish permission | npmjs.com/settings/<user>/tokens |
| H3 | Trigger the **Publish @emredogan/lumina-chat** workflow with `confirm_version=0.1.0`, `tag=latest` | github.com/.../actions/workflows/publish-lumina-chat.yml |
| H4 | Wait for the workflow to complete; inspect the "Inspect package contents (dry-run)" step matches the local 29 files / 23.7 kB tarball | Workflow run summary |
| H5 | `npm view @emredogan/lumina-chat` → expect `0.1.0` and a `published` row from this minute | local shell |
| H6 | Fresh-project install test (V4 § 6.1.B.8): `mkdir /tmp/lumina-test && cd /tmp/lumina-test && npm init -y && npm install @emredogan/lumina-chat` | local shell |
| H7 | Confirm the provenance badge renders on the npm package page | npmjs.com/package/@emredogan/lumina-chat |
| H8 | (Distribution-first, V4 § 2.1 footer) Twitter post + LinkedIn post + short blog draft prepared before the workflow runs | external |

Until H3 fires, the `@emredogan/lumina-chat` badges in the root README
will render as shields.io "invalid" placeholders — that's expected.

---

## 7. Validation report (V4 § C)

### 7.1 Build & types

- ✅ `npx tsc --noEmit` clean (no errors, no warnings)
- ✅ `npm run build` green; all routes prerendered as before — no
  edge-runtime spillover; no new dynamic chunks; `/about`, `/`, `/codex`,
  `/notes`, `/projects`, `/stack` all still `○ (Static)`
- ✅ `npm run --workspace=@emredogan/lumina-chat clean && build` reproduces
  the 29-file / 23.7 kB tarball deterministically — the workflow will
  see the same artifact

### 7.2 Lint

- ⚠️ 24 pre-existing errors + 4 warnings in `packages/lumina-chat/src/LuminaWindow.tsx`
  (`react-hooks/set-state-in-effect`, `react-hooks/refs`)
- These were present **before** this Sub-PR (confirmed against
  baseline `main`)
- **Not blocking** the npm publish workflow — the workflow doesn't
  invoke `npm run lint`; it only runs `build` and `pack --dry-run`
- Deferred — fixing these requires React 19 effect-architecture changes
  that are unrelated to publish preparation. Candidate work for a future
  hardening sub-PR (probably Sub-PR 1.5 — README polish + repo hygiene)

### 7.3 Bundle / performance

| Budget (V4 § 2.7) | Hedef / Hard Limit | Actual |
|---|---|---|
| `lumina-chat` npm package gzipped | < 20 KB / < 35 KB | 23.7 kB tarball (gzipped) — ~10 KB JS-only per README |
| Portfolio root bundle delta | should be ~0 | no portfolio runtime touched; README + new docs only |

### 7.4 Hydration / motion / accessibility / mobile

Not applicable — Sub-PR 1.1 touches no runtime code paths on the
portfolio site. No client component changes. No DOM changes. No
animations added. The `prefers-reduced-motion` honour inside the
package is unchanged.

### 7.5 Cinematic identity (V4 § 13.5)

- ✅ Cyan `#00d2ff` only — all four new badges use the brand color
- ✅ Geist sans only (README is markdown — renders in GitHub's default
  font, unaffected)
- ✅ Black background invariant (no UI surface added)
- ✅ Lumina avatar / DNA / tool-render contracts untouched
- ✅ Footer / BuildBeacon / LiveCustomerCounter untouched

---

## 8. Telemetry plan (V4 § 2.13)

Per V4 § 5.1 Sub-PR 1.1, the telemetry contract for this system is:

- **Metric key:** `v4:adoption:lumina-chat-npm:downloads`
- **Source:** npm API (`https://api.npmjs.org/downloads/point/last-week/@emredogan/lumina-chat`)
- **Polled:** hourly (TBD in Sub-PR 1.2 when the telemetry surface
  goes live)
- **Sunset criterion (V4 § 10.1):** < 50 weekly downloads for 6
  consecutive months + a second `@emredogan/*` package launched
  → `npm deprecate @emredogan/lumina-chat@<version> "Replaced by <pkg>"`

This metric won't be _wired_ until Sub-PR 1.2 (`/telemetry` v1
dashboard) — the contract is documented here so 1.2 can attach to it
cleanly.

---

## 9. Rollback plan

### Pre-publish (this commit)

- `git revert <commit-sha>` on `feat/v4-phase1-oss-launch` — no published
  artifact yet, fully reversible.

### Post-publish (after H3)

- npm publish is **irreversible** within 72 hours, then locked forever.
- Soft rollback: `npm deprecate @emredogan/lumina-chat@0.1.0 "Critical
  bug — use 0.1.1"` followed by a 0.1.1 patch publish (V4 § 5.1 line
  1371).
- Hard removal is not available within npm's policy; the deprecate
  warning is the de facto rollback signal.

This Phase 1 contract specifies "ilk version production-stable olarak
ship edilir" (V4 § 4.1 line 841) — the package has been on the
live portfolio site for months, so it _is_ production-stable. Risk
of needing a same-day 0.1.1 is low.

---

## 10. Risks identified

| Risk | Probability | Severity | Mitigation |
|---|---|---|---|
| First publish workflow failure (auth, scope) | Low | Medium | Workflow includes dry-run inspection step — failures surface before publish. Re-run with corrected secret. |
| Tarball drift between local and CI | Very low | Low | Lock-file-cached `npm ci` + the same `lumina-chat:build` script — workflow log will print the same 29-file / 23.7 kB summary as local. |
| Provenance attestation not surfacing on npm page | Low | Low | `--provenance` flag and `id-token: write` permission both in workflow. If npm UI lags, check `npm view ... --json` for `attestation` block. |
| `@emredogan` scope not yet claimed on npm | Medium (if first publish) | Blocking | Human verifies in H2. If scope unclaimed, first publish creates it. |
| Pre-existing lint errors in LuminaWindow.tsx | Background | N/A here | Not blocking publish. Deferred to a future hardening sub-PR. |
| Badge URLs in root README render "invalid" until H3 | Certain | Cosmetic | Acceptable for ~minutes between commit and workflow run. |

---

## 11. Founder energy impact (V4 § 1.3)

- **Dev time this sub-PR:** ~1 hour (pre-scan + audit + CHANGELOG + README + report)
- **Total Phase 1 budget per V4 § 4.1 maintenance:** 30 hours/month
  across all five sub-PRs and YouTube
- **Remaining for Sub-PR 1.2 (telemetry) + 1.3 (auto-tweet) + 1.4 (changelog) + 1.5 (sponsors+Sentry):** healthy

No burnout signal. Within the 22-hour weekly bütçe (V4 § 2.6).

---

## 12. Next recommended sub-PR

**SUB-PR 1.2 — `/telemetry` v1 Public Dashboard** (V4 § 5.1.2,
§ 6.1.B.SUB-PR 1.2, est. 3-4 days dev).

Scope (for reference only — do not start until human approval of 1.1):

- KV schema: `v4:telemetry:lumina:p95_latency:hourly`, `v4:cost:bedrock:daily:USD`, `v4:adoption:autotweet:success:30d`, `v4:adoption:lumina-chat-npm:weekly`, `v4:monetization:mrr:current` (placeholder)
- `lib/telemetry/metrics.ts` — `recordMetric()` / `readMetric()` helpers
- `app/api/telemetry/[metric]/route.ts` — edge runtime, 5-minute KV cache, whitelist
- `app/telemetry/page.tsx` — Server Component, parallel-fetch grid
- Wire `app/api/auto-tweet/route.ts` + `app/api/chat/route.ts` to record metrics

Sub-PR 1.2 _depends on_ Sub-PR 1.1's `v4:adoption:lumina-chat-npm:downloads`
metric contract — but only the contract, not the actual published package.
1.2 can be implemented before 1.1's human steps complete; the metric will
read `null` until npm has download data.

---

## 13. STOP

Per the operating constitution: this sub-PR is **complete from the
agent's side**. Human review and approval required before Sub-PR 1.2
begins.

Awaiting: H1–H8 (§6) + human review of this report.

— end Sub-PR 1.1 —
