import { notesData } from "@/data/notes";
import {
  generateAudioForNote,
  type GenerateAudioResult,
} from "@/lib/notes-audio";
import { captureRouteError } from "@/lib/sentry";

/**
 * Weekly cron — regenerate-audio.
 *
 * V4 Phase 2 — Sub-PR 2.5.
 *
 * Walks `data/notes.ts`, skips any note without `formats.audio`
 * declared, and calls `generateAudioForNote` for each. Idempotent
 * — files that already exist are skipped (the cron is a *missing*
 * file generator, not a force-regenerate loop). To force a
 * regeneration after editing the note body, the dispatcher can
 * pass `?force=true` in the URL.
 *
 * Runtime: nodejs. ElevenLabs + filesystem writes both need Node
 * primitives (`@vercel/blob` would be the edge alternative, but
 * adding blob is a Phase 4 concern — the V4 doc § 5.2.5 specifies
 * writes to `public/notes/audio/` for v1).
 *
 * Auth: Bearer ${CRON_SECRET} — same posture as `/api/auto-tweet`.
 * The Vercel-managed cron, manual curl, and any future admin UI
 * all carry the same secret.
 */

export const runtime = "nodejs";
export const maxDuration = 60;

function unauthorized(): Response {
  return new Response(JSON.stringify({ error: "unauthorized" }), {
    status: 401,
    headers: { "Content-Type": "application/json" },
  });
}

function isAuthorized(req: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const header = req.headers.get("authorization") ?? "";
  return header === `Bearer ${secret}`;
}

interface PerNoteOutcome {
  slug: string;
  result: GenerateAudioResult;
}

export async function POST(req: Request) {
  if (!isAuthorized(req)) return unauthorized();

  const url = new URL(req.url);
  const force = url.searchParams.get("force") === "true";

  /* Only notes that declare formats.audio in data/notes.ts are
   * candidates. A note without that field is intentionally not
   * an audio note — skipping is correct, not a fallthrough. */
  const candidates = notesData.filter(
    (n) => n.formats?.audio !== undefined,
  );

  if (candidates.length === 0) {
    return Response.json(
      { ok: true, generated: 0, skipped: 0, errored: 0, outcomes: [] },
      { headers: { "Cache-Control": "no-store" } },
    );
  }

  const outcomes: PerNoteOutcome[] = [];
  let generated = 0;
  let skipped = 0;
  let errored = 0;

  /* Serial loop, not Promise.all. ElevenLabs free tier has
   * concurrent-call limits and processing each note takes a few
   * seconds — fanning out the four current notes won't save real
   * wall-clock time and risks tripping the upstream concurrency
   * gate. */
  for (const note of candidates) {
    let result: GenerateAudioResult;
    try {
      result = await generateAudioForNote(note, { force });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "unknown";
      result = { status: "error", reason: `caught:${msg}` };
      captureRouteError(err, {
        route: "/api/notes/regenerate-audio",
        tags: { note_slug: note.slug, phase: "generate" },
      });
    }
    outcomes.push({ slug: note.slug, result });
    if (result.status === "generated") generated += 1;
    else if (result.status === "skipped") skipped += 1;
    else errored += 1;
  }

  if (errored > 0) {
    console.warn(
      "[notes-audio] regeneration finished with errors:",
      JSON.stringify(
        outcomes.filter((o) => o.result.status === "error"),
      ),
    );
  }

  return Response.json(
    { ok: errored === 0, generated, skipped, errored, outcomes },
    { headers: { "Cache-Control": "no-store" } },
  );
}
