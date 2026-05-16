#!/usr/bin/env node
/**
 * Copy non-TS assets from packages/lumina-chat/src into the dist
 * directory after `tsc` runs. tsc only emits .js / .d.ts / .map files;
 * the package's stylesheet (styles.css) lives next to the source and
 * needs to land in dist/ alongside the compiled output so the
 * "./styles.css" subpath export resolves at install time.
 *
 * Run from the package directory (npm script `build` cd's there
 * implicitly via npm workspaces). The paths here are absolute via
 * import.meta.url so the script also works when invoked from the
 * repo root.
 */

import { copyFile, mkdir, readdir, stat } from "node:fs/promises";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const PACKAGE_ROOT = join(__dirname, "..", "..", "packages", "lumina-chat");
const SRC_DIR = join(PACKAGE_ROOT, "src");
const DIST_DIR = join(PACKAGE_ROOT, "dist");

const COPY_EXTENSIONS = new Set([".css"]);

async function walk(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await walk(full)));
    } else if (entry.isFile()) {
      const ext = "." + entry.name.split(".").pop();
      if (COPY_EXTENSIONS.has(ext)) files.push(full);
    }
  }
  return files;
}

async function ensureDir(path) {
  await mkdir(path, { recursive: true });
}

async function main() {
  try {
    await stat(SRC_DIR);
  } catch {
    console.error(`[lumina-chat] no src/ directory at ${SRC_DIR}`);
    process.exit(1);
  }
  try {
    await stat(DIST_DIR);
  } catch {
    console.error(
      `[lumina-chat] no dist/ directory — run \`tsc\` first (npm run build)`,
    );
    process.exit(1);
  }

  const files = await walk(SRC_DIR);
  if (files.length === 0) {
    console.log("[lumina-chat] no assets to copy");
    return;
  }
  for (const src of files) {
    const rel = relative(SRC_DIR, src);
    const dest = join(DIST_DIR, rel);
    await ensureDir(dirname(dest));
    await copyFile(src, dest);
    console.log(`[lumina-chat] copied ${rel}`);
  }
  console.log(`[lumina-chat] copied ${files.length} asset(s) to dist/`);
}

main().catch((err) => {
  console.error("[lumina-chat] copy-assets failed:", err);
  process.exit(1);
});
