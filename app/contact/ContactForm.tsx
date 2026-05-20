"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ArrowRight, Check, AlertCircle } from "lucide-react";
import { cardSurface } from "@/lib/v6/glass";
import { sendContactEmail, type ContactResult } from "./actions";

const EASE = [0.22, 1, 0.36, 1] as const;

const INITIAL: ContactResult = { ok: false };

/* V6 Sub-PR 15.4 — visitor-driven intent classification.
   The V5 8.5 adaptive classifier inferred reading mode from session
   memory; 15.4 inverts that to a self-classification chip group so
   no inferred-intent copy ever ships ("we noticed…" was the explicit
   spec validation gate). 'default' is the unselected state — no chip
   is active and the lead paragraph carries the V5-style baseline
   framing. */
export type Intent = "default" | "role" | "engineering" | "other";

const INTENT_OPTIONS: ReadonlyArray<{ id: Intent; label: string }> = [
  { id: "role", label: "A role / opportunity" },
  { id: "engineering", label: "Engineering / Architecture" },
  { id: "other", label: "Other" },
];

interface Props {
  /** V6 path: current intent. Omit for V5 byte-identical rendering. */
  intent?: Intent;
  /** V6 path: callback fired when the visitor picks an intent chip.
   *  Presence of this prop is what flips the form into adaptive mode —
   *  the parent AdaptiveContactSection passes it when the
   *  NEXT_PUBLIC_V6_ADAPTIVE_CONTACT flag is on. */
  onIntentChange?: (next: Intent) => void;
}

