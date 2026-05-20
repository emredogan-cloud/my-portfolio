import type { Metadata } from "next";
import PageAtmosphere from "@/components/layout/PageAtmosphere";
import ContactForm from "./ContactForm";
import AdaptiveContactSection from "./_components/AdaptiveContactSection";

export const metadata: Metadata = {
  title: "Contact — Emre Dogan",
  description:
    "Get in touch about cloud infrastructure, AI systems, or production SaaS work.",
};

export default function ContactPage() {
  /* V6 Sub-PR 15.4 — visitor-driven adaptive contact surface.
     Flag off → V5 static composition byte-identical. Flag on → the
     lead paragraph and the form's first row become a self-classification
     pair: pick the intent, the page's framing follows. The form's
     submit row picks up the Phase 11.5 margin-tick anchor; the
     success state's emerald check (Phase 11.2) is preserved verbatim. */
  const adaptive = process.env.NEXT_PUBLIC_V6_ADAPTIVE_CONTACT === "1";

  return (
    <main id="main" className="relative min-h-screen bg-black">
      {/* Ambient atmosphere — V6 11.1 typed variant.
          Signal: cyan blob top-right + diagonal hairline cyan rule. */}
      <PageAtmosphere
        variant="signal"
        legacy={{
          primary: {
            color: "rgba(14,165,233,0.10)",
            position: "top-right",
            size: "lg",
          },
          secondary: {
            color: "rgba(147,51,234,0.08)",
            position: "bottom-left",
            size: "md",
          },
        }}
      />

      <div className="relative z-10 max-w-3xl mx-auto px-6 pt-36 pb-32">
        {adaptive ? (
          <>
            {/* V6 — header without trailing margin; AdaptiveContactSection
                supplies its own mt-8 paragraph + mt-12 form rhythm. */}
            <div>
              <span className="text-[10px] sm:text-xs uppercase tracking-widest text-primary/40">
                Contact
              </span>
              <h1 className="text-5xl md:text-6xl font-medium tracking-[-0.04em] leading-[0.95] text-primary mt-5">
                <span className="block">Let&apos;s build</span>
                <span className="block text-tertiary">something real.</span>
              </h1>
            </div>

            <AdaptiveContactSection />
          </>
        ) : (
          <>
            {/* V5 — header block + static paragraph, byte-identical. */}
            <div className="mb-12">
              <span className="text-[10px] sm:text-xs uppercase tracking-widest text-primary/40">
                Contact
              </span>
              <h1 className="text-5xl md:text-6xl font-medium tracking-[-0.04em] leading-[0.95] text-primary mt-5">
                <span className="block">Let&apos;s build</span>
                <span className="block text-tertiary">something real.</span>
              </h1>
              <p className="text-secondary max-w-xl mt-8 text-base md:text-lg leading-relaxed">
                Working on cloud infrastructure, AI systems, or a production
                SaaS that needs an engineer? Send a note and I&apos;ll get back
                within a day or two.
              </p>
            </div>

            <ContactForm />
          </>
        )}
      </div>
    </main>
  );
}
