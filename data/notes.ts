/**
 * Diagram node — one boxed concept on the InteractiveDiagram canvas.
 * V4 Phase 2 — Sub-PR 2.5.
 *
 * `kind` classifies the node visually (cloud service, edge runtime,
 * data store, model, signal). The custom xyflow node component
 * uses it to pick the right cyan accent ramp / icon glyph without
 * a per-node style override.
 */
export type DiagramNodeKind =
  | "cloud"      // AWS / GCP / Azure managed service
  | "compute"   // Lambda / container / edge function
  | "data"       // DynamoDB / S3 / Postgres
  | "model"     // LLM / ML model call
  | "client"    // browser / mobile device
  | "signal";   // event / message / user input

export interface NoteDiagramNode {
  id: string;
  /** Cosmetic position — pixels, not flex / grid. xyflow needs
   *  absolute coords to render. Keep diagrams under ~600px wide
   *  so they breathe on mobile. */
  position: { x: number; y: number };
  data: {
    label: string;
    kind: DiagramNodeKind;
    /** Optional one-line caption rendered under the label. Short,
     *  6-10 words max — diagrams are flowcharts, not paragraphs. */
    caption?: string;
  };
}

export interface NoteDiagramEdge {
  id: string;
  source: string;
  target: string;
  /** Optional edge label (e.g. "POST", "stream"). */
  label?: string;
}

export interface NoteDiagram {
  nodes: NoteDiagramNode[];
  edges: NoteDiagramEdge[];
}

export interface NoteAudio {
  /** Public path of the generated MP3. Convention:
   *  `/notes/audio/<slug>.mp3` so the regenerate-audio pipeline
   *  can write deterministically. */
  url: string;
  /** Optional duration label (e.g. "3:42") — surfaced under the
   *  player so the visitor knows what they're committing to. */
  duration?: string;
}

export interface NoteFormats {
  /** Audio rendition of the note body, generated build-time /
   *  weekly via the regenerate-audio cron. Pinned voice + format
   *  per `lib/notes-audio`. */
  audio?: NoteAudio;
  /** Inline architecture diagram. Rendered with xyflow on the
   *  Diagram tab via a dynamic-imported client island. Bundle
   *  isolation: react-flow chunks only ship on the notes-slug
   *  route. */
  diagram?: NoteDiagram;
}

export interface Note {
  slug: string;
  title: string;
  excerpt: string;
  date: string;            // ISO YYYY-MM-DD — stable, locale-free
  readTime: string;
  tags: readonly string[];
  body: string;            // Markdown
  /** Optional alternate renditions. When `formats.audio` is set,
   *  the notes-slug page surfaces a Listen tab; when
   *  `formats.diagram` is set, a Diagram tab appears. Notes
   *  without `formats` render exactly as before — single Read
   *  layout, no tab strip. */
  formats?: NoteFormats;
}

/**
 * Long-form notes. Body is plain Markdown rendered with react-markdown
 * + the Tailwind Typography plugin (prose prose-invert).
 *
 * Ordering: newest first. The index page renders in this order and
 * the slug page reads by exact slug match.
 */