export default function ContactForm({ intent, onIntentChange }: Props = {}) {
  const isAdaptive = typeof onIntentChange === "function";
  const formRef = useRef<HTMLFormElement>(null);
  const [state, formAction, isPending] = useActionState(
    sendContactEmail,
    INITIAL,
  );
  const [touched, setTouched] = useState(false);

  // Reset the form on success so the user can send another message later
  useEffect(() => {
    if (state.ok && touched) {
      formRef.current?.reset();
    }
  }, [state.ok, touched]);

  return (
    <div className="relative">
      <AnimatePresence mode="wait">
        {state.ok && touched ? (
          <motion.div
            key="success"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.5, ease: EASE }}
            className={`${cardSurface()} rounded-2xl p-10 text-center`}
          >
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-emerald-500/15 border border-emerald-500/30 mb-5">
              <Check className="w-5 h-5 text-emerald-400" />
            </div>
            <h3 className="text-primary text-xl font-medium mb-2">
              Message sent.
            </h3>
            <p className="text-secondary text-sm">
              I&apos;ll reply within a day or two. Talk soon.
            </p>
          </motion.div>
        ) : (
          <motion.form
            key="form"
            ref={formRef}
            action={formAction}
            onSubmit={() => setTouched(true)}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.5, ease: EASE }}
            className={`${cardSurface()} rounded-2xl p-8 sm:p-10 space-y-6`}
          >
            {/* Honeypot field — hidden from real users */}
            <input
              type="text"
              name="company"
              tabIndex={-1}
              autoComplete="off"
              aria-hidden="true"
              className="absolute opacity-0 pointer-events-none -left-[9999px] w-0 h-0"
            />

            {/* V6 — intent chip group, only on adaptive path. */}
            {isAdaptive && (
              <div role="group" aria-labelledby="intent-prompt">
                <span
                  id="intent-prompt"
                  className="text-[10px] uppercase tracking-widest text-primary/40 mb-3 block"
                >
                  I am reaching out regarding
                </span>
                <div className="flex flex-wrap gap-2">
                  {INTENT_OPTIONS.map((opt) => {
                    const active = intent === opt.id;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        aria-pressed={active}
                        onClick={() => onIntentChange?.(opt.id)}
                        disabled={isPending}
                        className={[
                          "inline-flex items-center gap-2 rounded-full px-4 py-2",
                          "text-xs font-medium tracking-tight transition-colors duration-200",
                          "disabled:opacity-60 disabled:cursor-not-allowed",
                          active
                            ? "border border-[#00d2ff]/45 bg-[#00d2ff]/[0.06] text-primary"
                            : "border border-white/[0.08] bg-transparent text-tertiary hover:text-secondary hover:border-white/[0.16]",
                        ].join(" ")}
                      >
                        {active && (
                          <span
                            aria-hidden="true"
                            className="w-1.5 h-1.5 rounded-full bg-[#00d2ff] shadow-[0_0_6px_rgba(0,210,255,0.6)]"
                          />
                        )}
                        {opt.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <Field
                name="name"
                label="Name"
                type="text"
                placeholder="Your name"
                required
                disabled={isPending}
              />
              <Field
                name="email"
                label="Email"
                type="email"
                placeholder="you@domain.com"
                required
                disabled={isPending}
              />
            </div>

            <Field
              name="message"
              label="Message"
              as="textarea"
              placeholder="Tell me about your project, role, or idea…"
              required
              disabled={isPending}
              minLength={10}
            />

            {/* Error state */}
            <AnimatePresence>
              {touched && state.error && !state.ok && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.3, ease: EASE }}
                  className="flex items-start gap-2 px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/20"
                >
                  <AlertCircle className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
                  <p className="text-red-300 text-sm leading-relaxed">
                    {state.error}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Submit */}
            <div className="flex items-center justify-between gap-4 pt-2">
              <p className="text-tertiary text-xs leading-relaxed">
                Or write directly to{" "}
                <a
                  href="mailto:emre30283@gmail.com"
                  className="text-primary/70 hover:text-primary underline underline-offset-2 transition-colors"
                >
                  emre30283@gmail.com
                </a>
              </p>

              {isAdaptive ? (
                <div className="flex items-center gap-3 flex-shrink-0">
                  <span className="margin-tick" aria-hidden="true" />
                  <SubmitButton isPending={isPending} />
                </div>
              ) : (
                <SubmitButton isPending={isPending} />
              )}
            </div>
          </motion.form>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ─── Submit button ──────────────────────────────────────── */
function SubmitButton({ isPending }: { isPending: boolean }) {
  return (
    <button
      type="submit"
      disabled={isPending}
      className="group inline-flex items-center gap-2 rounded-full pl-5 pr-1 py-1 bg-primary hover:gap-3 disabled:opacity-60 disabled:cursor-wait transition-all duration-300 flex-shrink-0"
    >
      <span className="text-black font-medium text-sm">
        {isPending ? "Sending…" : "Send Message"}
      </span>
      <div className="bg-black rounded-full w-9 h-9 flex items-center justify-center group-hover:scale-110 transition-transform duration-300 flex-shrink-0">
        {isPending ? (
          <Spinner />
        ) : (
          <ArrowRight className="w-4 h-4 text-primary" />
        )}
      </div>
    </button>
  );
}

/* ─── Field component ────────────────────────────────────── */
interface FieldProps {
  name: string;
  label: string;
  placeholder?: string;
  type?: string;
  required?: boolean;
  disabled?: boolean;
  minLength?: number;
  as?: "input" | "textarea";
}

function Field({
  name,
  label,
  placeholder,
  type = "text",
  required,
  disabled,
  minLength,
  as = "input",
}: FieldProps) {
  const baseClasses =
    "w-full bg-white/[0.02] border border-white/[0.08] rounded-lg px-4 py-3 text-primary placeholder:text-tertiary text-sm focus:outline-none focus:border-white/25 focus:bg-white/[0.04] transition-colors duration-200 disabled:opacity-50";

  return (
    <label className="block">
      <span className="text-[10px] uppercase tracking-widest text-primary/40 mb-2 block">
        {label}
      </span>
      {as === "textarea" ? (
        <textarea
          name={name}
          placeholder={placeholder}
          required={required}
          disabled={disabled}
          minLength={minLength}
          rows={6}
          className={`${baseClasses} resize-y min-h-[140px]`}
        />
      ) : (
        <input
          type={type}
          name={name}
          placeholder={placeholder}
          required={required}
          disabled={disabled}
          className={baseClasses}
        />
      )}
    </label>
  );
}

function Spinner() {
  return (
    <svg
      className="w-4 h-4 text-primary animate-spin"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <circle
        cx="12"
        cy="12"
        r="9"
        stroke="currentColor"
        strokeOpacity="0.25"
        strokeWidth="2.5"
      />
      <path
        d="M21 12a9 9 0 0 1-9 9"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
    </svg>
  );
}
