"use client";

import { useState, useRef, useEffect, type FormEvent } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useChat } from "@ai-sdk/react";
import { X, ArrowUp, Copy, Check, RotateCcw } from "lucide-react";
import { LuminaAvatar } from "./LuminaAvatar";

const EASE = [0.22, 1, 0.36, 1] as const;

const WELCOME = [
  { id: "lumina-w-1", text: "Welcome to Emre Doğan's workspace." },
  { id: "lumina-w-2", text: "I am Lumina, your intelligent guide." },
  {
    id: "lumina-w-3",
    text: "Ask me anything about his architecture, SaaS systems, or mobile applications.",
  },
] as const;

const T_MSG_1 = 300;
const T_MSG_2 = 900;
const T_MSG_3 = 1500;
/* Unlock ~500ms after message 3 lands. Tight cinematic anticipation,
   visitor can type within 2 seconds of Lumina opening. */
const T_READY = 2000;
const T_FAILSAFE = 2500;
/* Absolute defense — independent timer in its own effect. Final safety
   net even if the welcome sequence breaks entirely. */
const T_ABSOLUTE_UNLOCK = 3000;

interface Props {
  isOpen: boolean;
  onClose: () => void;
  hasBeenMinimized: boolean;
}

/**
 * LuminaWindow — Neural Core console.
 *
 * Structure:
 *   <motion.div>                  ← positioning + open/close transform
 *     <motion.div> (avatar)       ← absolute, -top-20, floats ABOVE
 *     <div> (visible window box)  ← absolute inset-0, the glass card
 *       <header>
 *       <messages>
 *       <input>
 *
 * The avatar is structurally outside the visible window box but inside
 * the motion wrapper, so it moves in lockstep with the window during
 * centered ↔ bottom-right transitions and during open/close transforms.
 *
 * Persistence & reliability (carried from Phase 2.1):
 *   - Window never unmounts; visibility is motion-driven.
 *   - Sequence gate is a useRef so flipping it doesn't re-trigger the effect.
 *   - No cleanup that clears welcome timeouts.
 *   - Input lock has a hard 5.5s failsafe.
 *   - isLoading flips false on error.
 */
