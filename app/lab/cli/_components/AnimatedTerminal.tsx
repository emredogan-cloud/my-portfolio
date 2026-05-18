"use client";

import { useEffect, useState, useSyncExternalStore } from "react";

/**
 * AnimatedTerminal — looping shell-session simulation for
 * `/lab/cli`. Phase 2 polish (CLI discovery).
 *
 * Visual contract: real Unix terminal vibe, NOT a SaaS chrome
 * card. The container is a flat black rectangle with a hairline
 * top-bar (three dots, a faint window title), a `font-mono` line
 * stack, and a blinking cyan block cursor at the active line.
 *
 * Animation script (looped):
 *   1. type   `$ npm install -g @emredogan/cli`
 *   2. snap   fake npm install output
 *   3. type   `$ emredogan ask "What is your main focus?"`
 *   4. type   cyan Lumina-voice reply (simulated streaming)
 *   5. type   `$ emredogan project list`
 *   6. snap   structured project list
 *   7. pause, clear, repeat
 *
 * Reduced-motion: respected via `prefers-reduced-motion`. When
 * the visitor opts out, the component renders a *static
 * snapshot* of the complete script (all lines, no animation, no
 * cursor blink). No looping background work.
 *
 * Lifecycle: a single `useEffect` orchestrates the script via
 * async/await + a `cancelled` flag. The cleanup callback flips
 * the flag and the next `await sleep(...)` resolves into a
 * cancelled iteration, so unmount during animation never
 * leaks a setState into an unmounted tree.
 */

type LineKind = "prompt" | "output" | "stream";

interface RenderedLine {
  kind: LineKind;
  text: string;
}

type Step =
  | { kind: "type"; line: LineKind; text: string; charDelayMs: number }
  | { kind: "snap"; line: LineKind; text: string; postDelayMs?: number }
  | { kind: "pause"; ms: number }
  | { kind: "clear" };

/* Cyan accent on the prompt line (`$`) is rendered separately by
 * the line component below — the `text` here is just the
 * command-or-output content. Lumina-reply lines use the `stream`
 * kind so they get the cyan tint without needing a prompt
 * prefix. */
const SCRIPT: readonly Step[] = [
  { kind: "type", line: "prompt", text: "npm install -g @emredogan/cli", charDelayMs: 45 },
  { kind: "pause", ms: 380 },
  { kind: "snap", line: "output", text: "added 1 package in 1.8s", postDelayMs: 60 },
  { kind: "snap", line: "output", text: "" },
  { kind: "pause", ms: 700 },

  { kind: "type", line: "prompt", text: 'emredogan ask "What is your main focus?"', charDelayMs: 45 },
  { kind: "pause", ms: 500 },
  { kind: "snap", line: "output", text: "" },
  { kind: "type", line: "stream", text: "Cloud-native systems, built quietly over years.", charDelayMs: 25 },
  { kind: "type", line: "stream", text: "AWS infrastructure, AI agents, production SaaS —", charDelayMs: 25 },
  { kind: "type", line: "stream", text: "all engineered for compounding leverage at scale.", charDelayMs: 25 },
  { kind: "type", line: "stream", text: "Less velocity, more durability.", charDelayMs: 25 },
  { kind: "snap", line: "output", text: "" },
  { kind: "pause", ms: 1300 },

  { kind: "type", line: "prompt", text: "emredogan project list", charDelayMs: 45 },
  { kind: "pause", ms: 380 },
  { kind: "snap", line: "output", text: "" },
  { kind: "snap", line: "output", text: "Cloud Waste Hunter   [shipped]", postDelayMs: 80 },
  { kind: "snap", line: "output", text: "  B2B SaaS that scans AWS accounts for waste.", postDelayMs: 60 },
  { kind: "snap", line: "output", text: "  live   https://cloudwastehunter.io", postDelayMs: 200 },
  { kind: "snap", line: "output", text: "" },
  { kind: "snap", line: "output", text: "VibingCoderAI        [building]", postDelayMs: 80 },
  { kind: "snap", line: "output", text: "  Prompt engineering as a service for AI agents.", postDelayMs: 60 },
  { kind: "snap", line: "output", text: "  live   https://www.vibingcoderai.com", postDelayMs: 200 },
  { kind: "snap", line: "output", text: "" },
  { kind: "snap", line: "output", text: "FormAI               [shipped]", postDelayMs: 80 },
  { kind: "snap", line: "output", text: "  Flutter fitness coach with real-time pose detection.", postDelayMs: 60 },
  { kind: "pause", ms: 1200 },

  /* Telemetry showpiece — added in CLI v0.1.1. Demonstrates the
   * new `emredogan telemetry` command. The table contents below
   * are deterministic sample data, not a live read — the visitor
   * gets a sense of the output shape without the cost of an
   * actual /api/cli/telemetry round-trip on every animation
   * frame. */
  { kind: "type", line: "prompt", text: "emredogan telemetry", charDelayMs: 45 },
  { kind: "pause", ms: 380 },
  { kind: "snap", line: "output", text: "" },
  { kind: "snap", line: "output", text: "  METRIC                        VALUE            UPDATED", postDelayMs: 80 },
  { kind: "snap", line: "output", text: "  ───────────────────────────   ──────────────   ──────────", postDelayMs: 80 },
  { kind: "snap", line: "output", text: "  lumina p95 latency            423 ms           3m ago", postDelayMs: 80 },
  { kind: "snap", line: "output", text: "  auto-tweet successes          12               1h ago", postDelayMs: 80 },
  { kind: "snap", line: "output", text: "  iam translator runs           8                12m ago", postDelayMs: 80 },
  { kind: "snap", line: "output", text: "  @emredogan/lumina-chat        41 /wk           2h ago", postDelayMs: 80 },
  { kind: "snap", line: "output", text: "  @emredogan/cli                5 /wk            2h ago", postDelayMs: 80 },
  { kind: "snap", line: "output", text: "  notes audio plays             22               4h ago", postDelayMs: 80 },

  { kind: "pause", ms: 2800 },
  { kind: "clear" },
];

