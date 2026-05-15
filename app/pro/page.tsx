import type { Metadata } from "next";
import Link from "next/link";
import { Check, ArrowRight } from "lucide-react";
import CheckoutButton from "./_components/CheckoutButton";

export const metadata: Metadata = {
  title: "Cloud Waste Hunter — Pro",
  description:
    "Find and remove waste in your AWS account. Cross-account scanning, CUR 2.0 cost attribution, Claude-powered remediation. Free, Plus, Pro.",
};

interface PricingTier {
  id: "free" | "plus" | "pro";
  name: string;
  tagline: string;
  price: string;
  cadence: string;
  features: readonly string[];
  cta: { label: string; href?: string; highlight?: boolean };
  highlight?: boolean;
}

const TIERS: readonly PricingTier[] = [
  {
    id: "free",
    name: "Free",
    tagline: "Start scanning. Get the lay of the land.",
    price: "$0",
    cadence: "forever",
    features: [
      "1 AWS account",
      "30-day scan history",
      "Inventory of EC2, EBS, NAT, EIP, ELB, snapshots",
      "Read-only IAM role via STS AssumeRole",
      "Email digest of new findings",
      "Community support",
    ],
    cta: { label: "Get started", href: "https://waste-hunter.vercel.app" },
  },
  {
    id: "plus",
    name: "Plus",
    tagline: "The everyday plan for working engineers.",
    price: "$99",
    cadence: "per month",
    features: [
      "Up to 5 AWS accounts",
      "Unlimited scan history",
      "Claude 3.5 Haiku remediation per finding",
      "CUR 2.0 cost attribution via Glue + Athena",
      "Recurring scans on an EventBridge schedule",
      "Slack notifications",
      "Email support",
    ],
    cta: { label: "Start Plus", highlight: true },
    highlight: true,
  },
  {
    id: "pro",
    name: "Pro",
    tagline: "Multi-org, multi-account, audit-ready.",
    price: "$299",
    cadence: "per month",
    features: [
      "Unlimited AWS accounts",
      "API access — programmatic scans + findings",
      "Custom retention + redaction policies",
      "Multi-org SSO (Okta, Auth0, Google Workspace)",
      "Priority support + dedicated Slack channel",
      "Audit trail export (CSV, S3)",
    ],
    cta: { label: "Start Pro" },
  },
] as const;

/**
 * /pro — public pricing page for Cloud Waste Hunter.
 *
 * Phase 3 / Sub-PR 3, Step 1: static scaffold. Three pricing tiers
 * with feature checklists and CTA buttons. The Plus + Pro buttons
 * are visually present but don't wire to checkout yet — Step 2 adds
 * the /api/checkout endpoint and turns the buttons into client
 * islands that POST + redirect. Step 5+ wires the live customer
 * counter into this same page.
 *
 * The page is a Server Component. Per-tier CTAs:
 *   Free → external <a> to the CWH app (no API call).
 *   Plus / Pro → server-rendered as <button disabled> until Step 2
 *     drops the client checkout component in.
 */
