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

  // GitHub PushEvent payload shape:
  //   head_commit  → object with .id .message .timestamp .author, OR null
  //                  on certain pushes (branch delete, force-push to nothing).
  //   commits      → ordered array of CommitObject entries with the same
  //                  fields. The last entry is the tip of the push.
  // Empirically head_commit is occasionally missing or carries an empty
  // message (e.g., merge commits with auto-generated bodies stripped, or
  // pushes where GitHub's webhook generator hasn't filled the field).
  // We extract from head_commit first, then fall back to commits[-1].
  const top = payload as {
    head_commit?: { id?: unknown; message?: unknown; timestamp?: unknown } | null;
    commits?: Array<{ id?: unknown; message?: unknown; timestamp?: unknown }>;
    repository?: { name?: unknown };
  };

  const headCommit = top.head_commit;
  const commits = Array.isArray(top.commits) ? top.commits : [];
  const lastCommit = commits[commits.length - 1];

  // Pick the first source that yields a usable id+timestamp pair.
  const source = headCommit && typeof headCommit === "object" ? headCommit : lastCommit;
  if (!source) {
    // Branch deletion pushes have no head_commit AND no commits array.
    // Drop quietly.
    return Response.json({ ignored: "no-head-commit" });
  }

  const repoName =
    typeof top.repository?.name === "string"
      ? top.repository.name
      : "unknown-repo";

  const sha = typeof source.id === "string" ? source.id : "";
  const headMessageRaw =
    typeof source.message === "string" ? source.message : "";
  // Defensive cascade: if the head source's message is empty/whitespace,
  // try the OTHER commit (head → last in commits, or vice versa).
  const fallbackMessageRaw =
    headMessageRaw.trim().length === 0 && source !== lastCommit && lastCommit
      ? typeof lastCommit.message === "string"
        ? lastCommit.message
        : ""
      : headMessageRaw.trim().length === 0 && source !== headCommit && headCommit
        ? typeof headCommit.message === "string"
          ? headCommit.message
          : ""
        : "";
  const rawMessage =
    headMessageRaw.trim().length > 0 ? headMessageRaw : fallbackMessageRaw;
  const timestamp =
    typeof source.timestamp === "string"
      ? source.timestamp
      : new Date().toISOString();

  const firstLine = rawMessage.split("\n", 1)[0]?.trim() ?? "";
  const message = firstLine.length > 200 ? firstLine.slice(0, 199) + "…" : firstLine;

  // Log once per webhook so future "(no message)" reports are diagnosable
  // from Vercel function logs without a redeploy.
  console.log(
    "[github-webhook] push event:",
    JSON.stringify({
      repo: repoName,
      sha: sha.slice(0, 7),
      message_length: message.length,
      source: source === headCommit ? "head_commit" : "commits[last]",
    }),
  );

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
