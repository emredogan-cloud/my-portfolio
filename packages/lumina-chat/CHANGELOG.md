# Changelog

All notable changes to `@emredogan/lumina-chat` are documented in this file.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and the project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.1.0] — 2026-05-17

First public release. Extracted from [emredogan.com](https://emredogan.com) once the
patterns proved stable in production.

### Added

- `LuminaChat` — orchestrator with the centered-then-corner lifecycle, welcome
  sequence, and the three independent input-unlock paths.
- `LuminaWindow`, `LuminaTrigger`, `LuminaAvatar` — composable parts exported
  alongside the orchestrator for consumers who want to drive the lifecycle
  themselves.
- `transport.apiEndpoint` + `transport.bodyExtras` — bring-your-own backend
  surface. Defaults to `POST /api/chat` with an AI SDK 6 `UIMessage[]` body.
- `theme.brandColor`, `theme.avatarSrc`, `theme.glowIntensity` — re-tint
  surface for the cyan neural-core motif without forking the component.
- `toolLabels` prop — maps AI tool-call names to human-readable inline pills.
- `persistence` — session-scoped conversation persistence with a configurable
  `sessionStorage` key; degrades gracefully when storage is unavailable.
- Per-file ESM emission (`dist/index.js`, `dist/LuminaAvatar.js`,
  `dist/LuminaChat.js`, `dist/LuminaTrigger.js`, `dist/LuminaWindow.js`,
  `dist/types.js`) so bundlers can tree-shake unused parts.
- TypeScript types shipped alongside the runtime (`dist/*.d.ts`).
- `./styles.css` subpath export for the (small) shared base styles.

### Engineering

- Sigstore provenance enabled (`publishConfig.provenance: true`) — the npm
  tarball is signed via OIDC during the GitHub Actions publish workflow,
  linking the published bytes to a specific commit SHA + workflow run.
- React 18 and React 19 supported via `peerDependencies` range.
- Idle CPU at zero: `motion/react` stops the RAF loop once the trigger pulse
  settles into its steady state. No `backdrop-filter` anywhere in the runtime
  path.
- The widget honours `prefers-reduced-motion` — when set, the welcome
  sequence collapses to a single instant render and the trigger's cyan
  breath holds at its mid-opacity frame.

[Unreleased]: https://github.com/emredogan-cloud/my-portfolio/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/emredogan-cloud/my-portfolio/releases/tag/v0.1.0
