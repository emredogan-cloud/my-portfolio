import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import ScrollStory from "../_components/ScrollStory";
import { MILESTONES } from "./_components/milestones";
import { ILLUSTRATION_BY_ID } from "./_components/Illustrations";

export const metadata: Metadata = {
  title: "VibingCoderAI — Architecture",
  description:
    "Four-step walkthrough of VibingCoderAI: a Next.js 16 interface, an AWS Lambda + Anthropic Claude brain, a Terraform-provisioned decoupled monorepo, DynamoDB persistence.",
};

/**
 * /architecture/vibing-coder-ai
 *
 * Composes the shared ScrollStory engine with the VCAI-specific
 * milestones array and illustration dispatch map.
 */
export default function VCAIArchitecturePage() {
  return (
    <main id="main" className="relative min-h-screen bg-black overflow-hidden">
      <div className="relative z-10 max-w-5xl mx-auto px-6 pt-36 pb-32">
        <header className="space-y-6">
          <Link
            href="/architecture"
            className="inline-flex items-center gap-2 text-white/40 hover:text-white/80 text-sm transition-colors duration-200 group"
          >
            <ArrowRight
              size={14}
              className="rotate-180 transition-transform duration-200 group-hover:-translate-x-0.5"
            />
            Architecture hub
          </Link>
          <p className="text-[10px] font-mono uppercase tracking-[0.22em] text-[#00d2ff]/80">
            VibingCoderAI · LLM Agent Architecture
          </p>
          <h1 className="text-5xl md:text-7xl font-semibold tracking-[-0.04em] leading-[0.95] text-white">
            How VibingCoderAI works.
          </h1>
          <p className="text-white/55 text-lg leading-relaxed max-w-2xl">
            A casual developer idea goes in. A senior-grade AI agent brief
            comes out. Four steps from a Vercel-hosted Next.js frontend to
            a Claude-powered Lambda brain — entirely provisioned in
            Terraform, no console-clicked resources in the stack.
          </p>
        </header>

        <ScrollStory
          milestones={MILESTONES}
          illustrationsById={ILLUSTRATION_BY_ID}
        />
      </div>
    </main>
  );
}
