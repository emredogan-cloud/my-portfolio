import { Download } from "lucide-react";

/**
 * Premium minimal footer.
 *
 * Server Component — no client state. Hover transitions are CSS-only.
 * External links open in new tabs. Resume CV opens /resume.pdf — drop
 * the file into /public/resume.pdf to activate the download.
 */
export default function Footer() {
  return (
    <footer className="border-t border-white/[0.05] py-12">
      <div
        className="
          max-w-6xl mx-auto px-6 md:px-12
          flex flex-col md:flex-row md:items-center md:justify-between gap-5
        "
      >
        <p className="text-xs text-gray-500">
          ED. — Building cloud-native systems. © 2026
        </p>
        <nav className="flex items-center gap-6">
          <a
            href="https://github.com/emredogan-cloud"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-medium text-gray-400 hover:text-white transition-colors duration-200"
          >
            GitHub
          </a>
          <a
            href="https://www.linkedin.com/in/emre-do%C4%9Fan-657a99388/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-medium text-gray-400 hover:text-white transition-colors duration-200"
          >
            LinkedIn
          </a>
          <a
            href="/resume.pdf"
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