/* Pre-rendered "final state" for the reduced-motion fallback.
 * Walks the script and accumulates lines as if every step had
 * already played, then stops at the last `clear` — the visitor
 * sees the most recent project list snapshot. */
const REDUCED_MOTION_LINES: readonly RenderedLine[] = (() => {
  const out: RenderedLine[] = [];
  for (const step of SCRIPT) {
    if (step.kind === "type" || step.kind === "snap") {
      out.push({ kind: step.line, text: step.text });
    }
    /* Don't honour `clear` — we want to show the full transcript
     * once for accessibility, not an empty box. */
  }
  return out;
})();

function sleep(ms: number): Promise<void> {
  /* Best-effort cancellation: the script effect's `cancelled`
   * flag is checked at every step body, so a timer that resolves
   * after unmount just lands in a no-op iteration. We don't need
   * to clear the timer here. */
  return new Promise((resolve) => setTimeout(() => resolve(), ms));
}

/**
 * `useSyncExternalStore` is the React 19-recommended path for
 * subscribing a component to an external value source (here, a
 * `MediaQueryList`). It avoids the lint warning that flags the
 * "useState + useEffect + setState" pattern as a cascading-render
 * smell — the value is read synchronously during render and the
 * subscriber only fires when the OS-level preference flips.
 *
 * `getServerSnapshot` returns `false` so the SSR pass matches the
 * default-not-reduced state; the real value reconciles on hydrate
 * without a render mismatch.
 */
function subscribePrefersReducedMotion(callback: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
  mq.addEventListener("change", callback);
  return () => mq.removeEventListener("change", callback);
}
function getPrefersReducedMotionSnapshot(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}
function getPrefersReducedMotionServerSnapshot(): boolean {
  return false;
}

