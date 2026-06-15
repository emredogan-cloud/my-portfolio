# Domain Migration — Codebase Audit & Code Report

**Date:** 2026-06-15
**Branch:** `feat/v4-phase5-experimental-foundation`
**New canonical domain:** `https://emredogan.work`
**Roles:** Next.js Production Architect · Lead Frontend Engineer
**Scope:** SAFE codebase domain audit — repoint the production canonical origin to the
newly-wired custom domain without breaking preview or local environments.

---

## 1. Executive summary

The portfolio resolves its absolute origin through **one** server-side utility,
`lib/site-url.ts → getSiteUrl()`. Every URL-bearing metadata surface in the app reads
from it:

- `metadataBase` (root `app/layout.tsx`)
- every per-page `alternates.canonical`
- every `openGraph.url` / `twitter` card URL
- the JSON-LD `Person.url` (structured data)
- `app/sitemap.ts` (static routes **+** dynamically-generated project / note / codex routes)
- `app/robots.ts` (`Sitemap:` directive)
- the auto-tweet share-link builder (`lib/auto-tweet/handlers/daily-standup.ts`)

Because the origin is centralized, the migration is a **single-point change**:
`getSiteUrl()` now returns `https://emredogan.work` for production deployments, while
**preview** and **local** resolution are preserved exactly as the barricade requires.

> **The portfolio never hardcoded its own domain.** It was already env-driven. There was
> no stale `*.vercel.app` production URL baked into the app source to remove — the
> migration is purely about *pinning the new canonical* and guaranteeing it in committed
> code (since the env files that previously carried it are git-ignored).

**One file changed and committed:** `lib/site-url.ts`.

---

## 2. Files changed

### 2.1 `lib/site-url.ts` — committed (authoritative)

The resolution order was made explicit and the live custom domain was pinned as the
production canonical. New precedence:

| # | Condition | Resolves to | Purpose |
|---|-----------|-------------|---------|
| 1 | `NEXT_PUBLIC_SITE_URL` is set | that value (trailing slash stripped) | Explicit operator override — Vercel dashboard or `.env.local`. **Always wins.** |
| 2 | `VERCEL_ENV === "production"` | **`https://emredogan.work`** | The live custom domain. Hardcoded so production never depends on dashboard state. |
| 3 | `VERCEL_ENV === "preview"` | `https://${VERCEL_URL}` (fallback `VERCEL_PROJECT_PRODUCTION_URL`) | Branch previews stay **self-referential** — OG cards / absolute links resolve within the preview. |
| 4 | otherwise | `http://localhost:3000` | Local `next dev` / `next build` and any non-Vercel environment. |

A new named export, `PRODUCTION_SITE_URL = "https://emredogan.work"`, makes the canonical
origin a single importable constant.

### 2.2 `.env.local.example` — updated locally, **NOT committed** (git-ignored)

A documented `NEXT_PUBLIC_SITE_URL` block was added to the developer template explaining
the override and the default resolution. **This file is excluded from the commit by
design** — `.gitignore` ignores `.env*` ("env files (can opt-in for committing if
needed)"). Force-adding a previously-untracked env file would publish its contents
(including a contact email) to the public repository permanently, so it was intentionally
left untracked. The override is instead documented in **committed code** (the `getSiteUrl`
JSDoc) and in this report.

> **To opt the template into version control later (optional):**
> `git add -f .env.local.example && git commit`

---

## 3. Fallback logic preserved (CRITICAL BARRICADE)

The barricade — *"Do NOT break preview deployments; keep `VERCEL_URL` / localhost
fallback intact"* — is satisfied and **proven** by running the real compiled
`getSiteUrl()` across every environment:

```
1. Production (VERCEL_ENV=production)          → https://emredogan.work
2. Preview   (VERCEL_ENV=preview)              → https://my-portfolio-git-feat-abc.vercel.app
3. Local dev (no Vercel env)                   → http://localhost:3000
4. Explicit override (NEXT_PUBLIC_SITE_URL)    → https://staging.example.com   (slash stripped)
```

- **Preview deployments** → their own per-deployment `VERCEL_URL`. Untouched and working.
- **Local development** → `http://localhost:3000`. Untouched and working.
- The locally-produced `robots.txt` and `sitemap.xml` correctly emit `http://localhost:3000`
  (a local `next build` has no `VERCEL_ENV`), confirming the fallback path is live.

No environment regresses. Production gains a hardcoded guarantee instead of depending on
whatever Vercel reports for the project host.

---

## 4. Deliberately NOT changed (and why)

A full-codebase sweep for absolute URLs surfaced the following. Each was **intentionally
preserved** — changing any of them would break a working link or exceed the SAFE scope:

