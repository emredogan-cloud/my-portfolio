# `@emredogan/cli`

> A tiny terminal companion for [emredogan.com](https://emredogan.com). Browse the portfolio, ask Lumina questions from the shell, list projects, open a `/lab` experiment.

[![npm](https://img.shields.io/npm/v/@emredogan/cli.svg?style=flat-square&color=00d2ff)](https://www.npmjs.com/package/@emredogan/cli)
[![license](https://img.shields.io/npm/l/@emredogan/cli.svg?style=flat-square&color=00d2ff)](./LICENSE)
[![size](https://img.shields.io/bundlephobia/min/@emredogan/cli.svg?style=flat-square&color=00d2ff&label=size)](https://bundlephobia.com/package/@emredogan/cli)

```bash
npx emredogan ask "How do you handle reduced motion?"
```

Four commands, zero dependencies, POSIX-only. The whole CLI ships as one tiny `dist/cli.js` with a shebang. Native Node `fetch`, native `child_process` — no `commander`, no `axios`, no `chalk`.

---

## Install

Run on demand with `npx`:

```bash
npx emredogan <command>
```

Or install globally:

```bash
npm install -g @emredogan/cli
emredogan <command>
```

Requires **Node.js 20+**. macOS and Linux only for v0.1; Windows support is deferred to v0.2.

---

## Commands

### `emredogan browse`

Opens [`https://emredogan.com`](https://emredogan.com) in the platform default browser via `open` (macOS) or `xdg-open` (Linux).

```bash
emredogan browse
```

### `emredogan ask "<question>"`

Streams a reply from Lumina to stdout. Same model + system prompt as the chat widget on the live site (Claude Haiku 4.5). Per-IP rate limited.

```bash
emredogan ask "What does the CWH cron actually do at 06:00 UTC?"
emredogan ask "How is /telemetry cached?"
```

### `emredogan project list`

Prints a tight list of the live projects: title, role, blurb, GitHub and live URLs. Pulled from the public `/api/projects` JSON.

```bash
emredogan project list
```

### `emredogan demo <slug>`

Opens `/lab/<slug>` in the default browser. Useful when chasing a link from a tweet or a notes page.

```bash
emredogan demo iam-translator
emredogan demo prompt-rescuer
emredogan demo commit-narrator
```

Known slugs are the active `/lab` experiments. Unknown slugs still open the URL — the lab index page handles 404s for retired experiments.

---

## Global flags

| Flag | What it does |
|---|---|
| `--help`, `-h` | Print help text and exit. Also runs when no command is given. |
| `--version`, `-V` | Print the installed version and exit. |

---

## Environment

| Variable | Default | Purpose |
|---|---|---|
| `EMREDOGAN_API_URL` | `https://emredogan.com` | Override the API base. Useful for staging deployments or local dev (`http://localhost:3000`). |

---

## Engineering posture

- **Zero runtime dependencies.** Hand-rolled argv parsing, Node 18+ native `fetch`, native `child_process.spawn`. The tarball is well under 100 KB.
- **Streaming chat.** `emredogan ask` reads the response body chunk by chunk so the terminal renders the reply as it arrives.
- **Provenance.** Published with [sigstore provenance](https://docs.npmjs.com/generating-provenance-statements) — every tarball is linked via OIDC attestation to the exact GitHub workflow run that built it.
- **POSIX-only for now.** macOS and Linux. The `package.json` `os` field is set so `npm install` on Windows surfaces a clear platform mismatch instead of failing inside the CLI.

---

## License

MIT © [Emre Doğan](https://emredogan.com)
