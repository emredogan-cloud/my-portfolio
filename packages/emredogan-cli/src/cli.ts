#!/usr/bin/env node

import { runBrowse } from "./commands/browse.js";
import { runAsk } from "./commands/ask.js";
import { runProject } from "./commands/project.js";
import { runDemo } from "./commands/demo.js";
import { runChangelog } from "./commands/changelog.js";
import { runTelemetry } from "./commands/telemetry.js";
import { runHire } from "./commands/hire.js";
import { runLab } from "./commands/lab.js";

/**
 * `@emredogan/cli` entry — V4 Phase 2, CLI v0.1.1 expansion.
 *
 * Hand-rolled argv parser. Zero deps by design — the V4 budget
 * caps the published tarball at 100 KB and a `commander` or
 * `yargs` import would alone push us past half of that.
 *
 * Command surface (v0.1.1):
 *   emredogan browse
 *   emredogan ask "<question>"
 *   emredogan project list
 *   emredogan demo <slug>
 *   emredogan changelog                            ← new in 0.1.1
 *   emredogan telemetry                            ← new in 0.1.1
 *   emredogan hire                                 ← new in 0.1.1
 *   emredogan lab <experiment> "<input>"           ← new in 0.1.1
 *   emredogan --help | -h
 *   emredogan --version | -V
 *
 * Exit-code contract (per-command details in each handler):
 *   0  - clean
 *   1  - usage error (printed to stderr with the right snippet)
 *   2  - environment failure (network, missing platform support)
 *   3+ - command-specific upstream errors (see ask.ts / lab.ts)
 *
 * The shebang on line 1 must be preserved by tsc — TypeScript 5+
 * leaves shebang lines intact. The post-build script in
 * `scripts/emredogan-cli/build.mjs` defends against compiler
 * regressions by re-asserting the shebang + chmod +x on
 * `dist/cli.js`.
 */

const VERSION = "0.1.1";

const HELP = `emredogan — a terminal companion for emredogan.com

usage: emredogan <command> [args]

core:
  browse                          open https://emredogan.com in the default browser
  ask "<question>"                stream a Lumina reply to stdout
  project list                    print the live projects
  demo <slug>                     open /lab/<slug> in the default browser

read:
  changelog                       print the last 5 commits with WHY annotations
  telemetry                       print live platform metrics as an ASCII table
  hire                            print Emre's contact card

build:
  lab <experiment> "<input>"      post to a /lab experiment and stream the reply
                                    experiments: iam | prompt | commit

flags:
  -h, --help                      show this help and exit
  -V, --version                   print version and exit

env:
  EMREDOGAN_API_URL               override the API base (defaults to https://emredogan.com)

examples:
  emredogan ask "how is /telemetry cached?"
  emredogan changelog
  emredogan telemetry
  emredogan hire
  emredogan lab prompt "build a chat app with auth"
  emredogan demo iam-translator
`;

function printHelp() {
  process.stdout.write(HELP);
}

function printVersion() {
  process.stdout.write(`emredogan v${VERSION}\n`);
}

async function main(argv: readonly string[]): Promise<number> {
  /* Drop the leading `node` + script path. */
  const args = argv.slice(2);

  /* Global flags first. We honour these even when a command is
   * also present, because that's the muscle-memory most CLIs use
   * (`tool foo --help`). */
  if (args.includes("-h") || args.includes("--help")) {
    printHelp();
    return 0;
  }
  if (args.includes("-V") || args.includes("--version")) {
    printVersion();
    return 0;
  }

  if (args.length === 0) {
    printHelp();
    return 0;
  }

  const [command, ...rest] = args;

  switch (command) {
    case "browse":
      return runBrowse();
    case "ask": {
      /* Stitch the remaining args back together — the user's
       * shell will have split on whitespace if they forgot to
       * quote. We rejoin so `emredogan ask how is X` works the
       * same as `emredogan ask "how is X"`. */
      const question = rest.join(" ");
      return runAsk(question);
    }
    case "project":
      return runProject(rest[0]);
    case "demo":
      return runDemo(rest[0]);
    case "changelog":
      return runChangelog();
    case "telemetry":
      return runTelemetry();
    case "hire":
      return runHire();
    case "lab": {
      /* First positional after `lab` is the experiment slug;
       * the rest is the input (rejoined the same way as `ask`
       * so quotes are optional from the user's shell). */
      const [experimentSlug, ...inputParts] = rest;
      return runLab(experimentSlug, inputParts.join(" "));
    }
    default:
      process.stderr.write(
        `[emredogan] unknown command: ${command}\n` +
          `try \`emredogan --help\`\n`,
      );
      return 1;
  }
}

main(process.argv)
  .then((code) => {
    process.exit(code);
  })
  .catch((err) => {
    const msg = err instanceof Error ? err.message : "unknown";
    process.stderr.write(`[emredogan] uncaught: ${msg}\n`);
    process.exit(5);
  });