export function LuminaWindow({ isOpen, onClose, hasBeenMinimized }: Props) {
  const [input, setInput] = useState("");
  const [isReady, setIsReady] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const sequenceFiredRef = useRef(false);

  const { messages, setMessages, sendMessage, status, error } = useChat();

  const isLoading =
    (status === "submitted" || status === "streaming") && !error;
  const isOnboarding = !isReady && !hasBeenMinimized;
  const inputDisabled = isLoading || isOnboarding;

  /* ── Conversation tools ──
     copiedId tracks the most recently copied message so its Copy icon
     can flash to Check for 2s before reverting. handleCopy is silent
     on older browsers / insecure contexts (no Clipboard API).
     handleNewConversation wipes the message array; the welcome
     sequence does NOT replay because sequenceFiredRef has already
     latched true — visitor gets a clean slate without re-onboarding. */
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopy = async (id: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      /* clipboard unavailable — silent no-op */
    }
  };

  const handleNewConversation = () => {
    setMessages([]);
    inputRef.current?.focus();
  };

  /* hasBeenMinimized rehydration — skip onboarding on subsequent opens. */
  useEffect(() => {
    if (hasBeenMinimized && !sequenceFiredRef.current) {
      sequenceFiredRef.current = true;
      setIsReady(true);
    }
  }, [hasBeenMinimized]);

  /* ABSOLUTE INPUT UNLOCK DEFENSE — third layer.
     Independent of the welcome sequence. Fires once on mount.
     Even if every other unlock path fails (Strict Mode dance, setMessages
     instability, dependency churn), this timer guarantees the input
     becomes usable within 6 seconds. */
  useEffect(() => {
    const t = setTimeout(() => setIsReady(true), T_ABSOLUTE_UNLOCK);
    return () => clearTimeout(t);
  }, []);

  /* Welcome sequence — fires once, NO cleanup that clears timeouts. */
  useEffect(() => {
    if (!isOpen) return;
    if (sequenceFiredRef.current) return;
    sequenceFiredRef.current = true;

    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        {
          id: WELCOME[0].id,
          role: "assistant",
          parts: [{ type: "text", text: WELCOME[0].text }],
        },
      ]);
    }, T_MSG_1);

    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        {
          id: WELCOME[1].id,
          role: "assistant",
          parts: [{ type: "text", text: WELCOME[1].text }],
        },
      ]);
    }, T_MSG_2);

    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        {
          id: WELCOME[2].id,
          role: "assistant",
          parts: [{ type: "text", text: WELCOME[2].text }],
        },
      ]);
    }, T_MSG_3);

    setTimeout(() => setIsReady(true), T_READY);
    setTimeout(() => setIsReady(true), T_FAILSAFE);
  }, [isOpen, setMessages]);

  /* Auto-scroll. */
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, status]);

  /* Focus input when ready. */
  useEffect(() => {
    if (isOpen && isReady) {
      const t = setTimeout(() => inputRef.current?.focus(), 250);
      return () => clearTimeout(t);
    }
  }, [isOpen, isReady]);

  /* ESC closes. */
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, onClose]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const text = input.trim();
    if (!text || inputDisabled) return;
    sendMessage({ text });
    setInput("");
  };

  /* Position swap. Centered uses `inset-0 m-auto` (no transforms) so
     motion's animated y/scale don't stomp the centering offset. */
  const positionClass = hasBeenMinimized
    ? "fixed bottom-24 right-6"
    : "fixed inset-0 m-auto";

  /* Centered = wide console; bottom-right = compact widget. */
  const sizeClass = hasBeenMinimized
    ? "w-[calc(100vw-2.5rem)] sm:w-[420px] h-[min(78vh,520px)] sm:h-[520px]"
    : "w-[calc(100vw-2.5rem)] sm:w-[640px] h-[min(75vh,560px)] sm:h-[560px]";

  const statusLabel = isOnboarding ? "Awakening" : "Online";

  return (
    <motion.div
      role="dialog"
      aria-label="Lumina"
      aria-hidden={!isOpen}
      className={`${positionClass} ${sizeClass} z-[60]`}
      initial={false}
      animate={{
        opacity: isOpen ? 1 : 0,
        y: isOpen ? 0 : 30,
        scale: isOpen ? 1 : 0.98,
      }}
      transition={{ duration: isOpen ? 0.55 : 0.45, ease: EASE }}
      style={{ pointerEvents: isOpen ? "auto" : "none" }}
    >
      {/* ── Floating Neural Core — HALF-OVERLAPS the window's top edge ──
          Positioning math: half of avatar height equals the negative top
          offset, so the avatar's vertical center sits exactly on the
          window's top edge. Mobile w-24 (96px) → -top-12 (-48px).
          Desktop w-32 (128px) → -top-16 (-64px). */}
      <motion.div
        className="absolute -top-12 sm:-top-16 left-1/2 -translate-x-1/2 z-10"
        initial={false}
        animate={{ opacity: isOpen ? 1 : 0 }}
        transition={{
          duration: isOpen ? 0.7 : 0.4,
          ease: EASE,
          delay: isOpen ? 0.15 : 0,
        }}
      >
        <LuminaAvatar />
      </motion.div>

      {/* ── Visible window box ──
          NO backdrop-filter. Solid-ish dark panel instead. The full-viewport
          blur on this and the overlay was the primary cause of UI lag —
          backdrop-filter is a per-frame paint operation across every pixel
          inside the element. A 92% opaque background gives the visual
          weight we want at zero GPU cost. */}
      <div
        className="absolute inset-0 flex flex-col rounded-2xl border border-white/[0.10] overflow-hidden"
        style={{
          backgroundColor: "rgba(10,10,10,0.95)",
          boxShadow:
            "0 32px 80px -22px rgba(0,0,0,0.75), 0 0 0 1px rgba(255,255,255,0.02), inset 0 1px 0 rgba(255,255,255,0.06)",
        }}
      >
        {/* Header — divider removed so the avatar's lower half doesn't
            visually cross a border line awkwardly. */}
        <header className="flex items-center justify-between px-5 py-3.5">
          <div className="flex items-baseline gap-2.5">
            <span className="text-sm font-semibold text-white tracking-tight">
              Lumina
            </span>
            <span className="text-[10px] uppercase tracking-[0.18em] text-white/30">
              {statusLabel}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleNewConversation}
              className="inline-flex items-center justify-center text-white/40 hover:text-white/85 transition-colors duration-200 p-2.5 rounded"
              aria-label="New conversation"
              title="New conversation"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="inline-flex items-center justify-center text-white/40 hover:text-white/85 transition-colors duration-200 p-2.5 rounded"
              aria-label="Minimize Lumina"
              title="Minimize"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* Messages — stacked, sequential reveals, strict L/R alignment.
            Top padding clears the avatar's lower half (which protrudes
            into the window by half its height). pt-12 mobile = 48px
            below window top; pt-16 desktop = 64px. */}
        <div
          ref={scrollRef}
          className="flex-1 overflow-y-auto px-5 pt-12 sm:pt-16 pb-5 space-y-4 scroll-smooth"
        >
          <AnimatePresence initial={false}>
            {messages.map((message) => {
              const text = message.parts
                .filter(
                  (p): p is { type: "text"; text: string } =>
                    p.type === "text",
                )
                .map((p) => p.text)
                .join("");

              if (!text) return null;

              const isUser = message.role === "user";

              return (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.55, ease: EASE }}
                  className={`flex ${isUser ? "justify-end" : "justify-start"}`}
                >
                  {isUser ? (
                    /* User: right, subtle bubble */
                    <div className="max-w-[78%] px-4 py-2.5 rounded-xl bg-white/[0.10] text-sm text-white/95 leading-relaxed whitespace-pre-line">
                      {text}
                    </div>
                  ) : (
                    /* Lumina: left, no bubble, crisp typography + Copy
                       button below. opacity-40 baseline keeps the
                       affordance discoverable; group-hover brings it
                       to full presence on desktop. */
                    <div className="group max-w-[88%]">
                      <div className="text-sm text-white/90 leading-[1.7] whitespace-pre-line">
                        {text}
                      </div>
                      <button
                        type="button"
                        onClick={() => handleCopy(message.id, text)}
                        className="mt-1.5 inline-flex items-center gap-1 text-[11px] text-white/30 hover:text-white/70 transition-colors opacity-40 group-hover:opacity-100 focus:opacity-100"
                        aria-label={
                          copiedId === message.id
                            ? "Copied"
                            : "Copy message"
                        }
                      >
                        {copiedId === message.id ? (
                          <>
                            <Check className="w-3 h-3" aria-hidden="true" />
                            <span>Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" aria-hidden="true" />
                            <span>Copy</span>
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </motion.div>
              );
            })}
          </AnimatePresence>

          {/* Streaming pending indicator */}
          {status === "submitted" && !error && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center gap-1.5 text-xs text-white/40 px-1"
            >
              <span className="inline-flex gap-1">
                <span className="w-1 h-1 rounded-full bg-white/40 terminal-cursor-blink" />
                <span
                  className="w-1 h-1 rounded-full bg-white/40 terminal-cursor-blink"
                  style={{ animationDelay: "0.25s" }}
                />
                <span
                  className="w-1 h-1 rounded-full bg-white/40 terminal-cursor-blink"
                  style={{ animationDelay: "0.5s" }}
                />
              </span>
            </motion.div>
          )}

          {/* Error */}
          {error && (
            <div className="px-3 py-2 rounded-lg bg-red-500/[0.08] border border-red-500/20 text-xs text-red-300/90">
              {error.message}
            </div>
          )}
        </div>

        {/* ── Neon input core — full-width, constant cyan glow ── */}
        <form
          onSubmit={handleSubmit}
          className="border-t border-white/[0.07] p-4 flex items-center gap-2.5"
        >
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={isOnboarding ? "" : "Ask Lumina anything..."}
            disabled={inputDisabled}
            autoComplete="off"
            className="lumina-input flex-1 rounded-xl px-4 py-3 text-sm text-white placeholder-white/30 disabled:opacity-50 disabled:cursor-not-allowed"
          />
          <button
            type="submit"
            disabled={!input.trim() || inputDisabled}
            className="shrink-0 w-10 h-10 inline-flex items-center justify-center rounded-xl bg-white text-black hover:bg-white/90 disabled:opacity-25 disabled:cursor-not-allowed transition-opacity"
            aria-label="Send message"
          >
            <ArrowUp className="w-4 h-4" />
          </button>
        </form>
      </div>
    </motion.div>
  );
}
