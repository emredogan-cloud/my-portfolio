"use client";

import {
  useState,
  useRef,
  useEffect,
  useMemo,
  type FormEvent,
} from "react";
import { motion, AnimatePresence } from "motion/react";
import { useChat } from "@ai-sdk/react";
import {
  DefaultChatTransport,
  isToolUIPart,
  getToolName,
  type UIMessagePart,
  type UIDataTypes,
  type UITools,
} from "ai";
import { X, ArrowUp, Copy, Check, RotateCcw, Loader2 } from "lucide-react";
import { LuminaAvatar } from "./LuminaAvatar.js";
import type { LuminaWindowProps } from "./types.js";

const EASE = [0.22, 1, 0.36, 1] as const;
const DEFAULT_BRAND = "#00d2ff";
const DEFAULT_API = "/api/chat";

const DEFAULT_WELCOME = [
  "Welcome.",
  "I am Lumina, your intelligent guide.",
  "Ask me anything.",
] as const;

const T_MSG_1 = 300;
const T_MSG_2 = 900;
const T_MSG_3 = 1500;
const T_READY = 2000;
const T_FAILSAFE = 2500;
/* Absolute defense — third-layer unlock that fires regardless of the
   welcome sequence's state. Even if everything else breaks, the input
   becomes usable within ~3s of mount. */
const T_ABSOLUTE_UNLOCK = 3000;

const DEFAULT_CONVERSATION_KEY = "lumina-conversation-v1";

/**
 * LuminaWindow — the chat panel itself.
 *
 * Most consumers want to mount `<LuminaChat />` (the orchestrator)
 * instead of this. The window is exported for advanced cases:
 * embedding the panel inline rather than as a fixed overlay, or
 * combining it with a custom trigger.
 *
 * Persistence:
 *   - Conversation persists across page reload via sessionStorage
 *     (key configurable; pass empty string to disable).
 *
 * Reliability invariants carried over from the original
 * implementation:
 *   - Window never unmounts; visibility is purely motion-driven, so
 *     the input can't lose focus on every animation cycle.
 *   - Welcome sequence has THREE independent unlock layers — t=2s,
 *     t=2.5s failsafe, t=3s absolute defense — so the input is
 *     guaranteed usable within 3 seconds even if React Strict Mode
 *     re-runs effects.
 *   - On stream error, status normalizes back to "ready" and the
 *     input unlocks.
 */
