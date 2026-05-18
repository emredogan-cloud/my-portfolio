import { writeFile, mkdir, stat } from "node:fs/promises";
import { join } from "node:path";
import type { Note } from "@/data/notes";

/**
 * Notes 2.0 — long-form audio TTS pipeline.
 *
 * V4 Phase 2 — Sub-PR 2.5.
 *
 * Generates an MP3 rendition of each note's body via ElevenLabs
 * and writes it to `public/notes/audio/<slug>.mp3` so the
 * `/notes/[slug]` page can serve it as a static asset (no
 * per-request TTS cost, no streaming bottleneck on the visitor's
 * side).
 *
 * Why a separate ElevenLabs call (not `/api/voice/tts`):
 *   - `/api/voice/tts` (V3) is the Lumina voice-mode wrapper —
 *     it caps text at 500 chars to keep the < 800ms first-token
 *     budget realistic. Notes are 1500-3000 chars; they need
 *     the long-form TTS endpoint.
 *   - Notes audio is a build-time / weekly-cron artifact, not a
 *     real-time visitor stream. Different cost discipline —
 *     generate once, serve forever from `/public/`.
 *
 * Graceful no-op contract:
 *   - `ELEVENLABS_API_KEY` missing → `generateAudioForNote()`
 *     returns `{ status: "skipped", reason: "no-key" }` without
 *     throwing. Cron handler surfaces this in the JSON
 *     response.
 *   - File already exists + `force=false` → `{ status:
 *     "skipped", reason: "already-exists" }`. Letting the cron
 *     run unconditionally without regenerating every file is the
 *     normal weekly cadence.
 */

/* ElevenLabs config — mirrored from /api/voice/tts but separate
 * constants so the long-form pipeline can drift independently
 * (different voice, different model, different bitrate). */
const ELEVENLABS_API_BASE = "https://api.elevenlabs.io/v1";
const ELEVENLABS_MODEL = "eleven_multilingual_v2"; // higher quality, not flash — notes aren't real-time
const DEFAULT_VOICE_ID = "21m00Tcm4TlvDq8ikWAM"; // Rachel — matches the Lumina voice
const OUTPUT_FORMAT = "mp3_44100_128"; // 128 kbps mp3
const PUBLIC_AUDIO_DIR = "public/notes/audio";
const MAX_TEXT_LENGTH = 4500; // ElevenLabs free-tier per-request limit is 5000 chars

const hasElevenLabs = Boolean(process.env.ELEVENLABS_API_KEY);

export type GenerateAudioResult =
  | { status: "generated"; path: string; bytes: number }
  | { status: "skipped"; reason: "no-key" | "already-exists" | "text-empty" }
  | { status: "error"; reason: string };

/**
 * Strip Markdown to plain text. The ElevenLabs model reads what
 * it's given verbatim — code fences, list markers, and `**bold**`
 * tokens would all be voiced as nonsense. We collapse them into
 * the underlying prose.
 *
 * Lightweight, intentional: not a full Markdown parser. Handles
 * the constructs the existing 3 notes actually use (paragraphs,
 * **bold**, ordered lists, horizontal rules).
 */
export function noteBodyToSpeech(markdown: string): string {
  return markdown
    .replace(/^---+$/gm, "") // horizontal rules → silence
    .replace(/^\d+\.\s+/gm, "") // ordered list markers → drop
    .replace(/^[-*]\s+/gm, "") // unordered list markers → drop
    .replace(/\*\*([^*]+)\*\*/g, "$1") // bold → drop emphasis
    .replace(/\*([^*]+)\*/g, "$1") // italic → drop emphasis
    .replace(/`([^`]+)`/g, "$1") // inline code → spoken plain
    .replace(/\n{3,}/g, "\n\n") // collapse excess blank lines
    .trim();
}

/**
 * Generate audio for a single note. Idempotent — when the target
 * file already exists, returns "already-exists" without calling
 * ElevenLabs. Pass `force: true` to override (for regenerations).
 */
export async function generateAudioForNote(
  note: Note,
  options: { voiceId?: string; force?: boolean } = {},
): Promise<GenerateAudioResult> {
  if (!hasElevenLabs) {
    return { status: "skipped", reason: "no-key" };
  }
  const text = noteBodyToSpeech(note.body);
  if (text.length === 0) {
    return { status: "skipped", reason: "text-empty" };
  }

  await mkdir(PUBLIC_AUDIO_DIR, { recursive: true });
  const outPath = join(PUBLIC_AUDIO_DIR, `${note.slug}.mp3`);

  if (!options.force) {
    try {
      const existing = await stat(outPath);
      if (existing.size > 0) {
        return { status: "skipped", reason: "already-exists" };
      }
    } catch {
      /* file doesn't exist — fall through to generate */
    }
  }

  /* Hard text cap. The free tier rejects anything past 5000 chars
   * with a 422; we cap at 4500 with a graceful trailing ellipsis
   * so the model never sees the truncation seam. */
  const safeText =
    text.length > MAX_TEXT_LENGTH
      ? text.slice(0, MAX_TEXT_LENGTH - 1) + "…"
      : text;

  const voiceId = options.voiceId ?? DEFAULT_VOICE_ID;
  const url = `${ELEVENLABS_API_BASE}/text-to-speech/${voiceId}?output_format=${OUTPUT_FORMAT}`;

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "xi-api-key": process.env.ELEVENLABS_API_KEY ?? "",
        "Content-Type": "application/json",
        Accept: "audio/mpeg",
      },
      body: JSON.stringify({
        text: safeText,
        model_id: ELEVENLABS_MODEL,
        /* Default voice settings — stable, natural cadence. Notes
         * are observational prose, not dramatic narration. */
        voice_settings: {
          stability: 0.55,
          similarity_boost: 0.75,
          style: 0.0,
          use_speaker_boost: true,
        },
      }),
    });
    if (!res.ok) {
      return {
        status: "error",
        reason: `elevenlabs-${res.status}`,
      };
    }
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.length === 0) {
      return { status: "error", reason: "empty-response" };
    }
    await writeFile(outPath, buf);
    return { status: "generated", path: outPath, bytes: buf.length };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "unknown";
    return { status: "error", reason: `fetch-failed:${msg}` };
  }
}