| Reference | Location | Why it stays |
|-----------|----------|--------------|
| `*.vercel.app` codex deploy URLs (`tuzun-hafizasi`, `mendiran-vakayinamesi`, `mythology-digital-book`, `solgun-kitabe`) | `data/codex.ts` | These are the **separate live deployments of the individual Codex book readers**, not the portfolio's own origin. The Lumina site-map even states the books "run at their own `*.vercel.app` domains." Repointing them would 404 the book readers. |
| `https://waste-hunter.vercel.app` | `app/pro/page.tsx` | External CTA to a different project's live demo. |
| `*.vercel.app` host string | `lib/lumina/site-map.ts` | Descriptive prose telling Lumina the books live on their own vercel domains — an accurate statement, not a portfolio link. |
| `https://emredogan.com` (CLI default API base, package homepage, system-prompt copy, GitHub user-agents) | `packages/emredogan-cli/*`, `lib/lumina/system-prompt.ts`, `lib/github-events.ts` | A separate brand / API-surface domain, **not** the SEO canonical this migration targets. It is referenced by a **published npm package** (`@emredogan/cli`); silently repointing its API base is out of scope and risky. Flagged here for a future, deliberate decision. |
| `*.vercel.app` curl targets | `.claude/settings.local.json` | Local tool-permission entries, not app code. |
| Markdown planning docs (`PORTFOLYO_*`, `PHASE*`, etc.) | repo root | Historical design records; not shipped surfaces. |

> **Follow-up (your call, not done here):** if `emredogan.com` is being fully retired in
> favour of `emredogan.work`, the `@emredogan/cli` default API base
> (`packages/emredogan-cli/src/api-base.ts`) and the Lumina system-prompt copy should be
> updated in a **separate** commit, since that touches a publishable artifact and the
> assistant's knowledge surface.

---

## 5. Validation

| Check | Command | Result |
|-------|---------|--------|
| Types | `npx tsc --noEmit` | ✅ **clean** (exit 0) |
| Lint (changed file) | `npx eslint lib/site-url.ts` | ✅ **clean** (exit 0) |
| Lint (whole repo) | `npx eslint` | ⚠️ 22 errors / 2 warnings — **100% pre-existing baseline**, identical on clean `HEAD` (verified via stash). **Zero** introduced by this change. All in untouched 3D-topology / chat components and the `lumina-chat` package (React-hooks & unescaped-entity rules). Not in scope for an atomic domain migration, and they do not block `next build`. |
| Build | `npm run build` | ✅ **success** — all surfaces prerendered. |
| Runtime behaviour | real `getSiteUrl()` across 4 envs | ✅ see §3 |

**Build confirmation of the named-critical surfaces:**

- `● /codex/[slug]` → `tuzun-hafizasi` (**Book 4**), `mendiran-vakayinamesi`,
  `codex-mythologica`, `solgun-kitabe` — all prerendered.
- `○ /v5/journal` (Journal surface) + `ƒ /v5/journal/[week]` — prerendered / dynamic.
- `○ /changelog`, all `○ /lab/*`, `○ /sitemap.xml`, `○ /robots.txt` — prerendered.

> **On the whole-repo lint failures:** they exist verbatim on the pre-change tree
> (22 errors / 2 warnings on `HEAD`, confirmed by stashing the change and re-linting).
> This migration neither adds nor fixes them; fixing unrelated component tech-debt inside
> a domain-migration commit would violate atomicity and the SAFE mandate.

---

## 6. Production follow-up (operational, outside this commit)

1. **Verify the Vercel env.** Because `NEXT_PUBLIC_SITE_URL` is precedence #1, if it is
   currently set in the Vercel **Production** scope to an old value (e.g. a `*.vercel.app`
   host), it will **override** the new hardcoded canonical. Either update it to
   `https://emredogan.work` or remove it to let the code default take over. No code change
   is required for the canonical to work — the build guarantees it.
2. **Redeploy production** so the new `metadataBase`, sitemap, robots, and JSON-LD bake in
   `https://emredogan.work`.
3. **Re-submit `https://emredogan.work/sitemap.xml`** in Google Search Console and verify
   `https://emredogan.work/robots.txt` resolves with the correct `Sitemap:` line.

---

## 7. Change inventory

```
Committed:
  lib/site-url.ts                  (+41 / -12)  — canonical resolution; emredogan.work pinned for prod
  DOMAIN_MIGRATION_CODE_REPORT.md  (new)        — this report

Local-only (git-ignored .env*, not committed):
  .env.local.example               — documents the NEXT_PUBLIC_SITE_URL override
```
