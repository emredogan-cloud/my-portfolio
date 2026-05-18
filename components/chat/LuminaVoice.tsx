"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import {
  Mic,
  Square,
  Loader2,
  AudioLines,
  MicOff,
  Volume2,
  VolumeX,
} from "lucide-react";

/**
 * LuminaVoice — the mic button that sits next to the Send button.
 *
 * Pipeline:
 *   tap mic → MediaRecorder captures WebM/Opus
 *      ↓
 *   tap again (or auto-stop after silence)
 *      ↓
 *   POST /api/voice/transcribe (multipart) → Whisper → { text }
 *      ↓
 *   onTranscript(text) — parent injects via useChat.sendMessage
 *      ↓
 *   parent passes the next completed assistant turn back via ttsTrigger
 *      ↓
 *   POST /api/voice/tts (json) → ElevenLabs → audio/mpeg stream
 *      ↓
 *   <audio> plays it
 *
 * Two latch modes coexist (Sub-PR 3.4):
 *   - One-shot latch (default): the moment the visitor speaks, the
 *     very next assistant turn is spoken aloud. Subsequent typed
 *     messages reset the latch, so visitors can interleave voice +
 *     text without surprise TTS.
 *   - Persistent voice mode: a visitor can toggle the Volume2 button
 *     to lock TTS on. Every subsequent assistant turn is spoken
 *     aloud regardless of input modality, until the visitor
 *     toggles it off. State lives in component memory only — not
 *     localStorage — so closing the chat window resets to off,
 *     keeping the affordance quiet and operator-grade.
 *
 * Reduced motion: the recording pulse and waveform shimmer collapse
 * via useReducedMotion; the static icon and status text remain so
 * the affordance is still legible.
 */

type Status =
  | "idle"
  | "starting"
  | "recording"
  | "transcribing"
  | "speaking"
  | "error";

type ErrorCode =
  | "mic-permission"
  | "voice-offline"
  | "rate-limited"
  | "transcribe-failed"
  | "transcribe-network"
  | "tts-network";

const ERROR_LABEL: Record<ErrorCode, string> = {
  "mic-permission": "Mic access blocked",
  "voice-offline": "Voice mode offline",
  "rate-limited": "Hourly limit reached",
  "transcribe-failed": "Couldn't transcribe",
  "transcribe-network": "Network blip",
  "tts-network": "Voice playback failed",
};

interface Props {
  /** Called with the visitor's transcribed words. Parent feeds this
   *  into useChat.sendMessage. */
  onTranscript: (text: string) => void;

  /** Disable the mic button while Lumina is mid-stream or onboarding. */
  disabled?: boolean;

  /** When set, plays the given text as Lumina's voice IF the visitor
   *  most recently used voice input. Parent updates this whenever an
   *  assistant turn finishes; component dedupes by `id`. */
  ttsTrigger?: { id: string; text: string } | null;
}

function pickRecorderMimeType(): string | undefined {
  // Prefer Opus (smallest + Whisper-friendly). Fall back to whatever
  // the browser supports. Safari historically uses MP4 but the file
  // is still acceptable to Whisper.
  const candidates = [
    "audio/webm;codecs=opus",
    "audio/webm",
    "audio/mp4",
    "audio/ogg",
  ];
  if (typeof MediaRecorder === "undefined") return undefined;
  for (const c of candidates) {
    try {
      if (MediaRecorder.isTypeSupported(c)) return c;
    } catch {
      /* old browsers throw on isTypeSupported — ignore */
    }
  }
  return undefined;
}

