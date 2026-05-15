import { kv } from "@vercel/kv";

/**
 * Voice Lumina — speech-to-text.
 *
 * Client posts a single audio Blob recorded via MediaRecorder
 * (multipart/form-data, field name "file"). We forward it to OpenAI
 * Whisper's transcription endpoint and return { text }.
 *
 * Posture matches /api/cwh-demo:
 *   - Edge runtime (fetch + FormData are native, no Node-only SDK).
 *   - Hard size cap (~2MB ≈ 4 min of WebM/Opus) so a single visitor
 *     can't burn through quota with a 60-minute upload.
 *   - 10 req / IP / hour, KV-backed. Bypassed gracefully if KV envs
 *     are absent (local dev).
 *   - 503 when OPENAI_API_KEY is missing — same outward signal as
 *     "service offline" without leaking server state.
 */

export const runtime = "edge";
export const maxDuration = 30;

const RATE_LIMIT_MAX = 10;
const RATE_LIMIT_WINDOW_SECONDS = 3600;
const MAX_AUDIO_BYTES = 2 * 1024 * 1024; // 2MB
const WHISPER_URL = "https://api.openai.com/v1/audio/transcriptions";
const WHISPER_MODEL = "whisper-1";

const hasKv = Boolean(
  process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN,
);

function jsonError(error: string, status: number, extra?: Record<string, unknown>) {
  return new Response(
    JSON.stringify({ error, ...(extra ?? {}) }),
    { status, headers: { "Content-Type": "application/json" } },
  );
}

function getClientIp(req: Request): string {
  const real = req.headers.get("x-real-ip");
  if (real) return real;
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0]?.trim() ?? "anonymous";
  return "anonymous";
}

async function consumeRateLimit(ip: string): Promise<"ok" | "blocked"> {
  if (!hasKv) return "ok";
  const key = `voice-transcribe:rl:${ip}`;
  const count = (await kv.incr(key)) as number;
  if (count === 1) await kv.expire(key, RATE_LIMIT_WINDOW_SECONDS);
  return count > RATE_LIMIT_MAX ? "blocked" : "ok";
}

export async function POST(req: Request) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return jsonError("voice-offline", 503);

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return jsonError("invalid-form-data", 400);
  }

  const file = form.get("file");
  if (!(file instanceof Blob)) {
    return jsonError("missing-file", 400);
  }
  if (file.size === 0) {
    return jsonError("empty-audio", 400);
  }
  if (file.size > MAX_AUDIO_BYTES) {
    return jsonError("audio-too-large", 413, {
      limit_bytes: MAX_AUDIO_BYTES,
    });
  }

  const ip = getClientIp(req);
  if ((await consumeRateLimit(ip)) === "blocked") {
    return jsonError("rate-limited", 429, {
      limit: RATE_LIMIT_MAX,
      window_seconds: RATE_LIMIT_WINDOW_SECONDS,
    });
  }

  // Re-pack as multipart to OpenAI. We rename the field "file" with a
  // .webm filename so Whisper's content-type sniffer doesn't reject
  // a Blob whose original name is missing.
  const upstream = new FormData();
  upstream.append("file", file, "speech.webm");
  upstream.append("model", WHISPER_MODEL);
  upstream.append("response_format", "json");
  // Whisper auto-detects language; explicitly setting it would lock
  // visitors to one tongue. Leaving auto.

  let res: Response;
  try {
    res = await fetch(WHISPER_URL, {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}` },
      body: upstream,
    });
  } catch (err) {
    console.error(
      "[voice-transcribe] whisper fetch failed:",
      err instanceof Error ? err.message : "unknown",
    );
    return jsonError("whisper-unreachable", 502);
  }

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    console.error(
      "[voice-transcribe] whisper non-2xx:",
      JSON.stringify({ status: res.status, detail: detail.slice(0, 200) }),
    );
    // 401 / 403 from Whisper = our key is wrong → degrade to "offline"
    // so the widget renders the same affordance as a missing key.
    if (res.status === 401 || res.status === 403) {
      return jsonError("voice-offline", 503);
    }
    return jsonError("whisper-error", 502, { status: res.status });
  }

  let data: { text?: unknown };
  try {
    data = (await res.json()) as { text?: unknown };
  } catch {
    return jsonError("whisper-bad-json", 502);
  }
  const text = typeof data.text === "string" ? data.text.trim() : "";
  if (!text) return jsonError("no-transcript", 502);

  return Response.json(
    { text },
    {
      headers: {
        "Cache-Control": "no-store",
        "x-rate-limit-max": String(RATE_LIMIT_MAX),
        "x-rate-limit-window": String(RATE_LIMIT_WINDOW_SECONDS),
      },
    },
  );
}
