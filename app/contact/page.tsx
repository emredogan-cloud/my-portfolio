import type { Metadata } from "next";
import ContactForm from "./ContactForm";

export const metadata: Metadata = {
  title: "Contact — Emre Dogan",
  description:
    "Get in touch about cloud infrastructure, AI systems, or production SaaS work.",
};

export default function ContactPage() {
  return (
    <main className="relative min-h-screen bg-black">
      {/* Ambient atmosphere */}
      <div
        className="pointer-events-none fixed inset-0 z-0"
        aria-hidden="true"
      >
        <div
          className="absolute top-[-150px] right-[-150px] w-[700px] h-[700px] rounded-full blur-[180px]"
          style={{
            background:
              "radial-gradient(ellipse, rgba(14,165,233,0.10) 0%, transparent 70%)",
          }}
        />
        <div
          className="absolute bottom-[-200px] left-[-100px] w-[600px] h-[600px] rounded-full blur-[160px]"
          style={{
            background:
              "radial-gradient(ellipse, rgba(147,51,234,0.08) 0%, transparent 70%)",
          }}
        />
      </div>

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
