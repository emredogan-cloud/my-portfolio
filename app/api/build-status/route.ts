import { kv } from "@vercel/kv";

/**
 * Build Beacon read endpoint.
 *
 * Returns the most recent commit recorded by /api/github-webhook plus
 * a derived `status` string the client renders verbatim — keeping all
 * time-of-day math on the server side so SSR and client hydration
 * agree byte-for-byte. (Client-side `Date.now()` against a server-
 * rendered string would otherwise produce a mismatch.)
 *
 * Status bands (mirrors the doc):
 *   - shipping: head commit < 30 min ago  → footer dot pulses cyan
 *   - recent:   30 min – 4 h              → solid cyan, no pulse
 *   - resting:  > 4 h                     → solid gray
 *   - idle:     no commit ever recorded   → "tracking…"
 *
 * Runtime: edge. The webhook persists to KV; this route just reads it.
 */

export const runtime = "edge";

const KV_KEY = "build:last_commit";

const MIN_MS = 60 * 1000;
const SHIPPING_WINDOW_MS = 30 * MIN_MS;
const RECENT_WINDOW_MS = 4 * 60 * MIN_MS;

type Status = "idle" | "shipping" | "recent" | "resting";

interface LastCommit {
  at: string;
  repo: string;
  message: string;
  sha: string;
}

function deriveStatus(at: string): Status {
  const ts = Date.parse(at);
  if (Number.isNaN(ts)) return "idle";
  const delta = Date.now() - ts;
  if (delta < SHIPPING_WINDOW_MS) return "shipping";
  if (delta < RECENT_WINDOW_MS) return "recent";
  return "resting";
}

const hasKv = Boolean(
  process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN,
);

export async function GET() {
  if (!hasKv) {
    return Response.json(
      { status: "idle" as Status, commit: null },
      { headers: { "Cache-Control": "no-store" } },
    );
  }

  let record: LastCommit | null = null;
  try {
    record = (await kv.get<LastCommit>(KV_KEY)) ?? null;
  } catch {
    // KV transient error — treat as idle rather than 5xx; the beacon
    // is decorative, not critical.
    return Response.json(
      { status: "idle" as Status, commit: null },
      { headers: { "Cache-Control": "no-store" } },
    );
  }

  if (!record) {
    return Response.json(
      { status: "idle" as Status, commit: null },
      { headers: { "Cache-Control": "no-store" } },
    );
  }

  const status = deriveStatus(record.at);
  return Response.json(
    { status, commit: record },
    { headers: { "Cache-Control": "no-store" } },
  );
}
