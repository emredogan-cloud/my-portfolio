"use client";

import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { GitCommit } from "lucide-react";

const EASE = [0.22, 1, 0.36, 1] as const;

interface PushEvent {
  type: "PushEvent";
  repo: { name: string };
  created_at: string;
  payload: {
    commits?: { message: string; sha: string }[];
  };
}

type FeedStatus = "loading" | "ready" | "empty" | "error";

interface FeedState {
  status: FeedStatus;
  event: PushEvent | null;
  now: number;
}

const INITIAL_STATE: FeedState = { status: "loading", event: null, now: 0 };

/* Stable timeago. `now` is a client-side value passed in explicitly
   so the function itself is pure — no `Date.now()` reads during
   render. Render the skeleton state until both `now` and `event`
   are populated to avoid hydration drift. */
function formatTimeAgo(iso: string, now: number): string {
  const ts = new Date(iso).getTime();
  const diff = Math.max(0, now - ts);
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  return `${months}mo ago`;
}

function truncate(s: string, max: number): string {
  if (s.length <= max) return s;
  return s.slice(0, max - 1) + "…";
}

/**
 * Live ticker showing the most recent PushEvent from GitHub.
 *
 * Hydration strategy:
 *   1. Server + first client paint both render the "loading"
 *      skeleton — identical HTML, no mismatch.
 *   2. After hydration, useEffect fires once: hit the in-house
 *      /api/github-feed edge endpoint (KV-cached upstream), find
 *      the latest PushEvent, populate state with `Date.now()` for
 *      the timeago anchor.
 *   3. A 60s interval re-stamps `now` so the timeago string stays
 *      fresh without re-fetching — the KV layer absorbs the upstream
 *      GitHub rate limit (60/hr anonymous) across all visitors.
 */
export default function LiveGitHubFeed() {
  const [state, setState] = useState<FeedState>(INITIAL_STATE);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const res = await fetch("/api/github-feed", { cache: "no-store" });
        if (!res.ok) throw new Error(`status ${res.status}`);
        const data: unknown = await res.json();
        if (!Array.isArray(data)) throw new Error("malformed response");
        const push = (data as PushEvent[]).find((e) => e.type === "PushEvent");
        if (cancelled) return;
        if (!push) {
          setState({ status: "empty", event: null, now: Date.now() });
          return;
        }
        setState({ status: "ready", event: push, now: Date.now() });
      } catch {
        if (!cancelled) {
          setState({ status: "error", event: null, now: Date.now() });
        }
      }
    }

    load();
    const tick = setInterval(() => {
      setState((prev) => (prev.event ? { ...prev, now: Date.now() } : prev));
    }, 60_000);

    return () => {
      cancelled = true;
      clearInterval(tick);
    };
  }, []);

  /* ── Skeleton / empty / error variants ── */
  if (state.status !== "ready" || !state.event) {
    const label =
      state.status === "loading"
        ? "connecting to github…"
        : "github feed unavailable";
    return (
      <div className="mx-auto max-w-3xl px-4">
        <div className="flex items-center gap-3 rounded-full border border-white/[0.08] bg-black/40 px-4 py-2.5 text-xs font-mono">
          <span className="inline-flex w-2 h-2 rounded-full bg-white/15" aria-hidden="true" />
          <GitCommit className="w-3.5 h-3.5 text-white/25 flex-shrink-0" aria-hidden="true" />
          <span className="text-white/35">{label}</span>
        </div>
      </div>
    );
  }

  const event = state.event;
  const commitMsg =
    event.payload.commits?.[0]?.message?.split("\n")[0] ?? "(no commit message)";
  const repo = event.repo.name.split("/").pop() ?? event.repo.name;
  const timeago = formatTimeAgo(event.created_at, state.now);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: EASE }}
      className="mx-auto max-w-3xl px-4"
    >
      <div
        className="
          flex items-center gap-3 rounded-full
          border border-[#00d2ff]/15 bg-black/40
          px-4 py-2.5 text-xs font-mono
        "
        style={{
          boxShadow:
            "inset 0 0 12px rgba(0,210,255,0.05), 0 0 24px rgba(0,210,255,0.04)",
        }}
      >
        <motion.span
          className="inline-flex w-2 h-2 rounded-full bg-[#00d2ff] flex-shrink-0"
          animate={{ opacity: [1, 0.4, 1], scale: [1, 1.3, 1] }}
          transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
          aria-hidden="true"
        />
        <GitCommit
          className="w-3.5 h-3.5 text-[#00d2ff]/80 flex-shrink-0"
          aria-hidden="true"
        />
        <span className="text-white/45 whitespace-nowrap">
          last shipped <span className="text-white/75">{timeago}</span> to{" "}
          <span className="text-white/85">{repo}</span>:
        </span>
        <span className="text-white/55 truncate min-w-0" title={commitMsg}>
          &ldquo;{truncate(commitMsg, 60)}&rdquo;
        </span>
      </div>
    </motion.div>
  );
}