export default function AnimatedTerminal() {
  const [lines, setLines] = useState<RenderedLine[]>([]);
  const [activePartial, setActivePartial] = useState<string>("");
  const [activeKind, setActiveKind] = useState<LineKind | null>(null);

  const reducedMotion = useSyncExternalStore(
    subscribePrefersReducedMotion,
    getPrefersReducedMotionSnapshot,
    getPrefersReducedMotionServerSnapshot,
  );

  /* The animator effect only runs when motion is allowed. When
   * `reducedMotion` is true the render path picks the static
   * snapshot directly — no setState inside the effect, no
   * cascading render warning from the React 19 hooks plugin. */
  useEffect(() => {
    if (reducedMotion) return;

    const cancelled = { value: false };

    async function run() {
      while (!cancelled.value) {
        for (const step of SCRIPT) {
          if (cancelled.value) return;
          switch (step.kind) {
            case "type": {
              setActiveKind(step.line);
              setActivePartial("");
              for (let i = 1; i <= step.text.length; i++) {
                if (cancelled.value) return;
                setActivePartial(step.text.slice(0, i));
                await sleep(step.charDelayMs);
              }
              /* Commit the typed line: flush to the `lines`
               * array, clear the active partial. */
              setLines((prev) => [...prev, { kind: step.line, text: step.text }]);
              setActivePartial("");
              setActiveKind(null);
              await sleep(40);
              break;
            }
            case "snap": {
              setLines((prev) => [...prev, { kind: step.line, text: step.text }]);
              await sleep(step.postDelayMs ?? 50);
              break;
            }
            case "pause": {
              await sleep(step.ms);
              break;
            }
            case "clear": {
              setLines([]);
              setActivePartial("");
              setActiveKind(null);
              await sleep(180);
              break;
            }
          }
        }
      }
    }

    run();

    return () => {
      cancelled.value = true;
    };
  }, [reducedMotion]);

  return (
    <div
      role="img"
      aria-label="Looping demonstration of the @emredogan/cli terminal commands"
      className="rounded-2xl border border-white/[0.08] bg-black overflow-hidden font-mono"
    >
      {/* Terminal title bar — three dots, no SaaS chrome. The
          dots are cyan-tinted so the bar stays inside the
          palette; macOS-style red/yellow/green would break
          the editorial identity. */}
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-white/[0.06]">
        <span
          aria-hidden="true"
          className="inline-block w-2 h-2 rounded-full bg-[#00d2ff]/30"
        />
        <span
          aria-hidden="true"
          className="inline-block w-2 h-2 rounded-full bg-white/15"
        />
        <span
          aria-hidden="true"
          className="inline-block w-2 h-2 rounded-full bg-white/15"
        />
        <span className="ml-auto font-mono uppercase tracking-[0.18em] text-[9px] text-quiet">
          emre@dev — emredogan-cli
        </span>
      </div>

      {/* Terminal body. Fixed minimum height so the layout
          doesn't reflow as lines append. Older lines scroll out
          of view via overflow-hidden once the height fills.

          Render branch:
            - reducedMotion → static snapshot of the full
              script (no animator, no cursor, no `useEffect`
              setState churn).
            - otherwise   → animated `lines` + the active
              partially-typed line with a blinking cursor. */}
      <div
        className="px-4 py-4 text-[12.5px] leading-[1.7] overflow-hidden"
        style={{ minHeight: 360, maxHeight: 460 }}
      >
        {reducedMotion ? (
          REDUCED_MOTION_LINES.map((line, i) => (
            <Line key={i} kind={line.kind} text={line.text} />
          ))
        ) : (
          <>
            {lines.map((line, i) => (
              <Line key={i} kind={line.kind} text={line.text} />
            ))}
            {activeKind && (
              <Line
                kind={activeKind}
                text={activePartial}
                withCursor
              />
            )}
          </>
        )}
      </div>
    </div>
  );
}

function Line({
  kind,
  text,
  withCursor = false,
}: {
  kind: LineKind;
  text: string;
  withCursor?: boolean;
}) {
  if (kind === "prompt") {
    return (
      <div className="whitespace-pre">
        <span className="text-[#00d2ff]/80">$</span>{" "}
        <span className="text-primary/90">{text}</span>
        {withCursor && <Cursor />}
      </div>
    );
  }
  if (kind === "stream") {
    return (
      <div className="whitespace-pre text-[#00d2ff]/90">
        {text}
        {withCursor && <Cursor />}
      </div>
    );
  }
  return (
    <div className="whitespace-pre text-tertiary">
      {text || " "}
      {withCursor && <Cursor />}
    </div>
  );
}

function Cursor() {
  /* The existing `terminal-cursor-blink` keyframe in
   * `app/globals.css` already collapses under the global
   * reduced-motion guard, so this block is safe to render
   * unconditionally — at the reduced-motion site the animation
   * is functionally instant. We additionally gate the cursor
   * off at the component level (see AnimatedTerminal's
   * reduced-motion branch) so it doesn't even appear in the
   * static snapshot. */
  return (
    <span
      aria-hidden="true"
      className="inline-block w-[8px] h-[14px] align-middle ml-0.5 bg-[#00d2ff]/85 terminal-cursor-blink"
    />
  );
}
