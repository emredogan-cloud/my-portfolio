import { kv } from "@vercel/kv";

/**
 * Voice Lumina — text-to-speech.
 *
 * Client POSTs { text } → we forward to ElevenLabs' streaming TTS
 * endpoint and pipe the audio/mpeg chunks straight back to the
 * browser. The browser's AudioContext appends each chunk as it
 * arrives, so first audio plays within the Phase 3 budget
 * (< 800ms first token target).
 *
 * Posture matches /api/voice/transcribe + /api/cwh-demo:
 *   - Edge runtime, plain fetch, no SDK.
 *   - Hard text-length cap so a giant paste can't run up the bill.
 *   - 20 req / IP / hour (more generous than transcribe — visitors
 *     often iterate with short prompts; each request is bounded by
 *     the text cap).
 *   - 503 when ELEVENLABS_API_KEY is missing; same outward signal
 *     for 401 / 403 from upstream so a bad key degrades cleanly.
 */

export const runtime = "edge";
export const maxDuration = 30;

const RATE_LIMIT_MAX = 20;
const RATE_LIMIT_WINDOW_SECONDS = 3600;
const MAX_TEXT_LENGTH = 500;

// eleven_flash_v2_5 is the lowest-latency tier (~75ms TTFT).
// eleven_turbo_v2_5 is a quality bump at higher TTFT. Flash is the
// only realistic choice for the < 800ms first-token budget.
const ELEVENLABS_MODEL = "eleven_flash_v2_5";

// Rachel — calm, neutral, refined. Matches the Lumina voice copy
// (no gendered pronouns) and is ElevenLabs' default "AI assistant"
// voice. Override per-deploy via ELEVENLABS_VOICE_ID without code change.
const DEFAULT_VOICE_ID = "21m00Tcm4TlvDq8ikWAM";

const OUTPUT_FORMAT = "mp3_44100_128"; // 128kbps mp3 — small enough to stream

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
  const key = `voice-tts:rl:${ip}`;
  const count = (await kv.incr(key)) as number;
  if (count === 1) await kv.expire(key, RATE_LIMIT_WINDOW_SECONDS);
  return count > RATE_LIMIT_MAX ? "blocked" : "ok";
}

export async function POST(req: Request) {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) return jsonError("voice-offline", 503);

  let body: { text?: unknown };
  try {
    body = (await req.json()) as { text?: unknown };
  } catch {
    return jsonError("invalid-json", 400);
  }

  const text = typeof body.text === "string" ? body.text.trim() : "";
  if (!text) return jsonError("empty-text", 400);
  if (text.length > MAX_TEXT_LENGTH) {
    return jsonError("text-too-long", 413, { limit_chars: MAX_TEXT_LENGTH });
  }

  const ip = getClientIp(req);
  if ((await consumeRateLimit(ip)) === "blocked") {
    return jsonError("rate-limited", 429, {
      limit: RATE_LIMIT_MAX,
      window_seconds: RATE_LIMIT_WINDOW_SECONDS,
    });
  }

  const voiceId = process.env.ELEVENLABS_VOICE_ID ?? DEFAULT_VOICE_ID;
  const url = `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}/stream?output_format=${OUTPUT_FORMAT}`;

  let upstream: Response;
  try {
    upstream = await fetch(url, {
      method: "POST",
      headers: {
        "xi-api-key": apiKey,
        "Content-Type": "application/json",
        Accept: "audio/mpeg",
      },
      body: JSON.stringify({
        text,
        model_id: ELEVENLABS_MODEL,
        // Stability ≈ Lumina's voice consistency turn-to-turn.
        // Similarity_boost preserves the voice's character.
        voice_settings: {
          stability: 0.45,
          similarity_boost: 0.7,
        },
      }),
    });
  } catch (err) {
    console.error(
      "[voice-tts] elevenlabs fetch failed:",
      err instanceof Error ? err.message : "unknown",
    );
    return jsonError("tts-unreachable", 502);
  }

  if (!upstream.ok) {
    const detail = await upstream.text().catch(() => "");
    console.error(
      "[voice-tts] elevenlabs non-2xx:",
      JSON.stringify({ status: upstream.status, detail: detail.slice(0, 200) }),
    );
    if (upstream.status === 401 || upstream.status === 403) {
      return jsonError("voice-offline", 503);
    }
    return jsonError("tts-error", 502, { status: upstream.status });
  }

  if (!upstream.body) return jsonError("no-audio-stream", 502);

  // Pipe the audio body straight through — Web Streams are passthrough
  // in Edge runtime, so the first chunk reaches the browser at upstream
  // TTFT plus ~Vercel-edge round-trip.
  return new Response(upstream.body, {
    headers: {
      "Content-Type": "audio/mpeg",
      "Cache-Control": "no-store",
      "x-rate-limit-max": String(RATE_LIMIT_MAX),
      "x-rate-limit-window": String(RATE_LIMIT_WINDOW_SECONDS),
    },
  });
}
