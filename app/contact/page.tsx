import type { Metadata } from "next";
import PageAtmosphere from "@/components/layout/PageAtmosphere";
import ContactForm from "./ContactForm";

export const metadata: Metadata = {
  title: "Contact — Emre Dogan",
  description:
    "Get in touch about cloud infrastructure, AI systems, or production SaaS work.",
};

export default function ContactPage() {
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

        {/* Header */}
        <div className="mb-12">
          <span className="text-[10px] sm:text-xs uppercase tracking-widest text-primary/40">
            Contact
          </span>
          <h1 className="text-5xl md:text-6xl font-medium tracking-[-0.04em] leading-[0.95] text-primary mt-5">
            <span className="block">Let&apos;s build</span>
            <span className="block text-white/60">something real.</span>
          </h1>
          <p className="text-gray-400 max-w-xl mt-8 text-base md:text-lg leading-relaxed">
            Working on cloud infrastructure, AI systems, or a production SaaS
            that needs an engineer? Send a note and I&apos;ll get back within
            a day or two.
          </p>
        </div>

        {/* Form */}
        <ContactForm />
      </div>
    </main>
  );
}
