"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useInView } from "motion/react";

const EASE = [0.22, 1, 0.36, 1] as const;

const COMMAND = "waste-hunter analyze --account production";

type LogEntry = {
  tag: string;
  tagClass: string;
  text: string;
  highlight?: string;
  highlightClass?: string;
};

/**
 * Production-grade CLI run. Authentication → 2 scans → remediation
 * plan → real AWS CLI fix → success status → annual business impact.
 *
 * The FIX line is a real `aws ec2 delete-volume` invocation, not a
 * fabricated DSL — same shape an engineer would actually paste into
 * their terminal. Signals authenticity over theatre.
 */
const LOGS: LogEntry[] = [
  {
    tag: "INFO",
    tagClass: "text-gray-500",
    text: "Loading credentials · profile: production",
  },
  {
    tag: "SCAN",
    tagClass: "text-sky-400/65",
    text: "EC2 · 3 orphaned volumes detected",
  },
  {
    tag: "SCAN",
    tagClass: "text-sky-400/65",
    text: "IAM · over-permissive policy on lambda-prod-role",
  },
  {
    tag: "INFO",
    tagClass: "text-gray-500",
    text: "Generating remediation plan...",
  },
  {
    tag: "FIX",
    tagClass: "text-amber-300/70",
    text: "aws ec2 delete-volume --volume-ids vol-0a1b2c3d",
  },
  {
    tag: "SUCCESS",
    tagClass: "text-emerald-400/80",
    text: "Audit complete in 1.24s",
  },
  {
    tag: "SAVINGS",
    tagClass: "text-emerald-400",
    text: "Estimated annual reduction: ",
    highlight: "$17,040",
    highlightClass: "text-emerald-200 font-semibold",
  },
];

type Phase = "idle" | "typing" | "executing" | "outputting" | "done";

function Cursor({ blink }: { blink: boolean }) {
  return (
    <span
      className={`inline-block w-[7px] h-[14px] bg-white/85 align-middle ml-[2px] ${
        blink ? "terminal-cursor-blink" : ""
      }`}
      aria-hidden="true"
    />
  );
}

function Prompt() {
  return (
    <>
      <span className="text-emerald-400/75">emre@macbook</span>
      <span className="text-white/30"> </span>
      <span className="text-sky-400/60">~/ops</span>
      <span className="text-white/30"> $ </span>
    </>
  );
}

export default function TerminalShowcase() {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });
  const [phase, setPhase] = useState<Phase>("idle");
  const [typedCmd, setTypedCmd] = useState("");
  const [visibleLogs, setVisibleLogs] = useState(0);

  /* Effect 1: kick off typing 700ms after entrance */
  useEffect(() => {
    if (!isInView || phase !== "idle") return;
    const t = setTimeout(() => setPhase("typing"), 700);
    return () => clearTimeout(t);
  }, [isInView, phase]);

  /* Effect 2: type the next character with human-ish timing */
  useEffect(() => {
    if (phase !== "typing") return;
    if (typedCmd.length >= COMMAND.length) {
      setPhase("executing");
      return;
    }
    const nextChar = COMMAND[typedCmd.length];
    const base = 35 + Math.random() * 30;
    const extra = nextChar === " " || nextChar === "-" ? 25 : 0;
    const t = setTimeout(() => {
      setTypedCmd(COMMAND.slice(0, typedCmd.length + 1));
    }, base + extra);
    return () => clearTimeout(t);
  }, [phase, typedCmd]);

  /* Effect 3: deliberate execution pause */
  useEffect(() => {
    if (phase !== "executing") return;
    const t = setTimeout(() => setPhase("outputting"), 550);
    return () => clearTimeout(t);
  }, [phase]);

  /* Effect 4: stream log lines with cinematic stagger */
  useEffect(() => {
    if (phase !== "outputting") return;
    if (visibleLogs >= LOGS.length) {
      setPhase("done");
      return;
    }
    const delay = visibleLogs === 0 ? 100 : 280;
    const t = setTimeout(() => setVisibleLogs((v) => v + 1), delay);
    return () => clearTimeout(t);
  }, [phase, visibleLogs]);

  const showInlineCursor =
    phase === "idle" || phase === "typing" || phase === "executing";

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 24, rotate: -0.4 }}
      whileInView={{ opacity: 1, y: 0, rotate: -0.4 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.75, ease: EASE }}
      className="rounded-xl border border-white/10 bg-[#050505] overflow-hidden"
      style={{
        boxShadow:
          "inset 0 1px 0 rgba(255,255,255,0.05), 0 30px 80px -25px rgba(0,0,0,0.7), 0 0 1px rgba(255,255,255,0.04)",
      }}
    >
      {/* ── Title bar ── */}
      <div className="relative flex items-center px-4 py-3 border-b border-white/[0.06]">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-[#ff5f57]/65" />
          <span className="w-2.5 h-2.5 rounded-full bg-[#febc2e]/65" />
          <span className="w-2.5 h-2.5 rounded-full bg-[#28c840]/65" />
        </div>
        <span className="hidden sm:block absolute left-1/2 -translate-x-1/2 text-[11px] text-gray-500 font-mono tracking-wide select-none">
          waste-hunter — zsh
        </span>
      </div>

      {/* ── Body ── */}
      <div className="px-5 sm:px-6 py-5 sm:py-6 font-mono text-xs sm:text-sm leading-[1.7] overflow-x-auto">
        {/* Command line */}
        <div className="whitespace-pre">
          <Prompt />
          <span className="text-white/90">{typedCmd}</span>
          {showInlineCursor && <Cursor blink={phase === "idle"} />}
        </div>

        {/* Output stream */}
        {LOGS.slice(0, visibleLogs).map((log, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: EASE }}
            className="whitespace-pre mt-2"
          >
            <span className="text-white/25">[</span>
            <span className={log.tagClass}>{log.tag}</span>
            <span className="text-white/25">]</span>
            <span className="text-white/70"> {log.text}</span>
            {log.highlight && (
              <span className={log.highlightClass}>{log.highlight}</span>
            )}
          </motion.div>
        ))}

        {/* Final prompt with blinking cursor */}
        {phase === "done" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.15, ease: EASE }}
            className="whitespace-pre mt-3"
          >
            <Prompt />
            <Cursor blink={true} />
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}