export default function LuminaVoice({
  onTranscript,
  disabled,
  ttsTrigger,
}: Props) {
  const [status, setStatus] = useState<Status>("idle");
  const [errorCode, setErrorCode] = useState<ErrorCode | null>(null);

  /** Sticky TTS-on toggle (Sub-PR 3.4). When true, every assistant
   *  turn is spoken aloud regardless of input modality. Tapped on,
   *  tapped off — no localStorage, no cross-session memory; quiet
   *  by design. */
  const [persistentVoice, setPersistentVoice] = useState(false);

  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  /** True between "visitor finishes speaking" and "Lumina's next
   *  assistant message is spoken aloud". One-shot latch — typing a
   *  text reply between turns clears it. Bypassed entirely when
   *  persistentVoice is true. */
  const voiceLatchRef = useRef(false);

  /** Dedupe TTS playback: each assistant message id is consumed once. */
  const lastPlayedIdRef = useRef<string | null>(null);

  const prefersReducedMotion = useReducedMotion();

  /* Cleanup on unmount — stop recorder, release mic, abort audio. */
  useEffect(() => {
    return () => {
      stopRecorder();
      if (audioRef.current) {
        try {
          audioRef.current.pause();
          audioRef.current.src = "";
        } catch {
          /* ignore */
        }
        audioRef.current = null;
      }
    };
  }, []);

  /* Auto-clear error after 4s so the affordance returns to idle. */
  useEffect(() => {
    if (status !== "error") return;
    const t = setTimeout(() => {
      setStatus("idle");
      setErrorCode(null);
    }, 4000);
    return () => clearTimeout(t);
  }, [status]);

  /* TTS trigger — plays the next assistant turn when either:
       (a) voice was the most recent input modality (one-shot latch),
           OR
       (b) persistent voice mode is toggled on (sticky).
     The lastPlayedIdRef guard dedupes so toggling persistent on
     mid-conversation doesn't replay the previous turn. */
  useEffect(() => {
    if (!ttsTrigger) return;
    const shouldPlay = voiceLatchRef.current || persistentVoice;
    if (!shouldPlay) return;
    if (lastPlayedIdRef.current === ttsTrigger.id) return;
    lastPlayedIdRef.current = ttsTrigger.id;
    /* Only the one-shot latch is consumed; persistent stays sticky. */
    if (!persistentVoice) voiceLatchRef.current = false;
    void playTts(ttsTrigger.text);
  }, [ttsTrigger, persistentVoice]);

  function stopRecorder() {
    const r = recorderRef.current;
    if (r && r.state === "recording") {
      try {
        r.stop();
      } catch {
        /* ignore */
      }
    }
    recorderRef.current = null;
    const s = streamRef.current;
    if (s) {
      s.getTracks().forEach((t) => {
        try {
          t.stop();
        } catch {
          /* ignore */
        }
      });
      streamRef.current = null;
    }
  }

  async function startRecording() {
    setErrorCode(null);
    setStatus("starting");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const mimeType = pickRecorderMimeType();
      const recorder = mimeType
        ? new MediaRecorder(stream, { mimeType })
        : new MediaRecorder(stream);
      chunksRef.current = [];
      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.onstop = () => {
        void handleTranscribe();
      };
      recorder.onerror = () => {
        stopRecorder();
        setStatus("error");
        setErrorCode("transcribe-failed");
      };
      recorder.start();
      recorderRef.current = recorder;
      setStatus("recording");
    } catch {
      stopRecorder();
      setStatus("error");
      setErrorCode("mic-permission");
    }
  }

  async function handleTranscribe() {
    setStatus("transcribing");
    const blob = new Blob(chunksRef.current, {
      type: chunksRef.current[0]?.type ?? "audio/webm",
    });
    chunksRef.current = [];
    stopRecorder(); // release mic immediately
    if (blob.size === 0) {
      setStatus("idle");
      return;
    }

    const form = new FormData();
    form.append("file", blob, "speech.webm");

    let res: Response;
    try {
      res = await fetch("/api/voice/transcribe", {
        method: "POST",
        body: form,
      });
    } catch {
      setStatus("error");
      setErrorCode("transcribe-network");
      return;
    }

    if (!res.ok) {
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      const err = data.error ?? "transcribe-failed";
      setStatus("error");
      setErrorCode(
        err === "voice-offline" || err === "rate-limited"
          ? (err as ErrorCode)
          : "transcribe-failed",
      );
      return;
    }

    const data = (await res.json().catch(() => ({}))) as { text?: string };
    const text = (data.text ?? "").trim();
    if (!text) {
      setStatus("idle");
      return;
    }
    voiceLatchRef.current = true;
    setStatus("idle");
    onTranscript(text);
  }

  async function playTts(text: string) {
    if (!text) return;
    setStatus("speaking");
    let res: Response;
    try {
      res = await fetch("/api/voice/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: text.slice(0, 500) }),
      });
    } catch {
      setStatus("idle"); // TTS failure is non-fatal — text is already on screen
      return;
    }
    if (!res.ok) {
      setStatus("idle");
      return;
    }
    let blob: Blob;
    try {
      blob = await res.blob();
    } catch {
      setStatus("idle");
      return;
    }

    const url = URL.createObjectURL(blob);
    if (audioRef.current) {
      try {
        audioRef.current.pause();
      } catch {
        /* ignore */
      }
    }
    const audio = new Audio(url);
    audioRef.current = audio;
    const cleanup = () => {
      URL.revokeObjectURL(url);
      if (audioRef.current === audio) {
        audioRef.current = null;
      }
      setStatus("idle");
    };
    audio.addEventListener("ended", cleanup, { once: true });
    audio.addEventListener("error", cleanup, { once: true });
    try {
      await audio.play();
    } catch {
      cleanup();
    }
  }

  function handleClick() {
    if (disabled) return;
    if (status === "starting" || status === "transcribing") return;
    if (status === "speaking") {
      // Tap during playback → cancel.
      if (audioRef.current) {
        try {
          audioRef.current.pause();
        } catch {
          /* ignore */
        }
      }
      setStatus("idle");
      return;
    }
    if (status === "recording") {
      // Stop recorder → onstop fires → handleTranscribe runs.
      const r = recorderRef.current;
      if (r && r.state === "recording") {
        try {
          r.stop();
        } catch {
          /* ignore */
        }
      }
      return;
    }
    // idle / error → start recording.
    void startRecording();
  }

  /* Sticky-TTS toggle handler (Sub-PR 3.4). Disabling mid-playback
     also stops the current TTS — the visitor's intent is clearly
     "be quiet now". */
  function handlePersistentToggle() {
    if (disabled) return;
    setPersistentVoice((prev) => {
      const next = !prev;
      if (!next && audioRef.current) {
        try {
          audioRef.current.pause();
        } catch {
          /* ignore */
        }
      }
      return next;
    });
  }

  /* ── Rendering ───────────────────────────────────────────────── */

  const isRecording = status === "recording";
  const isStarting = status === "starting";
  const isTranscribing = status === "transcribing";
  const isSpeaking = status === "speaking";
  const isError = status === "error";

  const labelByStatus: Record<Status, string> = {
    idle: "Speak to Lumina",
    starting: "Requesting mic…",
    recording: "Recording — tap to stop",
    transcribing: "Transcribing…",
    speaking: "Lumina is speaking — tap to cancel",
    error: errorCode ? ERROR_LABEL[errorCode] : "Voice error",
  };

  const persistentLabel = persistentVoice
    ? "Voice mode on — tap to disable"
    : "Read responses aloud";

  return (
    /* Fragment so the parent form's flex `gap-*` spaces the two
       buttons identically to the existing input ↔ mic ↔ send rhythm.
       Wrapping in a div would have introduced an extra gap step. */
    <>
      <button
        type="button"
        onClick={handlePersistentToggle}
        disabled={disabled}
        aria-pressed={persistentVoice}
        aria-label={persistentLabel}
        title={persistentLabel}
        className={[
          "shrink-0 w-10 h-10 inline-flex items-center justify-center rounded-xl transition-colors duration-200",
          persistentVoice
            ? "bg-[#00d2ff]/15 text-[#00d2ff] hover:bg-[#00d2ff]/25"
            : "bg-white/[0.06] text-white/65 hover:bg-white/[0.10] hover:text-white",
          "disabled:opacity-40 disabled:cursor-not-allowed",
        ].join(" ")}
      >
        {persistentVoice ? (
          <Volume2 className="w-4 h-4" aria-hidden="true" />
        ) : (
          <VolumeX className="w-4 h-4" aria-hidden="true" />
        )}
      </button>
      <button
        type="button"
        onClick={handleClick}
        disabled={disabled || isStarting || isTranscribing}
        aria-label={labelByStatus[status]}
        title={labelByStatus[status]}
        className={[
          "relative shrink-0 w-10 h-10 inline-flex items-center justify-center rounded-xl transition-colors duration-200",
          isRecording
            ? "bg-red-500/15 text-red-300 hover:bg-red-500/25"
            : isSpeaking
              ? "bg-[#00d2ff]/15 text-[#00d2ff] hover:bg-[#00d2ff]/25"
              : isError
                ? "bg-amber-400/15 text-amber-300"
                : "bg-white/[0.06] text-white/65 hover:bg-white/[0.10] hover:text-white",
          "disabled:opacity-40 disabled:cursor-not-allowed",
        ].join(" ")}
      >
        {isStarting || isTranscribing ? (
          <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
        ) : isRecording ? (
          <RecordingDot reducedMotion={!!prefersReducedMotion} />
        ) : isSpeaking ? (
          <SpeakingIcon reducedMotion={!!prefersReducedMotion} />
        ) : isError ? (
          <MicOff className="w-4 h-4" aria-hidden="true" />
        ) : (
          <Mic className="w-4 h-4" aria-hidden="true" />
        )}
      </button>
    </>
  );
}

/* ── Subcomponents — recording dot + speaking waveform ───────────── */

function RecordingDot({ reducedMotion }: { reducedMotion: boolean }) {
  if (reducedMotion) {
    return <Square className="w-3 h-3 fill-current" aria-hidden="true" />;
  }
  return (
    <motion.span
      className="block w-3 h-3 rounded-sm bg-red-400"
      animate={{ opacity: [1, 0.5, 1], scale: [1, 0.85, 1] }}
      transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
      aria-hidden="true"
    />
  );
}

function SpeakingIcon({ reducedMotion }: { reducedMotion: boolean }) {
  if (reducedMotion) {
    return <AudioLines className="w-4 h-4" aria-hidden="true" />;
  }
  return (
    <motion.span
      animate={{ opacity: [1, 0.55, 1] }}
      transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
      className="inline-flex"
      aria-hidden="true"
    >
      <AudioLines className="w-4 h-4" />
    </motion.span>
  );
}
