"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import ContactForm, { type Intent } from "../ContactForm";

const EASE = [0.22, 1, 0.36, 1] as const;

/* V6 Sub-PR 15.4 — adaptive explanatory copy keyed by visitor intent.
   No addressed copy ("we noticed…"); the visitor self-classifies and
   the page's lead paragraph responds. Operator-tone, first-person,
   two sentences each — same voice as the V5 baseline, just three
   complementary framings of the same offer. */
const INTENT_MESSAGES: Record<Intent, string> = {
  default:
    "Working on cloud infrastructure, AI systems, or a production SaaS that needs an engineer? Pick what fits below — the rest follows.",
  role: "I am currently open to Principal/Lead roles in cloud platforms, AI infrastructure, or production SaaS. Tell me about the team, the loop you're trying to close, and the timeline you're aiming for.",
  engineering:
    "Happy to discuss AWS topologies, FinOps strategies, edge ML pipelines, or production AI infrastructure. Bring the concrete problem; I'll bring operating experience.",
  other:
    "Open consulting work, collaboration, code reviews, or a question you haven't asked anyone else — drop it below. I'll reply within a day or two.",
};

/**
 * Sub-PR 15.4 — Adaptive Contact Surface (V6 path only).
 *
 * Owns the visitor's `intent` selection and re-renders the page's lead
 * paragraph as the visitor picks. Then mounts ContactForm with the
 * intent props so the form can surface the chip row inside the card
 * and decorate the submit button with the Phase 11.5 margin-tick.
 *
 * The V5 rollback path (in `app/contact/page.tsx`) does not mount this
 * component; it inlines the static paragraph + V5 ContactForm
 * byte-identical.
 */
export default function AdaptiveContactSection() {
  const [intent, setIntent] = useState<Intent>("default");

  return (
    <>
      <AnimatePresence mode="wait" initial={false}>
        <motion.p
          key={intent}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.35, ease: EASE }}
          className="text-secondary max-w-xl mt-8 text-base md:text-lg leading-relaxed"
        >
          {INTENT_MESSAGES[intent]}
        </motion.p>
      </AnimatePresence>

      <div className="mt-12">
        <ContactForm intent={intent} onIntentChange={setIntent} />
      </div>
    </>
  );
}