export default function ProPricingPage() {
  return (
    <main id="main" className="relative min-h-screen bg-black overflow-hidden">
      {/* Ambient atmosphere — matches the CWH project page palette. */}
      <div
        className="pointer-events-none fixed inset-0 z-0"
        aria-hidden="true"
      >
        <div
          className="absolute top-[-180px] right-[-180px] w-[760px] h-[760px] rounded-full blur-[200px]"
          style={{
            background:
              "radial-gradient(ellipse, rgba(0,210,255,0.14) 0%, transparent 70%)",
          }}
        />
        <div
          className="absolute bottom-[-220px] left-[-120px] w-[640px] h-[640px] rounded-full blur-[180px]"
          style={{
            background:
              "radial-gradient(ellipse, rgba(11,37,81,0.20) 0%, transparent 70%)",
          }}
        />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-6 pt-36 pb-32">
        <header className="space-y-6 max-w-3xl">
          <p className="text-[10px] font-mono uppercase tracking-[0.22em] text-[#00d2ff]/80">
            CWH Pro · Pricing
          </p>
          <h1 className="text-5xl md:text-7xl font-semibold tracking-[-0.04em] leading-[0.95] text-white">
            Find the waste.
            <br />
            Remove the waste.
          </h1>
          <p className="text-white/55 text-lg leading-relaxed">
            Cross-account AWS scanning, CUR 2.0 cost attribution,
            Claude-powered remediation. Same engine on every tier — the
            difference is scale, retention, and how loud the alerts get.
          </p>
        </header>

        <section
          aria-label="Pricing tiers"
          className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-5"
        >
          {TIERS.map((tier) => (
            <TierCard key={tier.id} tier={tier} />
          ))}
        </section>

        <p className="mt-12 text-xs text-white/35 leading-relaxed max-w-2xl">
          Plus and Pro billed monthly via Lemon Squeezy. Cancel any time —
          your data stays read-only until you re-subscribe or export it.
          Annual billing available on request.
        </p>
      </div>
    </main>
  );
}

/* ── Single pricing card ────────────────────────────────────────── */

function TierCard({ tier }: { tier: PricingTier }) {
  const isHighlight = !!tier.highlight;
  return (
    <article
      className={[
        "relative flex flex-col rounded-2xl p-6 sm:p-7",
        isHighlight
          ? "border border-[#00d2ff]/40 bg-[#00d2ff]/[0.04]"
          : "border border-white/[0.08] bg-white/[0.02]",
      ].join(" ")}
    >
      {isHighlight && (
        <span
          className="absolute -top-3 left-6 inline-flex items-center gap-1.5 rounded-full bg-[#00d2ff] px-3 py-1 text-[10px] font-mono uppercase tracking-[0.18em] text-black"
        >
          Most popular
        </span>
      )}
      <header className="space-y-2">
        <p className="text-[10px] font-mono uppercase tracking-[0.22em] text-[#00d2ff]/85">
          {tier.name}
        </p>
        <h2 className="text-2xl font-semibold tracking-[-0.02em] text-white">
          {tier.tagline}
        </h2>
      </header>
      <div className="mt-5 flex items-baseline gap-2">
        <span className="text-4xl sm:text-5xl font-semibold tracking-[-0.03em] text-white">
          {tier.price}
        </span>
        <span className="text-sm text-white/40">{tier.cadence}</span>
      </div>
      <ul className="mt-6 space-y-2.5 flex-grow">
        {tier.features.map((f) => (
          <li key={f} className="flex items-start gap-2 text-sm text-white/70 leading-relaxed">
            <Check className="w-3.5 h-3.5 mt-1 flex-shrink-0 text-[#00d2ff]/80" aria-hidden="true" />
            <span>{f}</span>
          </li>
        ))}
      </ul>
      <div className="mt-7">
        <TierCta tier={tier} />
      </div>
    </article>
  );
}

/* CTA per tier. Free → external link to the live CWH app. Plus / Pro
   → CheckoutButton client island that POSTs /api/checkout and
   redirects to the returned Lemon Squeezy permalink. */
function TierCta({ tier }: { tier: PricingTier }) {
  if (tier.id === "free" && tier.cta.href) {
    return (
      <Link
        href={tier.cta.href}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center justify-center gap-2 rounded-full text-sm font-semibold px-6 min-h-[44px] w-full transition-colors bg-white text-black hover:bg-white/90"
      >
        {tier.cta.label}
        <ArrowRight className="w-4 h-4" aria-hidden="true" />
      </Link>
    );
  }
  if (tier.id === "plus" || tier.id === "pro") {
    return (
      <CheckoutButton
        tier={tier.id}
        label={tier.cta.label}
        highlight={!!tier.cta.highlight}
      />
    );
  }
  return null;
}
