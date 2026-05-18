import Link from "next/link";
import { Download } from "lucide-react";
import BuildBeacon from "./BuildBeacon";
import LiveCustomerCounter from "./LiveCustomerCounter";
import FooterCliPrompt from "./FooterCliPrompt";

/* ─── Inline brand SVGs (lucide v1.14 has no Github/Linkedin) ─── */
function GitHubIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 0C5.37 0 0 5.37 0 12c0 5.3 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61-.546-1.385-1.335-1.755-1.335-1.755-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23A11.51 11.51 0 0 1 12 5.803c1.02.005 2.047.138 3.006.404 2.29-1.552 3.297-1.23 3.297-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 21.795 24 17.295 24 12c0-6.63-5.37-12-12-12z" />
    </svg>
  );
}

function LinkedInIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
    </svg>
  );
}

/**
 * Premium minimal footer.
 *
 * Server Component — no client state. Hover transitions are CSS-only.
 * Hosts the canonical social hub (GitHub + LinkedIn) and the CV
 * download. Migrated here from BentoSection during the Tier 2
 * rebalance so the home grid can stay purely project-focused.
 */
export default function Footer() {
  return (
    /* Safe-area-aware insets — extra padding ensures the home
       indicator strip on iOS doesn't sit on top of the footer's
       baseline content. The `pt-12` keeps the visual rhythm; the
       inline-style bottom adds the safe-area inset on top of that
       12-padding so non-iOS devices look unchanged. */
    <footer
      className="border-t border-white/[0.05] pt-12 pb-12"
      style={{
        paddingBottom: "calc(3rem + env(safe-area-inset-bottom))",
        paddingLeft: "env(safe-area-inset-left)",
        paddingRight: "env(safe-area-inset-right)",
      }}
    >
      <div
        className="
          max-w-6xl mx-auto px-6 md:px-12
          flex flex-col md:flex-row md:items-center md:justify-between gap-5
        "
      >
        {/* Signature + live indicators group. Stacks vertically on
            mobile so each pill tucks under the signature line; inline
            on desktop with a quiet divider rhythm. LiveCustomerCounter
            renders nothing until paying_customers > 0, so this slot is
            invisible until CWH Pro has its first paying customer. */}
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:gap-4 flex-wrap">
          <p className="text-xs text-gray-500">
            ED. — Long-arc systems, hand-built infrastructure. Adana, GMT+3. © 2026
          </p>
          <BuildBeacon />
          <LiveCustomerCounter />
          {/* CLI discovery surface (Phase 2 polish) — a quiet
              terminal prompt next to the signature. Click to
              copy. Discoverability lands without a CTA card. */}
          <FooterCliPrompt />
        </div>
        <nav className="flex items-center gap-6">
          <Link
            href="/notes"
            className="text-xs font-medium text-gray-400 hover:text-white transition-colors duration-200"
          >
            Notes
          </Link>
          <a
            href="https://github.com/emredogan-cloud"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-xs font-medium text-gray-400 hover:text-white transition-colors duration-200"
            aria-label="GitHub profile"
          >
            <GitHubIcon className="w-3.5 h-3.5" />
            GitHub
          </a>
          <a
            href="https://www.linkedin.com/in/emre-do%C4%9Fan-657a99388/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-xs font-medium text-gray-400 hover:text-white transition-colors duration-200"
            aria-label="LinkedIn profile"
          >
            <LinkedInIcon className="w-3.5 h-3.5" />
            LinkedIn
          </a>
          <a
            href="/resume/emre-dogan.pdf"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-400 hover:text-white transition-colors duration-200"
          >
            <Download className="w-3.5 h-3.5" aria-hidden="true" />
            Download CV
          </a>
        </nav>
      </div>
    </footer>
  );
}
