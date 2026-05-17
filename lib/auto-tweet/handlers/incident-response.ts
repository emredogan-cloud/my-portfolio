import { anthropic } from "@ai-sdk/anthropic";
import { generateText } from "ai";
import { kv } from "@vercel/kv";
import { TWEET_MAX_LENGTH } from "@/lib/twitter-client";
import { INCIDENT_RESPONSE_SYSTEM_PROMPT } from "@/lib/auto-tweet/prompts/incident-response";
import { AUTOTWEET_MODES } from "@/lib/auto-tweet/modes";

/**
 * Incident response handler — Sentry-triggered (Sub-PR 1.5 wires
 * the webhook).
 *
 * IMPORTANT: this handler **drafts only**. It never auto-posts. The
 * V4 § 6.1.B SUB-PR 1.3 step 4 contract: "Drafted, requires manual
 * approval (admin UI)". The admin UI lands in Sub-PR 1.5 alongside
 * the Sentry setup. For Sub-PR 1.3 the handler:
 *
 *   1. Validates the incoming payload looks Sentry-shaped + critical.
 *   2. Builds context, calls Claude, gets a draft.
 *   3. Persists the draft to KV at `v4:autotweet:incident:<id>`.
 *   4. Returns the draft in the JSON response so the caller (Sentry
 *      webhook in 1.5, or a manual curl during testing) can route
 *      it to the approval surface.
 *
 * No KV no-op fallback for the persistence step — if KV is down the
 * draft is still returned in the response, the persistence is just
 * skipped silently.
 */

const INCIDENT_KEY_PREFIX = "v4:autotweet:incident:";
const INCIDENT_TTL_SECONDS = 60 * 60 * 24 * 30; // 30 days

interface IncidentPayload {
  /** Sentry event id, or any caller-supplied unique id. */
  id?: string;
  /** "critical" | "fatal" | "error" — only "critical"/"fatal" drafts. */
  level?: string;
  /** Short summary, e.g. "Bedrock connection exhausted". */
  title?: string;
  /** Optional Sentry message body (truncated). */
  message?: string;
  /** Optional surface that broke, e.g. "/api/chat", "lumina-chat npm". */
  surface?: string;
  /** Optional exception type, e.g. "FetchError", "TimeoutError". */
  exception_type?: string;
  /** Optional Sentry environment, e.g. "production". */
  environment?: string;
}

interface IncidentDraftRecord {
  id: string;
  received_at: string;
  payload: IncidentPayload;
  draft: string;
  status: "drafted" | "skipped-non-critical" | "skipped-empty-context" | "draft-failed";
  /** Set by the Sub-PR 1.5 approval surface when the draft is
   *  posted, skipped manually, or expired. Stays "drafted" until
   *  someone (or a future automation) acts on it. */
  approval?: "approved" | "rejected" | "expired";
}

const hasKv = Boolean(
  process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN,
);

function isCritical(level: string | undefined): boolean {
  if (typeof level !== "string") return false;
  const norm = level.toLowerCase();
  return norm === "critical" || norm === "fatal";
}

function buildContext(payload: IncidentPayload): string {
  const lines: string[] = [
    "Sentry incident payload:",
  ];
  if (payload.level) lines.push(`- level: ${payload.level}`);
  if (payload.environment) lines.push(`- environment: ${payload.environment}`);
  if (payload.surface) lines.push(`- surface: ${payload.surface}`);
  if (payload.exception_type)
    lines.push(`- exception: ${payload.exception_type}`);
  if (payload.title) lines.push(`- title: ${payload.title}`);
  if (payload.message)
    lines.push(`- message: ${payload.message.slice(0, 400)}`);
  return lines.join("\n");
}

