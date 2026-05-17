#!/usr/bin/env node
/**
 * Post-tsc finalisation for `packages/emredogan-cli`.
 *
 * V4 Phase 2 — Sub-PR 2.4.
 *
 * Two responsibilities:
 *
 *   1. Defend the shebang line on `dist/cli.js`. TypeScript 5+
 *      preserves shebangs by default, but a stray `removeComments:
 *      true` or a future compiler regression would silently drop
 *      it — at which point `npx emredogan` would print
 *      "SyntaxError" instead of running the CLI. We re-assert it
 *      idempotently here.
 *
 *   2. `chmod 755` on `dist/cli.js` so the file is executable
 *      when npm symlinks it into the consumer's `node_modules/.bin/`.
 *      tsc emits 0644 by default.
 *
 * Run from the workspace root via `npm run emredogan-cli:build`,
 * which `cd`s into the package and invokes this script after `tsc`.
 * Paths are absolute via `import.meta.url` so the script also
 * works when invoked from the repo root.
 */

import { chmod, readFile, stat, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const PACKAGE_ROOT = join(__dirname, "..", "..", "packages", "emredogan-cli");
const CLI_OUTPUT = join(PACKAGE_ROOT, "dist", "cli.js");
const SHEBANG_LINE = "#!/usr/bin/env node\n";

async function main() {
  try {
    await stat(CLI_OUTPUT);
  } catch {
    console.error(
      `[emredogan-cli] dist/cli.js not found at ${CLI_OUTPUT} — run \`tsc\` first.`,
    );
    process.exit(1);
  }

  const original = await readFile(CLI_OUTPUT, "utf8");

  /* Idempotent shebang assertion. If tsc preserved it, we leave
   * the file alone. If it dropped it, we prepend. */
  let updated = original;
  if (!updated.startsWith("#!")) {
    updated = SHEBANG_LINE + updated;
    await writeFile(CLI_OUTPUT, updated, "utf8");
    console.log("[emredogan-cli] re-asserted shebang on dist/cli.js");
  } else {
    console.log("[emredogan-cli] shebang already present on dist/cli.js");
  }

  /* `chmod 755` — owner rwx + group rx + others rx. The npm
   * `bin` field will symlink this into node_modules/.bin/, which
   * only works on a file the OS recognises as executable. */
  await chmod(CLI_OUTPUT, 0o755);
  console.log("[emredogan-cli] chmod 755 on dist/cli.js");
}

main().catch((err) => {
  console.error("[emredogan-cli] build script failed:", err);
  process.exit(1);
});
