# Changelog

All notable changes to `@emredogan/cli` are documented in this file.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and the project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.1.1] — 2026-05-18

The "Engineering Swiss Army Knife" expansion. Four new commands,
two new server endpoints, **zero new dependencies**. The CLI is
now a multi-tool: ask Lumina, list projects, open `/lab`, read
the public engineering changelog, snapshot platform telemetry,
print Emre's contact card, or pipe terminal input straight at a
`/lab` experiment without leaving the shell.

### Added

- `emredogan changelog` — fetch the last five commits from the
  public engineering changelog and print each with its WHY
  paragraph (4-space indent, wrapped at 76 columns). Backed by
  the same 30-minute KV cache as the `/changelog` web page.
- `emredogan telemetry` — print a curated 6-metric snapshot
  as a 3-column ASCII table (METRIC · VALUE · UPDATED). Shows
  Lumina p95 latency, auto-tweet successes, IAM translator
  runs, weekly npm downloads for `@emredogan/lumina-chat` +
  `@emredogan/cli`, and notes audio plays.
- `emredogan hire` — print Emre's contact card as a bordered
  Unicode box. No API call; renders identically offline.
- `emredogan lab <experiment> "<input>"` — POST to a `/lab`
  experiment and stream the reply to stdout. Aliases:
  `iam | iam-translator`, `prompt | prompt-rescuer`,
  `commit | commit-narrator`. Honours the backend's per-IP
  rate limit + per-day cost cap, with deterministic exit codes.

### Changed

- Help text reorganised into three groups — `core` (browse, ask,
  project list, demo), `read` (changelog, telemetry, hire), and
  `build` (lab) — so the eight commands scan as one cohesive
  set rather than a flat row.
- `examples:` block extended with one canonical invocation per
  new command.

### Engineering

- Zero runtime dependencies preserved. All new formatters
  (`formatAgo`, `wrapText`, `padCell`) are hand-rolled in
  `src/format.ts` using pure ECMAScript + native String
  methods.
- ASCII table + business-card borders rendered with U+2500-series
  box-drawing characters as literal Unicode in the source — no
  `boxen`, no `cli-table`, no `chalk`.
- Server endpoints (`/api/cli/changelog`, `/api/cli/telemetry`)
  are edge-runtime, read-only, KV-cached. They reuse the
  existing `getRecentCommits` + `readMetric` primitives — no
  new server logic.
- Tarball stays comfortably under the V4 § 5.2.4 100 KB cap.

## [0.1.0] — 2026-05-18

First public release. A tiny terminal companion for
[emredogan.com](https://emredogan.com) — four commands, zero
dependencies, POSIX-only.

### Added

- `emredogan browse` — opens `https://emredogan.com` in the default
  browser via the platform's native opener (`open` on macOS,
  `xdg-open` on Linux).
- `emredogan ask "<question>"` — streams a reply from Lumina (the
  AI representative on the live site) to stdout. POSTs to the
  public `/api/cli/ask` endpoint, which proxies through Claude
  Haiku 4.5 with the same system prompt used on the website's
  embedded chat.
- `emredogan project list` — prints a tight list of the live
  projects (title, role, blurb, github/live URLs) by fetching
  the public `/api/projects` JSON.
- `emredogan demo <slug>` — opens `/lab/<slug>` in the default
  browser. Known slugs: `iam-translator`, `prompt-rescuer`,
  `commit-narrator`.
- `--help` / `-h` and `--version` / `-V` global flags.
- `EMREDOGAN_API_URL` env var to override the API base (defaults
  to `https://emredogan.com`). Useful for staging or local dev.

### Engineering

- **Zero runtime dependencies.** Hand-rolled argv parsing,
  Node 18+ native `fetch`, native `child_process.spawn` for the
  browser opener. Tarball stays well under the 100 KB target the
  V4 execution plan budgets for `@emredogan/cli`.
- Sigstore provenance enabled (`publishConfig.provenance: true`)
  — the npm tarball is signed via OIDC during the GitHub Actions
  publish workflow, linking each published version to a specific
  commit SHA + workflow run.
- **POSIX-only.** macOS + Linux only for v0.1. Windows support is
  deferred to v0.2 (per V4 § 5.2.4 — `os: ["darwin", "linux"]`
  in `package.json`).

[Unreleased]: https://github.com/emredogan-cloud/my-portfolio/compare/cli-v0.1.1...HEAD
[0.1.1]: https://github.com/emredogan-cloud/my-portfolio/compare/cli-v0.1.0...cli-v0.1.1
[0.1.0]: https://github.com/emredogan-cloud/my-portfolio/releases/tag/cli-v0.1.0
