import { spawn } from "node:child_process";
import { getApiBase } from "../api-base.js";

/**
 * `emredogan browse` — open the portfolio in the default browser.
 *
 * POSIX-only for v0.1 (`darwin` + `linux`). Windows support is
 * deferred to v0.2 per V4 § 5.2.4; the `package.json` `os` field
 * gates `npm install` so Windows users see a clear platform
 * mismatch rather than reaching this code with a stub opener.
 *
 * `spawn` with `detached: true` + `stdio: "ignore"` + `unref()` —
 * the CLI returns immediately while the browser opens in the
 * background. No timeout, no callback handling: we don't actually
 * care if the browser launched, just that we kicked the OS at it.
 */
export async function runBrowse(): Promise<number> {
  const base = getApiBase();
  const target = `${base}/`;

  const platform = process.platform;
  let opener: string;
  let args: string[];
  if (platform === "darwin") {
    opener = "open";
    args = [target];
  } else if (platform === "linux") {
    opener = "xdg-open";
    args = [target];
  } else {
    process.stderr.write(
      `[emredogan] platform "${platform}" is not supported in v0.1. macOS + Linux only. Open ${target} manually for now.\n`,
    );
    return 2;
  }

  try {
    const child = spawn(opener, args, {
      detached: true,
      stdio: "ignore",
    });
    child.on("error", (err) => {
      process.stderr.write(
        `[emredogan] failed to launch "${opener}": ${err.message}\n`,
      );
    });
    child.unref();
    process.stdout.write(`Opening ${target}\n`);
    return 0;
  } catch (err) {
    const msg = err instanceof Error ? err.message : "unknown";
    process.stderr.write(
      `[emredogan] could not launch the browser opener: ${msg}\n`,
    );
    return 2;
  }
}
