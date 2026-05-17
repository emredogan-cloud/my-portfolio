<div align="center">

<pre>
   ███████╗██████╗ 
   ██╔════╝██╔══██╗
   █████╗  ██║  ██║   ·   emredogan.com
   ██╔══╝  ██║  ██║       cloud & SaaS engineer
   ███████╗██████╔╝       AWS · AI-native · monk mode
   ╚══════╝╚═════╝
</pre>

# Emre Doğan — Portfolio

**Cinematic, AI-native portfolio for a cloud & SaaS engineer.**
Next.js 16 App Router · React 19 · Tailwind v4 · Anthropic Claude · Resend.

<sub>Engineered for hydration safety, 60fps motion, and graceful degradation when third-party services aren't configured.</sub>

<br />

[![Next.js](https://img.shields.io/badge/Next.js-16-000000?logo=nextdotjs&logoColor=white)](https://nextjs.org)
[![React](https://img.shields.io/badge/React-19-149ECA?logo=react&logoColor=white)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-Strict-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Tailwind](https://img.shields.io/badge/Tailwind-v4-38BDF8?logo=tailwindcss&logoColor=white)](https://tailwindcss.com)
[![Anthropic](https://img.shields.io/badge/Claude-Haiku%204.5-D97757)](https://www.anthropic.com)
[![Sentry](https://img.shields.io/badge/Sentry-instrumented-362D59?logo=sentry&logoColor=white)](https://sentry.io)
[![Sponsor](https://img.shields.io/github/sponsors/emredogan-cloud?label=sponsor&logo=githubsponsors&color=ea4aaa)](https://github.com/sponsors/emredogan-cloud)
[![License](https://img.shields.io/badge/License-MIT-black.svg)](#license)

</div>

---

## Overview

This repository powers [**emredogan.dev**](https://github.com/emredogan-cloud/my-portfolio) — a production portfolio that doubles as a working showcase of the engineering surface I sell to clients: **AWS-native cloud architecture, AI-native SaaS, and cross-platform mobile development.**

It's not a marketing site. It's a small but complete product:

- A cinematic opening sequence with reduced-motion fallback and session-scoped replay control.
- **Lumina**, an embedded AI representative streaming responses from Claude Haiku 4.5 via the Vercel AI SDK v6.
- A type-safe contact pipeline using React 19 Server Actions and Resend, with honeypot anti-spam and graceful 503 behaviour when keys are missing.
- A handcrafted motion system built on `motion/react`, with scroll-linked reveals, glassmorphism primitives, and a deferred film-grain overlay tuned to not compete with first paint.

The whole experience is rendered through the Next.js App Router with React Server Components by default — `"use client"` is only introduced where interactivity demands it.

## Features

| Surface | What it does | How it's built |
|---|---|---|
| **Cinematic intro** | First-visit opening sequence; respects `prefers-reduced-motion`; gated by `sessionStorage` so it never replays in a tab. | `components/cinematic/OpeningSequence.tsx` |
| **Hero + Terminal showcase** | Identity reveal with staggered text, live "available" indicator, and an in-browser terminal vignette. | `components/sections/HeroSection.tsx`, `components/home/TerminalShowcase.tsx` |
| **Lumina chat (AI rep)** | Auto-opens centered after `T=3500ms`, snaps to bottom-right after first close, streams tokens from Claude Haiku 4.5. | `components/chat/*`, `app/api/chat/route.ts`, `lib/lumina/system-prompt.ts` |
| **Projects** | Statically generated case-study pages from a typed dataset, with dynamic `[slug]` routes and animated galleries. | `app/projects/`, `data/projects.ts` |
| **Stack page** | Categorised inventory of cloud, application, backend, and AI tooling — the same vocabulary used in client proposals. | `app/stack/` |
| **Contact pipeline** | Server-action form → validated → Resend transactional email → optimistic state with `useActionState`. | `app/contact/actions.ts`, `app/contact/ContactForm.tsx` |
| **Global grain + glass** | Deferred film-grain overlay (`3500ms` cold delay) and reusable glassmorphism utility classes. | `components/layout/GlobalGrain.tsx`, `app/globals.css` |
| **[`/telemetry`](https://emredogan.com/telemetry)** | Public observability — Lumina p95 latency, auto-tweet successes, lumina-chat downloads, MRR — read from KV at request time, ISR-cached for 5 min. | `app/telemetry/page.tsx`, `app/api/telemetry/[metric]/route.ts`, `lib/telemetry/metrics.ts` |
| **[`/changelog`](https://emredogan.com/changelog)** | Every push to `emredogan-cloud` rendered as a WHY-annotated card. Day-bucketed, repo-filterable, 30-min KV cache over GitHub's public events API. | `app/changelog/page.tsx`, `lib/github-events.ts` |
| **Auto-tweet 2.0** | Four-format Twitter engine: daily standup (cron), weekly architecture (Tuesday cron), incident response (Sentry-driven drafts), Lumina best-answer clips. 14-day dedupe ledger in KV. | `app/api/auto-tweet/route.ts` (dispatcher), `lib/auto-tweet/{handlers,prompts,modes,dedupe}` |
| **Sentry instrumentation** | Server + edge runtime error capture; lazy load, no client bundle impact. Drives the auto-tweet `incident_response` mode when wired via webhook. | `instrumentation.ts`, `sentry.{server,edge}.config.ts`, `lib/sentry.ts` |

## Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                    Browser (React 19 + motion/react)                 │
│  Cinematic intro · Hero · Lumina trigger · Bento grid · Contact UI   │
└───────────────┬─────────────────────────────────────────┬───────────┘
                │                                         │
       Streaming HTTP/2                          React 19 Server Action
                │                                         │
┌───────────────▼─────────────┐         ┌────────────────▼────────────┐
│  /api/chat (Route Handler)  │         │ sendContactEmail (server)   │
│  Vercel AI SDK v6           │         │ Honeypot + length + regex   │
│  ↳ streamText()             │         │ HTML-escape user content    │
└───────────────┬─────────────┘         └────────────────┬────────────┘
                │                                         │
        @ai-sdk/anthropic                          Resend transactional
                │                                         │
        ┌───────▼────────┐                       ┌────────▼────────┐
        │ Anthropic API  │                       │     Resend      │
        │ Claude Haiku   │                       │  (email egress) │
        │   4.5 (pinned) │                       └─────────────────┘
        └────────────────┘
```

Notable design decisions:

- **RSC-first.** Server Components are the default; client islands are introduced only at interaction boundaries (`HeroSection`, `BentoSection`, `LuminaChat`, `ContactForm`). This keeps shipped JS lean.
- **Hydration-safe motion.** `suppressHydrationWarning` is applied at `<html>` and `<body>` to tolerate Dark Reader and browser extensions; all client effects guard against `sessionStorage` failures (private mode, restrictive policies).
- **Pinned model snapshots.** `claude-haiku-4-5-20251001` rather than a floating alias — production-stable behaviour, predictable cost surface.
- **No console-clicked state.** Configuration lives in env files; everything else is in code and version control.

## Open source

This repository ships one extracted open-source package alongside the portfolio app:

### [`@emredogan/lumina-chat`](packages/lumina-chat/) — drop-in cinematic AI chat widget

[![npm](https://img.shields.io/npm/v/@emredogan/lumina-chat.svg?style=flat-square&color=00d2ff&label=npm)](https://www.npmjs.com/package/@emredogan/lumina-chat)
[![downloads](https://img.shields.io/npm/dw/@emredogan/lumina-chat.svg?style=flat-square&color=00d2ff)](https://www.npmjs.com/package/@emredogan/lumina-chat)
[![types](https://img.shields.io/npm/types/@emredogan/lumina-chat.svg?style=flat-square&color=00d2ff)](https://www.npmjs.com/package/@emredogan/lumina-chat)
[![bundle](https://img.shields.io/bundlephobia/minzip/@emredogan/lumina-chat.svg?style=flat-square&color=00d2ff&label=bundle)](https://bundlephobia.com/package/@emredogan/lumina-chat)

The same Lumina widget that ships on the live site, extracted as a reusable React package. Neural-core avatar, smooth motion, tool-use rendering, voice-ready. Bring your own `/api/chat` endpoint.

```bash
npm install @emredogan/lumina-chat
```

Published with [sigstore provenance](https://docs.npmjs.com/generating-provenance-statements) — every released tarball is linked via OIDC attestation to the exact GitHub workflow run that built it.

See [`packages/lumina-chat/README.md`](packages/lumina-chat/README.md) for the full prop surface, server contract, and customization examples.

## Tech Stack

**Application** — Next.js 16 (App Router) · React 19 · TypeScript strict · Tailwind v4 (PostCSS) · `motion/react` (formerly Framer Motion) · `lucide-react`

**AI** — Vercel AI SDK v6 (`ai`, `@ai-sdk/anthropic`, `@ai-sdk/react`) · Anthropic Claude Haiku 4.5

**Email** — Resend (transactional)

**Tooling** — ESLint 9 (`eslint-config-next` core-web-vitals + TS) · Geist Sans via `next/font/google`

**Runtime targets** — Vercel (frontend) · Node 20+ recommended

## Folder Structure

```
my-portfolio/
├─ app/                       # App Router — RSC by default
│  ├─ api/chat/route.ts       # Lumina streaming endpoint (Anthropic)
│  ├─ about/                  # Manifesto, principles, specializations
│  ├─ projects/               # List + dynamic [slug] case studies
│  ├─ stack/                  # Categorised tooling inventory
│  ├─ contact/                # Server action + form
│  ├─ layout.tsx              # Geist, grain, opening sequence, Lumina
│  ├─ page.tsx                # Hero · Metrics · About · Bento grid
│  └─ globals.css             # Tailwind v4 entry + design tokens
│
├─ components/
│  ├─ cinematic/              # Opening sequence, ambient layers, particles
│  ├─ chat/                   # Lumina orchestrator, window, trigger, avatar
│  ├─ home/                   # TerminalShowcase
│  ├─ layout/                 # Navbar, Footer, GlobalGrain
│  ├─ sections/               # Hero, Metrics, About, Bento, Projects
│  └─ ui/                     # Reveal, WordsPullUp(MultiStyle)
│
├─ data/
│  └─ projects.ts             # Typed project dataset (single source of truth)
│
├─ lib/
│  └─ lumina/system-prompt.ts # AI representative identity contract
│
├─ public/
│  ├─ projects/               # Case-study imagery
│  ├─ videos/                 # Hero cinematic loops
│  └─ emre-dogan-resume.pdf
│
├─ next.config.ts             # Reserved for production tuning
├─ eslint.config.mjs          # Next core-web-vitals + TS rules
├─ postcss.config.mjs         # Tailwind v4 plugin
└─ tsconfig.json              # strict; paths: "@/*" → "./*"
```

## Local Development

```bash
# 1. Install
npm install

# 2. Configure environment
cp .env.local.example .env.local
# Add ANTHROPIC_API_KEY and RESEND_API_KEY (both optional — see below)

# 3. Run
npm run dev          # http://localhost:3000
npm run build        # Production build
npm run start        # Serve the production build
npm run lint         # ESLint (core-web-vitals + TS)
```

Requires **Node.js 20+** (Next.js 16 requirement).

### Environment Variables

| Variable | Required | Purpose | Failure mode |
|---|---|---|---|
| `ANTHROPIC_API_KEY` | Optional | Powers Lumina chat via Claude Haiku 4.5. | `/api/chat` returns `503` with a clear message; UI surfaces a graceful error. |
| `RESEND_API_KEY` | Optional | Sends contact-form submissions as transactional email. | Form returns a typed error and directs the visitor to email directly. |
| `CONTACT_EMAIL` | Optional | Override the destination for contact-form messages. Defaults to `emre30283@gmail.com`. | Falls back to the default. |

The app is designed to **boot cleanly without any of these** — missing keys degrade specific features, never the page.

## Build & Deployment

The project is optimised for Vercel:

1. Push to the linked GitHub repository.
2. Configure environment variables in **Vercel → Project Settings → Environment Variables**.
3. Vercel auto-deploys `main`; preview deployments are created for every PR.

No serverless function configuration is required — `app/api/chat/route.ts` exports `maxDuration = 30` to handle longer streaming windows. Server Actions in `app/contact/actions.ts` run as Node functions automatically.

For self-hosting:

```bash
npm run build
npm run start         # Defaults to port 3000
```

## API Integrations

| Service | Used for | Surface area |
|---|---|---|
| **Anthropic Claude** (Haiku 4.5) | Lumina AI representative | `app/api/chat/route.ts` via `@ai-sdk/anthropic` + `streamText` |
| **Resend** | Transactional email for contact form | `app/contact/actions.ts` |

Both integrations are isolated behind environment variables and degrade gracefully when unconfigured.

## Security Considerations

- **Input validation** on contact submissions: length bounds, RFC-pragmatic email regex, message-length floor and ceiling.
- **HTML-escape** all user-supplied content before rendering into the outbound email (`escapeHtml` helper) — defence-in-depth even though Resend transports plain text and HTML separately.
- **Honeypot** field (`company`) silently absorbs bot submissions and returns success without invoking the email provider.
- **No secrets in source.** Both `ANTHROPIC_API_KEY` and `RESEND_API_KEY` are server-only; the `/api/chat` route gates on their presence before issuing model calls.
- **Strict TypeScript** across the codebase reduces a wide class of runtime defects.
- **`suppressHydrationWarning`** is scoped to `<html>` and `<body>` only — used deliberately for browser-extension compatibility (Dark Reader, etc.), not for hiding bugs.

## Performance Optimizations

- **RSC-first architecture** — `"use client"` is opted into per-component, not blanket-applied. Most route segments ship zero client JS for static content.
- **Deferred grain overlay** — the cinematic `feTurbulence` SVG paints `3500ms` after mount so it never competes with first paint.
- **GPU-friendly motion** — animations are transform/opacity-driven; the dim overlay behind Lumina is a flat colour (no `backdrop-filter`) to keep frame time predictable on lower-end devices.
- **`next/image` everywhere** — project cards use responsive `sizes` and `object-cover` for cinematic crops without layout thrash.
- **`next/font/google` Geist** — preloaded, swap-strategy display, CLS-stable.
- **Pinned animation easing** (`cubic-bezier(0.22, 1, 0.36, 1)`) ensures consistent perceptual weight across components.

## CI/CD

| Workflow | Trigger | What it does |
|---|---|---|
| **`.github/workflows/publish-lumina-chat.yml`** | Manual dispatch (`workflow_dispatch`) | Types-version-confirmed publish of `@emredogan/lumina-chat` to npm. Runs `npm ci`, builds the workspace, dry-run inspects the tarball, then `npm publish --provenance --access=public` so each release carries a sigstore attestation linking it to the GitHub workflow run + commit SHA. |
| **Vercel deploys** | Every `git push` | Preview deployments for every PR, production deploy on `main`. ESLint + TypeScript run locally before merge. |

Recommended next step: a PR-gated GitHub Actions workflow running `npm run lint && npm run build` so CI catches regressions before they reach a Vercel preview.

## Roadmap

- [ ] Wire ESLint + `next build` into a GitHub Actions workflow for PR-gated CI.
- [ ] Add rate-limiting middleware to `/api/chat` (Upstash Redis, sliding window).
- [ ] Persist Lumina conversations with thread-aware memory.
- [ ] Project-aware retrieval for Lumina (embed `data/projects.ts` + page metadata).
- [ ] OG image generation for `/projects/[slug]` via `next/og`.
- [ ] Lighthouse CI budget on the production deployment.

## Contributing

This repository is primarily a personal portfolio, but well-scoped issues and PRs that improve accessibility, performance, or code quality are welcome.

```bash
git checkout -b feat/your-change
npm run lint
git commit -m "feat: short imperative summary"
```

Please open an issue first for substantive changes so we can align on scope.

## Sponsor

If `@emredogan/lumina-chat`, the systems behind this portfolio, or the open engineering log at [`/changelog`](https://emredogan.com/changelog) save you time — sponsorship keeps the loop running.

[![Sponsor on GitHub](https://img.shields.io/github/sponsors/emredogan-cloud?style=for-the-badge&label=sponsor&logo=githubsponsors&color=ea4aaa)](https://github.com/sponsors/emredogan-cloud)

Sponsors get early access to packages-in-flight (`@emredogan/cinematic-ui`, `@emredogan/monk-mode-cli`) and direct line to the changelog upstream of public push events.

## License

Released under the **MIT License**. See [`LICENSE`](LICENSE) if present, or treat this section as the grant.

The Lumina system prompt, project case studies, copywriting, and brand identity (`Emre Doğan`, `Lumina`) are excluded from the MIT grant and reserved.

---

<div align="center">

**Built by [Emre Doğan](https://github.com/emredogan-cloud)** — Cloud Architect · SaaS Engineer · Mobile Developer.
Reach out at <a href="mailto:emre30283@gmail.com">emre30283@gmail.com</a> or via the contact form on the live site.

</div>
