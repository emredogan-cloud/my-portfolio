import { spawn } from "node:child_process";
import { getApiBase } from "../api-base.js";

/**
 * `emredogan demo <slug>` — open `/lab/<slug>` in the default
 * browser.
 *
 * Known slugs (Sub-PRs 2.1, 2.2, 2.3): `iam-translator`,
 * `prompt-rescuer`, `commit-narrator`. We don't gate on the
 * known list — opening an unknown slug lands the visitor on
 * the lab's 404, which is honest behaviour ("the experiment
 * you asked for doesn't exist") rather than an unhelpful CLI
 * error.
 *
 * POSIX-only opener pattern shared with `browse` — sucks to
 * duplicate, but extracting a helper for two ~5-line callers
 * would be premature. Revisit if a third `demo`-like surface
 * lands.
 */

const SLUG_REGEX = /^[a-z0-9-]{1,80}$/;

export async function runDemo(slug: string | undefined): Promise<number> {
  if (!slug || slug.trim().length === 0) {
    process.stderr.write(
      `[emredogan] missing slug.\n` +
        `usage: emredogan demo <slug>\n` +
        `known slugs: iam-translator, prompt-rescuer, commit-narrator\n`,
    );
    return 1;
  }
  const trimmed = slug.trim();
  if (!SLUG_REGEX.test(trimmed)) {
    process.stderr.write(
      `[emredogan] invalid slug. Allowed: lowercase letters, digits, dashes.\n`,
    );
    return 1;
  }

  const url = `${getApiBase()}/lab/${trimmed}`;
  const platform = process.platform;
  let opener: string;
  if (platform === "darwin") {
    opener = "open";
  } else if (platform === "linux") {
    opener = "xdg-open";
  } else {
    process.stderr.write(
      `[emredogan] platform "${platform}" is not supported in v0.1. macOS + Linux only. Open ${url} manually for now.\n`,
    );
    return 2;
  }

  try {
    const child = spawn(opener, [url], {
      detached: true,
      stdio: "ignore",
    });
    child.on("error", (err) => {
      process.stderr.write(
        `[emredogan] failed to launch "${opener}": ${err.message}\n`,
      );
    });
    child.unref();
    process.stdout.write(`Opening ${url}\n`);
    return 0;
  } catch (err) {
    const msg = err instanceof Error ? err.message : "unknown";
    process.stderr.write(
      `[emredogan] could not launch the browser opener: ${msg}\n`,
    );
    return 2;
  }
}
