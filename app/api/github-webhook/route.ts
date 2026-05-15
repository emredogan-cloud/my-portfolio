import { kv } from "@vercel/kv";

/**
 * GitHub push-event webhook → Build Beacon state writer.
 *
 * Flow:
 *   GitHub repo Webhooks → POST here on every push event →
 *   HMAC SHA-256 verify against X-Hub-Signature-256 →
 *   extract head commit → write to Vercel KV.
 *
 * /api/build-status reads the same key on every BuildBeacon poll
 * (60s interval), so the footer indicator turns cyan within a
 * minute of a `git push`.
 *
 * Security posture:
 *   - HMAC validated with crypto.subtle.verify (constant-time).
 *   - Raw request body used for signing — never the parsed object.
 *   - GITHUB_WEBHOOK_SECRET missing → 401 (we cannot authenticate;
 *     same outward signal as a wrong signature, no info leak).
 *   - X-GitHub-Event: only "push" updates KV; "ping" returns 200 OK
 *     so the GitHub UI's "Recent Deliveries" stays green when the
 *     webhook is first configured.
 *
 * Runtime: edge. crypto.subtle is native; no Node-only deps. The
 * /api/cwh-demo Node fallback was specific to the AWS SDK — this
 * route is pure web platform.
 */

export const runtime = "edge";

const KV_KEY = "build:last_commit";

interface LastCommit {
  at: string; // ISO timestamp from head_commit
  repo: string; // repository.name (e.g., "my-portfolio")
  message: string; // first line, capped at 200 chars
  sha: string;
}

function jsonError(error: string, status: number) {
  return new Response(JSON.stringify({ error }), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function hexToBytes(hex: string): Uint8Array | null {
  if (hex.length % 2 !== 0) return null;
  const out = new Uint8Array(hex.length / 2);
  for (let i = 0; i < out.length; i++) {
    const byte = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
    if (Number.isNaN(byte)) return null;
    out[i] = byte;
  }
  return out;
}

async function verifyHmac(
  secret: string,
  body: string,
  header: string | null,
): Promise<boolean> {
  if (!header || !header.startsWith("sha256=")) return false;
  const expected = hexToBytes(header.slice("sha256=".length));
  if (!expected) return false;

  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret) as BufferSource,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["verify"],
  );
  return crypto.subtle.verify(
    "HMAC",
    key,
    expected as BufferSource,
    encoder.encode(body) as BufferSource,
  );
}

const hasKv = Boolean(
  process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN,
);

export async function POST(req: Request) {
  const secret = process.env.GITHUB_WEBHOOK_SECRET;
  if (!secret) {
    // No secret provisioned → we cannot authenticate anything. Return
    // 401 (not 503) so we never surface "what state we're in" to an
    // unauthenticated caller.
    return jsonError("unauthorized", 401);
  }

  const raw = await req.text();
  const signature = req.headers.get("x-hub-signature-256");

  const ok = await verifyHmac(secret, raw, signature);
  if (!ok) return jsonError("unauthorized", 401);

  // Verified. Now inspect event type — anything other than "push" is
  // ack-and-discard. "ping" arrives the first time GitHub validates the
  // webhook URL; we want a clean 200 so the dashboard goes green.
  const event = req.headers.get("x-github-event") ?? "";
  if (event === "ping") {
    return Response.json({ pong: true });
  }
  if (event !== "push") {
    return Response.json({ ignored: event });
  }

  let payload: unknown;
  try {
    payload = JSON.parse(raw);
  } catch {
    return jsonError("invalid-json", 400);
  }

  const head = (payload as { head_commit?: unknown }).head_commit;
  if (!head || typeof head !== "object") {
    // Branch deletion pushes have no head_commit. Drop quietly.
    return Response.json({ ignored: "no-head-commit" });
  }

  const repo = (payload as { repository?: { name?: unknown } }).repository;
  const repoName =
    typeof repo?.name === "string" ? repo.name : "unknown-repo";

  const headObj = head as {
    id?: unknown;
    message?: unknown;
    timestamp?: unknown;
  };
  const sha = typeof headObj.id === "string" ? headObj.id : "";
  const rawMessage =
    typeof headObj.message === "string" ? headObj.message : "";
  const timestamp =
    typeof headObj.timestamp === "string"
      ? headObj.timestamp
      : new Date().toISOString();

  const firstLine = rawMessage.split("\n", 1)[0] ?? "";
  const message = firstLine.length > 200 ? firstLine.slice(0, 199) + "…" : firstLine;

  const record: LastCommit = {
    at: timestamp,
    repo: repoName,
    message,
    sha,
  };

  if (!hasKv) {
    // KV not provisioned (local dev). Auth passed; payload parsed; just
    // ack without persisting so we don't pretend to have updated state.
    return Response.json({ ok: true, persisted: false });
  }

  try {
    await kv.set(KV_KEY, record);
  } catch {
    return jsonError("kv-write-failed", 502);
  }

  return Response.json({ ok: true, persisted: true });
}