export function LuminaWindow(props: LuminaWindowProps) {
  const {
    isOpen,
    onClose,
    hasBeenMinimized,
    welcomeMessages = DEFAULT_WELCOME,
    assistantName = "Lumina",
    placeholder = "Ask Lumina anything...",
    toolLabels = {},
    theme,
    persistence,
    transport,
  } = props;

  const brand = theme?.brandColor ?? DEFAULT_BRAND;
  const apiEndpoint = transport?.apiEndpoint ?? DEFAULT_API;
  const conversationKey =
    persistence?.conversationKey ?? DEFAULT_CONVERSATION_KEY;
  const persistConversation = conversationKey.length > 0;

  const [input, setInput] = useState("");
  const [isReady, setIsReady] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const sequenceFiredRef = useRef(false);

  /* Stable transport. The bodyExtras callback is read on every send
     via a ref so consumers can update it (e.g. rotating sessionId)
     without triggering a transport rebuild. */
  const bodyExtrasRef = useRef(transport?.bodyExtras);
  useEffect(() => {
    bodyExtrasRef.current = transport?.bodyExtras;
  }, [transport?.bodyExtras]);

  const chatTransport = useMemo(
    () =>
      new DefaultChatTransport({
        api: apiEndpoint,
        body: () => bodyExtrasRef.current?.() ?? {},
      }),
    [apiEndpoint],
  );

  const { messages, setMessages, sendMessage, status, error } = useChat({
    transport: chatTransport,
  });

  const isLoading =
    (status === "submitted" || status === "streaming") && !error;
  const isOnboarding = !isReady && !hasBeenMinimized;
  const inputDisabled = isLoading || isOnboarding;

  /* Copy-to-clipboard affordance. Silent on browsers without
     navigator.clipboard (insecure contexts) — no error UX needed. */
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

  /* "New conversation" — wipes the message array and clears
     persistence. The welcome sequence does NOT replay because
     sequenceFiredRef has already latched true. */
  const handleNewConversation = () => {
    setMessages([]);
    if (persistConversation) {
      try {
        sessionStorage.removeItem(conversationKey);
      } catch {
        /* ignore */
      }
    }
    inputRef.current?.focus();
  };

  /* hasBeenMinimized rehydration — skip onboarding on subsequent opens. */
  useEffect(() => {
    if (hasBeenMinimized && !sequenceFiredRef.current) {
      sequenceFiredRef.current = true;
      setIsReady(true);
    }
  }, [hasBeenMinimized]);

  /* Absolute input unlock — third-layer defense. */
  useEffect(() => {
    const t = setTimeout(() => setIsReady(true), T_ABSOLUTE_UNLOCK);
    return () => clearTimeout(t);
  }, []);

  /* Conversation hydration — runs before the welcome sequence so the
     welcome effect sees sequenceFiredRef.current === true and bails. */
  useEffect(() => {
    if (!persistConversation) return;
    try {
      const saved = sessionStorage.getItem(conversationKey);
      if (!saved) return;
      const parsed = JSON.parse(saved);
      if (!Array.isArray(parsed) || parsed.length === 0) return;
      sequenceFiredRef.current = true;
      setIsReady(true);
      setMessages(parsed);
    } catch {
      /* corrupt payload — ignore */
    }
  }, [conversationKey, persistConversation, setMessages]);

  /* Persist conversation on every change. Skipped on the empty
     initial state so a freshly cleared "New conversation" doesn't
     immediately re-seed sessionStorage. */
  useEffect(() => {
    if (!persistConversation) return;
    if (messages.length === 0) return;
    try {
      sessionStorage.setItem(conversationKey, JSON.stringify(messages));
    } catch {
      /* quota or unavailable — non-fatal */
    }
  }, [conversationKey, messages, persistConversation]);

  /* Welcome sequence — fires once. NO cleanup that clears timeouts. */
  useEffect(() => {
    if (!isOpen) return;
    if (sequenceFiredRef.current) return;
    if (welcomeMessages.length === 0) {
      sequenceFiredRef.current = true;
      setIsReady(true);
      return;
    }
    sequenceFiredRef.current = true;

    const cadence = [T_MSG_1, T_MSG_2, T_MSG_3];
    welcomeMessages.forEach((text, i) => {
      const delay = cadence[i] ?? cadence[cadence.length - 1]! + (i - 2) * 600;
      setTimeout(() => {
        setMessages((prev) => [
          ...prev,
          {
            id: `lumina-welcome-${i}`,
            role: "assistant",
            parts: [{ type: "text", text }],
          },
        ]);
      }, delay);
    });

    setTimeout(() => setIsReady(true), T_READY);
    setTimeout(() => setIsReady(true), T_FAILSAFE);
  }, [isOpen, setMessages, welcomeMessages]);

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

  /* Position swap — centered uses inset-0 m-auto so motion's animated
     y/scale don't stomp the centering offset. */
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
      aria-label={assistantName}
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
      {/* Floating Neural Core — half-overlaps the window's top edge */}
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
        <LuminaAvatar theme={theme} />
      </motion.div>

      {/* Visible window box. Solid-ish dark panel, NO backdrop-filter
          (which was the primary cause of UI lag in early prototypes
          — backdrop-filter is per-frame paint across every contained
          pixel). A 95% opaque background carries the visual weight. */}
      <div
        className="absolute inset-0 flex flex-col rounded-2xl border border-white/[0.10] overflow-hidden"
        style={{
          backgroundColor: "rgba(10,10,10,0.95)",
          boxShadow:
            "0 32px 80px -22px rgba(0,0,0,0.75), 0 0 0 1px rgba(255,255,255,0.02), inset 0 1px 0 rgba(255,255,255,0.06)",
        }}
      >
        <header className="flex items-center justify-between px-5 py-3.5">
          <div className="flex items-baseline gap-2.5">
            <span className="text-sm font-semibold text-white tracking-tight">
              {assistantName}
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
              aria-label={`Minimize ${assistantName}`}
              title="Minimize"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* Messages — top padding clears the avatar's lower half. */}
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

              const toolParts = message.parts.filter(isToolUIPart);
              const isUser = message.role === "user";
              if (isUser && !text) return null;
              if (!isUser && !text && toolParts.length === 0) return null;

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
                    <div className="max-w-[78%] px-4 py-2.5 rounded-xl bg-white/[0.10] text-sm text-white/95 leading-relaxed whitespace-pre-line">
                      {text}
                    </div>
                  ) : (
                    <div className="group max-w-[88%] space-y-2">
                      {toolParts.map((part) => (
                        <ToolStatusPill
                          key={part.toolCallId}
                          part={part}
                          labels={toolLabels}
                          brand={brand}
                        />
                      ))}
                      {text && (
                        <div className="text-sm text-white/90 leading-[1.7] whitespace-pre-line">
                          {text}
                        </div>
                      )}
                      {text && (
                        <button
                          type="button"
                          onClick={() => handleCopy(message.id, text)}
                          className="mt-1.5 inline-flex items-center gap-1 text-[11px] text-white/30 hover:text-white/70 transition-colors opacity-40 group-hover:opacity-100 focus:opacity-100"
                          aria-label={
                            copiedId === message.id ? "Copied" : "Copy message"
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
                      )}
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
                <span className="w-1 h-1 rounded-full bg-white/40 lumina-terminal-cursor-blink" />
                <span
                  className="w-1 h-1 rounded-full bg-white/40 lumina-terminal-cursor-blink"
                  style={{ animationDelay: "0.25s" }}
                />
                <span
                  className="w-1 h-1 rounded-full bg-white/40 lumina-terminal-cursor-blink"
                  style={{ animationDelay: "0.5s" }}
                />
              </span>
            </motion.div>
          )}

          {error && (
            <div className="px-3 py-2 rounded-lg bg-red-500/[0.08] border border-red-500/20 text-xs text-red-300/90">
              {error.message}
            </div>
          )}
        </div>

        {/* Input — full-width, constant cyan glow */}
        <form
          onSubmit={handleSubmit}
          className="border-t border-white/[0.07] p-4 flex items-center gap-2.5"
        >
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={isOnboarding ? "" : placeholder}
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

