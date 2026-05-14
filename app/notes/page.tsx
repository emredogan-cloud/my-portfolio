import type { Metadata } from "next";
import { Clock, BookOpen } from "lucide-react";
import { Reveal } from "@/components/ui/Reveal";

export const metadata: Metadata = {
  title: "Notes — Emre Doğan",
  description:
    "Long-form writing on cloud architecture, AI systems, and self-taught engineering. Drafts live first.",
};

interface Note {
  title: string;
  excerpt: string;
  date: string; // ISO YYYY-MM-DD — stable formatting (no TZ math)
  readTime: string;
  tags: readonly string[];
  status: "draft" | "published";
}

const NOTES: Note[] = [
  {
    title: "From bakery shifts to AWS: my self-taught roadmap.",
    excerpt:
      "Two years between 04:30 AM bakery shifts and high-school exams. No bootcamp, no CS degree. Here's the exact curriculum — ordered, sequenced, and unromanticised — that took me from zero to deploying production AWS infrastructure.",
    date: "2026-05-14",
    readTime: "12 min read",
    tags: ["Self-Taught", "AWS", "Discipline"],
    status: "draft",
  },
  {
    title: "Building cross-account scanners with STS AssumeRole.",
    excerpt:
      "How Cloud Waste Hunter scans hundreds of AWS accounts from a single Lambda — the IAM trust policies, session caching, regional fan-out via ThreadPoolExecutor, and the failure modes nobody tells you about until you hit them in production.",
    date: "2026-04-22",
    readTime: "9 min read",
    tags: ["AWS", "IAM", "Security"],
    status: "draft",
  },
  {
    title: "Why I chose Claude over OpenAI for CWH.",
    excerpt:
      "Bedrock-hosted Claude beat the Anthropic API and GPT-4o on every dimension that matters for FinOps remediation: structured output, technical accuracy, instruction adherence, and per-token economics at scale. The benchmark, the failure modes, the verdict.",
    date: "2026-04-01",
    readTime: "7 min read",
    tags: ["AI", "Claude", "Bedrock"],
    status: "draft",
  },
];

/* Stable, locale-free date formatting. Same string on server and
   client → no hydration mismatch. */
const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
] as const;

function formatDate(iso: string): string {
  const [y, m, d] = iso.split("-");
  return `${MONTHS[parseInt(m, 10) - 1]} ${parseInt(d, 10)}, ${y}`;
}

function StatusBadge({ status }: { status: Note["status"] }) {
  if (status !== "draft") return null;
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-[#00d2ff]/25 bg-[#00d2ff]/[0.08] px-2 py-0.5 text-[10px] font-mono uppercase tracking-wider text-[#00d2ff]/90">
      <span className="w-1 h-1 rounded-full bg-[#00d2ff]" />
      Draft
    </span>
  );
}

export default function NotesPage() {
  return (
    <main className="relative min-h-screen bg-black">
      {/* Atmosphere */}
      <div className="pointer-events-none fixed inset-0 z-0" aria-hidden="true">
        <div
          className="absolute top-[-200px] right-[-150px] w-[700px] h-[700px] rounded-full blur-[180px]"
          style={{
            background:
              "radial-gradient(ellipse, rgba(0,210,255,0.06) 0%, transparent 70%)",
          }}
        />
        <div
          className="absolute bottom-[-200px] left-[-100px] w-[600px] h-[600px] rounded-full blur-[160px]"
          style={{
            background:
              "radial-gradient(ellipse, rgba(147,51,234,0.06) 0%, transparent 70%)",
          }}
        />
      </div>

      <div className="relative z-10 max-w-3xl mx-auto px-6 pt-36 pb-32">

        {/* ───────── HERO ───────── */}
        <Reveal mode="mount" duration={0.8} className="mb-20">
          <span className="text-[10px] sm:text-xs uppercase tracking-widest text-primary/40">
            Notes
          </span>
          <h1 className="text-5xl md:text-7xl font-medium tracking-[-0.04em] leading-[0.95] text-primary mt-5">
            <span className="block">Long-form.</span>
            <span className="block text-white/60">Production-grade.</span>
          </h1>
          <p className="text-gray-400 max-w-2xl mt-8 text-base md:text-lg leading-relaxed">
            Working notes on cloud architecture, AI systems, and what it
            actually takes to ship production infrastructure as a self-taught
            engineer at 19. Drafts live first — published when the work behind
            them is done.
          </p>
        </Reveal>

        {/* ───────── ARTICLE LIST ───────── */}
        <div className="divide-y divide-white/[0.06] border-y border-white/[0.06]">
          {NOTES.map((note, i) => (
            <Reveal
              key={note.title}
              duration={0.6}
              delay={i * 0.08}
              y={14}
              margin="-40px"
            >
              <article className="py-10 grid gap-4">
                {/* Meta row */}
                <div className="flex items-center gap-3 text-[11px] text-gray-500">
                  <time dateTime={note.date}>{formatDate(note.date)}</time>
                  <span className="text-white/15">·</span>
                  <span className="inline-flex items-center gap-1">
                    <Clock className="w-3 h-3" aria-hidden="true" />
                    {note.readTime}
                  </span>
                  <span className="text-white/15">·</span>
                  <StatusBadge status={note.status} />
                </div>

                {/* Title — non-link while in draft, so visitors don't
                    bounce off a placeholder. The title remains
                    discoverable, but the click affordance only appears
                    once the article actually exists. */}
                <h2 className="text-2xl md:text-3xl font-medium tracking-[-0.02em] text-primary leading-tight">
                  {note.title}
                </h2>

                {/* Excerpt */}
                <p className="text-gray-400 text-sm md:text-base leading-relaxed max-w-2xl">
                  {note.excerpt}
                </p>

                {/* Tags */}
                <div className="flex flex-wrap gap-2 pt-1">
                  {note.tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-2.5 py-1 rounded-full border border-white/10 bg-white/[0.03] text-[10px] uppercase tracking-wider text-primary/60"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </article>
            </Reveal>
          ))}
        </div>

        {/* ───────── FOOTER NOTE ───────── */}
        <Reveal
          duration={0.7}
          margin="-50px"
          className="mt-16 pt-10 border-t border-white/[0.06]"
        >
          <p className="text-gray-500 text-sm leading-relaxed max-w-2xl inline-flex items-start gap-2">
            <BookOpen
              className="w-3.5 h-3.5 mt-0.5 text-white/30 flex-shrink-0"
              aria-hidden="true"
            />
            <span>
              New essays drop when the work behind them is done — not before.
              Subscribe via the GitHub repo&apos;s release feed to get notified.
            </span>
          </p>
        </Reveal>
      </div>
    </main>
  );
}
