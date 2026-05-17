# Changelog

All notable changes to `@emredogan/cli` are documented in this file.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and the project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

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

[Unreleased]: https://github.com/emredogan-cloud/my-portfolio/compare/cli-v0.1.0...HEAD
[0.1.0]: https://github.com/emredogan-cloud/my-portfolio/releases/tag/cli-v0.1.0