async function generateDraft(context: string): Promise<string | null> {
  if (!process.env.ANTHROPIC_API_KEY) return null;
  try {
    const result = await generateText({
      model: anthropic("claude-haiku-4-5-20251001"),
      system: INCIDENT_RESPONSE_SYSTEM_PROMPT,
      prompt: context,
      temperature: 0.4,
      maxOutputTokens: 220,
    });
    let text = result.text.trim();
    if (
      (text.startsWith('"') && text.endsWith('"')) ||
      (text.startsWith("'") && text.endsWith("'"))
    ) {
      text = text.slice(1, -1).trim();
    }
    if (text.length > TWEET_MAX_LENGTH) {
      text = text.slice(0, TWEET_MAX_LENGTH - 1) + "…";
    }
    return text;
  } catch (err) {
    console.error(
      "[auto-tweet] incident_response: claude generation failed:",
      err instanceof Error ? err.message : "unknown",
    );
    return null;
  }
}

async function persistDraft(record: IncidentDraftRecord): Promise<void> {
  if (!hasKv) return;
  try {
    await kv.set(`${INCIDENT_KEY_PREFIX}${record.id}`, record, {
      ex: INCIDENT_TTL_SECONDS,
    });
  } catch {
    /* swallow — draft is in the response body, KV is convenience */
  }
}

/**
 * Run the incident response draft flow. Expects a Sentry-shaped
 * payload in the request body; returns the draft (or a reason for
 * skipping) without posting to Twitter.
 */
export async function runIncidentResponse(req: Request): Promise<Response> {
  let payload: IncidentPayload = {};
  try {
    const body = (await req.json()) as unknown;
    if (body && typeof body === "object") {
      payload = body as IncidentPayload;
    }
  } catch {
    /* missing/invalid JSON body — handled by the validation below */
  }

  const id =
    typeof payload.id === "string" && payload.id.length > 0
      ? payload.id
      : `unknown-${Date.now()}`;
  const received_at = new Date().toISOString();

  if (!isCritical(payload.level)) {
    const record: IncidentDraftRecord = {
      id,
      received_at,
      payload,
      draft: "",
      status: "skipped-non-critical",
    };
    void persistDraft(record);
    return Response.json(
      { ok: true, status: "skipped-non-critical", id, mode: AUTOTWEET_MODES.INCIDENT_RESPONSE },
      { headers: { "Cache-Control": "no-store" } },
    );
  }

  const context = buildContext(payload);
  /* If the payload has no surface/title/message, the draft will be
   * generic and unhelpful — skip rather than post low-signal noise. */
  if (!payload.title && !payload.message && !payload.surface) {
    const record: IncidentDraftRecord = {
      id,
      received_at,
      payload,
      draft: "",
      status: "skipped-empty-context",
    };
    void persistDraft(record);
    return Response.json(
      { ok: true, status: "skipped-empty-context", id, mode: AUTOTWEET_MODES.INCIDENT_RESPONSE },
      { headers: { "Cache-Control": "no-store" } },
    );
  }

  const draft = await generateDraft(context);
  if (!draft || draft.length === 0) {
    const record: IncidentDraftRecord = {
      id,
      received_at,
      payload,
      draft: "",
      status: "draft-failed",
    };
    void persistDraft(record);
    return Response.json(
      { ok: false, status: "draft-failed", id, mode: AUTOTWEET_MODES.INCIDENT_RESPONSE },
      { status: 502, headers: { "Cache-Control": "no-store" } },
    );
  }

  const record: IncidentDraftRecord = {
    id,
    received_at,
    payload,
    draft,
    status: "drafted",
  };
  await persistDraft(record);

  console.log(
    [
      `[auto-tweet] incident_response drafted (no auto-post — awaiting approval)`,
      `  id:      ${id}`,
      `  level:   ${payload.level}`,
      `  surface: ${payload.surface ?? "(none)"}`,
    ].join("\n"),
  );
  return Response.json(
    {
      ok: true,
      status: "drafted",
      id,
      draft,
      mode: AUTOTWEET_MODES.INCIDENT_RESPONSE,
      note: "Draft persisted under v4:autotweet:incident:<id>. Manual approval surface lands in Sub-PR 1.5.",
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