export const notesData: Note[] = [
  {
    slug: "cloud-waste-hunter-architecture",
    title:
      "Architecting Cloud Waste Hunter: Cross-Account STS & Serverless FinOps",
    excerpt:
      "Finding unused AWS resources is easy. Building a multi-tenant SaaS that does it securely across hundreds of AWS accounts without hardcoding credentials is the real engineering challenge.",
    date: "2026-05-01",
    readTime: "4 min read",
    tags: ["AWS", "FinOps", "Serverless", "Bedrock"],
    body: `Finding unused AWS resources is easy. Building a multi-tenant SaaS that does it securely across hundreds of AWS accounts without hardcoding credentials is the real engineering challenge.

When I started building Cloud Waste Hunter, the primary constraint was security. I couldn't ask users for permanent IAM Access Keys. The solution was implementing **Cross-Account AWS scanning via STS AssumeRole**. By providing an external ID and a strict, read-only IAM policy template, the system dynamically assumes roles across customer environments, scans resources (EC2, RDS, EBS, IAM), and drops the temporary credentials.

For the backend, I avoided heavy container orchestration. The entire core is serverless: Next.js API routes trigger AWS Lambda functions for heavy scanning workloads, passing the results to a structured data lake using AWS Glue and Athena for cost analytics.

But identifying waste isn't enough; remediation is the bottleneck. Instead of writing hundreds of regex rules, I integrated Claude on AWS Bedrock to analyze over-permissive IAM policies and generate exact, copy-pasteable CLI commands to fix them. The result is a highly scalable FinOps engine built entirely on native AWS primitives.`,
    formats: {
      audio: {
        url: "/notes/audio/cloud-waste-hunter-architecture.mp3",
        duration: "~2:50",
      },
      diagram: {
        nodes: [
          { id: "client", position: { x: 50, y: 0 }, data: { kind: "client", label: "CWH dashboard", caption: "Visitor session" } },
          { id: "vercel", position: { x: 50, y: 130 }, data: { kind: "compute", label: "Next.js API route", caption: "Edge — scan dispatch" } },
          { id: "sts", position: { x: 320, y: 130 }, data: { kind: "cloud", label: "AWS STS", caption: "AssumeRole + external-id" } },
          { id: "lambda", position: { x: 320, y: 260 }, data: { kind: "compute", label: "Scanner Lambda", caption: "ThreadPoolExecutor(32) fan-out" } },
          { id: "cur", position: { x: 50, y: 260 }, data: { kind: "data", label: "Glue + Athena", caption: "CUR 2.0 cost lake" } },
          { id: "dynamo", position: { x: 320, y: 390 }, data: { kind: "data", label: "DynamoDB", caption: "Findings + remediation state" } },
          { id: "bedrock", position: { x: 50, y: 390 }, data: { kind: "model", label: "Bedrock Claude", caption: "IAM remediation drafts" } },
        ],
        edges: [
          { id: "e-client-vercel", source: "client", target: "vercel", label: "scan" },
          { id: "e-vercel-sts", source: "vercel", target: "sts", label: "AssumeRole" },
          { id: "e-sts-lambda", source: "sts", target: "lambda", label: "temp creds" },
          { id: "e-lambda-dynamo", source: "lambda", target: "dynamo", label: "findings" },
          { id: "e-vercel-cur", source: "vercel", target: "cur", label: "$ attribution" },
          { id: "e-dynamo-bedrock", source: "dynamo", target: "bedrock", label: "remediate" },
        ],
      },
    },
  },
  {
    slug: "monk-mode",
    title:
      "Monk Mode: Shipping Production Code Between 01:30 AM Bakery Shifts",
    excerpt:
      "Most 19-year-olds are figuring out college applications. I am figuring out how to balance high school exams, 01:30 AM physically demanding bakery shifts, and architecting scalable cloud infrastructure.",
    date: "2026-04-01",
    readTime: "3 min read",
    tags: ["Discipline", "Workflow", "Monk Mode"],
    body: `Most 19-year-olds are figuring out college applications. I am figuring out how to balance high school exams, 01:30 AM physically demanding bakery shifts, and architecting scalable cloud infrastructure.

People ask how I find the time to learn Terraform, AWS multi-region patterns, and build SaaS products like VibingCoderAI. The answer isn't a magical productivity app; it's a framework I call "Monk Mode."

When you start your day in a bakery at 01:30 AM, you learn very quickly that energy is finite. You cannot afford "tutorial hell" or scrolling through social media. You have to be ruthless with your focus.

My schedule is an algorithm:

1. **01:30 – 08:00:** Bakery Shift (Physical output, mental rest).
2. **08:00 – 15:00:** High School (Academic baseline).
3. **16:00 – 22:00:** The Build Window. Deep work. No distractions. This is where AWS infrastructure gets deployed and SaaS products get shipped.
4. **22:00:** Sleep. Repeat.

Discipline compounds faster than intellect. I don't rely on motivation; I rely on the architecture of my day. If you want to build systems that scale, you first have to build a personal routine that doesn't break under pressure.`,
    formats: {
      audio: {
        url: "/notes/audio/monk-mode.mp3",
        duration: "~2:10",
      },
      /* No diagram — Monk Mode is a discipline note, not an
       * architecture one. The schedule list in the body is the
       * diagram; rendering it twice would be noise. */
    },
  },
  {
    slug: "sixpack-ai-pose-detection",
    title: "Real-Time Pose Detection on Mobile: Building FormAI",
    excerpt:
      "Bringing machine learning to mobile environments usually means dealing with severe performance bottlenecks. For FormAI (a Flutter fitness coach), sending video frames to a cloud server API was out of the question.",
    date: "2026-03-01",
    readTime: "4 min read",
    tags: ["Mobile", "Flutter", "ML Kit", "Edge AI"],
    body: `Bringing machine learning to mobile environments usually means dealing with severe performance bottlenecks. For FormAI — a Flutter fitness application designed to track and correct workout form in real-time — sending video frames to a cloud server API was out of the question. The latency would ruin the user experience.

The architecture had to be edge-first. I built the application natively using **Flutter** for cross-platform fluidity. For the ML layer, I integrated Google's ML Kit directly on the device. This allows the app to process pose detection algorithms at 30+ FPS without a single network request.

To handle the backend infrastructure—user authentication, workout history, and real-time synchronization—I integrated **Supabase**. It gave me the power of PostgreSQL with instant API generation, perfectly complementing the edge-heavy mobile client. For monetization, RevenueCat handles the subscription states seamlessly.

Building FormAI taught me that the best cloud architecture is sometimes knowing when *not* to use the cloud. Offloading the heavy lifting to the user's neural engine (NPU) creates a zero-latency experience that cloud servers simply can't beat.`,
    formats: {
      audio: {
        url: "/notes/audio/sixpack-ai-pose-detection.mp3",
        duration: "~3:05",
      },
      diagram: {
        nodes: [
          { id: "camera", position: { x: 60, y: 0 }, data: { kind: "client", label: "Device camera", caption: "30 FPS frame stream" } },
          { id: "mlkit", position: { x: 60, y: 130 }, data: { kind: "model", label: "Google ML Kit", caption: "33 pose landmarks on-device" } },
          { id: "angles", position: { x: 60, y: 260 }, data: { kind: "compute", label: "Joint angle calc", caption: "Dart compute isolate" } },
          { id: "form", position: { x: 60, y: 390 }, data: { kind: "signal", label: "Rep quality eval", caption: "vs reference biomechanics" } },
          { id: "tts", position: { x: 340, y: 390 }, data: { kind: "signal", label: "flutter_tts cue", caption: "Audio correction in-room" } },
          { id: "supabase", position: { x: 340, y: 130 }, data: { kind: "cloud", label: "Supabase", caption: "Auth + Postgres history" } },
        ],
        edges: [
          { id: "e-camera-mlkit", source: "camera", target: "mlkit", label: "frame" },
          { id: "e-mlkit-angles", source: "mlkit", target: "angles", label: "landmarks" },
          { id: "e-angles-form", source: "angles", target: "form", label: "angle" },
          { id: "e-form-tts", source: "form", target: "tts", label: "bad form" },
          { id: "e-form-supabase", source: "form", target: "supabase", label: "history" },
        ],
      },
    },
  },
];

export function getNoteBySlug(slug: string): Note | undefined {
  return notesData.find((n) => n.slug === slug);
}

/* ── Stable, locale-free date formatting (no TZ hydration drift) ── */

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
] as const;

export function formatMonthYear(iso: string): string {
  const [y, m] = iso.split("-");
  return `${MONTHS[parseInt(m, 10) - 1]} ${y}`;
}