/* ── Tool-call status pill ───────────────────────────────────────── */

type ToolPart = Extract<
  UIMessagePart<UIDataTypes, UITools>,
  { type: `tool-${string}` } | { type: "dynamic-tool" }
>;

interface ToolStatusPillProps {
  part: ToolPart;
  labels: Readonly<Record<string, string>>;
  brand: string;
}

function ToolStatusPill({ part, labels, brand }: ToolStatusPillProps) {
  const name = String(getToolName(part));
  const label =
    labels[name] ??
    name
      .replace(/([A-Z])/g, " $1")
      .trim()
      .toLowerCase();
  const state = part.state;

  const inFlight =
    state === "input-streaming" || state === "input-available";
  const done = state === "output-available";
  const errored = state === "output-error";

  const rgb = hexToRgb(brand) ?? "0,210,255";

  if (inFlight) {
    return (
      <div
        className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-mono uppercase tracking-[0.16em]"
        style={{
          border: `1px solid rgba(${rgb},0.15)`,
          backgroundColor: `rgba(${rgb},0.06)`,
          color: `rgba(${rgb},0.85)`,
        }}
      >
        <Loader2 className="w-3 h-3 animate-spin" aria-hidden="true" />
        <span>{label}…</span>
      </div>
    );
  }
  if (done) {
    return (
      <div className="inline-flex items-center gap-1.5 rounded-full border border-white/[0.06] bg-white/[0.02] px-2.5 py-1 text-[10px] font-mono uppercase tracking-[0.16em] text-white/35">
        <Check className="w-3 h-3" aria-hidden="true" />
        <span>{label}</span>
      </div>
    );
  }
  if (errored) {
    return (
      <div className="inline-flex items-center gap-1.5 rounded-full border border-amber-400/20 bg-amber-400/[0.06] px-2.5 py-1 text-[10px] font-mono uppercase tracking-[0.16em] text-amber-200/85">
        <span>{label} failed</span>
      </div>
    );
  }
  return null;
}

function hexToRgb(hex: string): string | null {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m || !m[1]) return null;
  const v = m[1];
  const r = parseInt(v.slice(0, 2), 16);
  const g = parseInt(v.slice(2, 4), 16);
  const b = parseInt(v.slice(4, 6), 16);
  return `${r},${g},${b}`;
}
