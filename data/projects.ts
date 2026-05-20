/* ──────────────────────────────────────────────────────────────
 *  data/projects.ts — V5 baseline + V6 14.2 bespoke fields
 *
 *  The five projects' canonical record. V5's core shape (id, title,
 *  descriptions, techStack, urls, images, status) is preserved
 *  byte-identical. V6 Sub-PR 14.2 adds three optional bespoke
 *  fields the new /projects/[slug] composition consumes when the
 *  V6_PROJECT_DETAIL flag is on:
 *
 *    - pullQuote        — single line for the hero margin-tick.
 *    - stackByCategory  — categorised tech-stack layout.
 *    - overviewSections — Q&A-structured overview prose with
 *                         margin labels ("Why" / "How" /
 *                         "Trade-offs").
 *
 *  All three are optional. The V6 detail layout falls back to the
 *  V5 flat chip list + flowing paragraph loop when a field is
 *  absent. The legacy detail layout (flag off) reads only the V5
 *  core shape — the new fields are invisible. Spec validation:
 *  "Tech-stack categories work without backfill in data file
 *  (graceful fallback to flat chips)."
 * ────────────────────────────────────────────────────────────── */

export interface ProjectStackCategory {
  /** Category label rendered as the column header. */
  category: string;
  /** Tech items belonging to this category. */
  items: readonly string[];
}

export interface ProjectOverviewSection {
  /** One-word margin label — "Why" / "How" / "Trade-offs" / etc. */
  label: string;
  /** Paragraph body. Plain prose. */
  body: string;
}

export interface Project {
  id: string;
  title: string;
  shortDescription: string;
  detailedDescription: string;
  techStack: string[];
  liveUrl?: string;
  githubUrl?: string;
  images: string[];
  status: "shipped" | "building" | "planning";
  /** V6 14.2 — optional single-line founder quote for the hero margin-tick. */
  pullQuote?: string;
  /**
   * V6 14.2 — optional categorised tech stack. When present the detail page
   * renders a 2-col category layout (Frontend / Backend / Data / AI / Identity
   * etc.). When absent the page falls back to the flat techStack chip list.
   */
  stackByCategory?: readonly ProjectStackCategory[];
  /**
   * V6 14.2 — optional Q&A-structured overview. Each entry renders with a
   * one-word mono margin label adjacent to a paragraph body, so the prose
   * reads as a structured "Why / How / Trade-offs" walkthrough rather than
   * a flowing-text Markdown loop. When absent the page falls back to the
   * V5 detailedDescription paragraph loop.
   */
  overviewSections?: readonly ProjectOverviewSection[];
}

export const projectsData: Project[] = [
  {
    id: "aws-waste-hunter",
    title: "Cloud Waste Hunter",
    shortDescription:
      "B2B SaaS platform that scans AWS accounts to identify wasted cloud spend and delivers LLM-powered remediation via Claude on Bedrock.",
    detailedDescription: `Cloud Waste Hunter is a production-grade FinOps SaaS that gives engineering teams a real-time inventory of every dollar being wasted across their AWS footprint.

The scanner runs cross-account via STS AssumeRole, inspecting EC2 instances, EBS volumes, RDS databases, NAT gateways, unused Elastic IPs, abandoned load balancers, and snapshot sprawl. A ThreadPoolExecutor(32) fan-out scans all configured regions in parallel, keeping scan times well under a minute for accounts with hundreds of resources.

Cost attribution is powered by a Glue + Athena data lake that queries AWS Cost and Usage Report (CUR 2.0) directly, so waste figures are tied to real billing line items rather than estimates. Each finding is enriched with an LLM-generated remediation recommendation from Claude 3.5 Haiku on AWS Bedrock — the model explains the risk, the likely root cause, and the exact CLI or Terraform snippet to resolve it.

The backend is a FastAPI application deployed as a Lambda container image behind API Gateway, with async scan dispatch via a self-invoke Lambda pattern that bypasses the 30-second gateway timeout. Chat streaming uses a Lambda Function URL for direct HTTP/2 streaming. State is persisted across six DynamoDB tables. Recurring scans are scheduled via SQS and EventBridge.

Monetisation runs through Lemon Squeezy with three tiers — Free (single account, 30-day history), Plus, and Pro (unlimited accounts, API access). Auth is handled by AWS Cognito with Google IdP federation and a custom email Lambda.`,
    techStack: [
      "React 19",
      "TypeScript",
      "Python",
      "FastAPI",
      "AWS Lambda",
      "AWS Bedrock",
      "Claude 3.5 Haiku",
      "DynamoDB",
      "Terraform",
      "AWS Glue",
      "Amazon Athena",
      "Lemon Squeezy",
      "AWS Cognito",
    ],
    liveUrl: "https://www.cloudwastehunter.io/",
    images: [
      "/projects/aws-waste-hunter/cover.png",
      "/projects/aws-waste-hunter/ui.png",
    ],
    status: "shipped",
    pullQuote:
      "The scanner finds the waste; the model explains the fix; the customer ships the Terraform that closes the loop.",
    stackByCategory: [
      {
        category: "Frontend",
        items: ["React 19", "TypeScript"],
      },
      {
        category: "Backend",
        items: [
          "Python",
          "FastAPI",
          "AWS Lambda",
          "API Gateway",
        ],
      },
      {
        category: "Data",
        items: ["DynamoDB", "AWS Glue", "Amazon Athena"],
      },
      {
        category: "AI",
        items: ["AWS Bedrock", "Claude 3.5 Haiku"],
      },
      {
        category: "Identity & Billing",
        items: ["AWS Cognito", "Lemon Squeezy"],
      },
      {
        category: "Infrastructure",
        items: ["Terraform"],
      },
    ],
    overviewSections: [
      {
        label: "Why",
        body: "Engineering teams know waste exists in their AWS bill. Console-clicked dashboards surface line-items but not the why, and remediation requires reading IAM docs, untangling Terraform, and writing CLI snippets. CWH closes the loop — find it, explain it, fix it — in one workflow.",
      },
      {
        label: "How",
        body: "Cross-account scans run over STS AssumeRole, inspecting EC2 / EBS / RDS / NAT / Elastic IPs / load balancers / snapshots in parallel via a 32-wide ThreadPoolExecutor. Cost attribution queries CUR 2.0 directly through Glue + Athena, so figures tie to real billing line items. Each finding is enriched with Claude 3.5 Haiku on Bedrock — the model writes the explanation AND the remediation Terraform.",
      },
      {
        label: "Trade-offs",
        body: "Bedrock-streamed remediation is slower and pricier than a local heuristic; for the buyer's mental model (\"I trust the AI explanation\"), it's the right call. CUR 2.0 over Athena costs more than estimation; the difference is paid for by the precision recruiters and finance leads expect. The self-invoke Lambda pattern bypasses API Gateway's 30-s timeout but adds two more cold-start surfaces — accepted for keeping scans single-region serverless.",
      },
    ],
  },
  {
    id: "vibing-coder-ai",
    title: "VibingCoderAI",
    shortDescription:
      "Prompt Engineering as a Service. Translates casual developer ideas into senior-engineer-grade AI agent briefs.",
    detailedDescription: `VibingCoderAI solves one of the most common failure modes when building with AI agents: vague prompts that produce vague output.

The service wraps user input in a strict master system prompt that enforces structural completeness, technical precision, accessibility requirements, explicit error-handling instructions, and clear out-of-scope boundaries. The result is a copy-pasteable Markdown brief that Claude Code, Cursor, GitHub Copilot, or Windsurf can execute reliably without hallucinating scope.

The architecture is a fully decoupled monorepo. The frontend is a Next.js 16 App Router application hosted on Vercel, communicating with an AWS Lambda backend over public HTTPS. The Lambda handler uses the Anthropic Claude API (SDK v0.86) to generate the prompt translation. Infrastructure is defined entirely in Terraform — ECR for the container registry, Lambda for compute, API Gateway for the HTTP edge, and DynamoDB for persistence.

TypeScript strict mode is enforced throughout the frontend. No CSS-in-JS, no module.css files — Tailwind v4 only. Server Components by default; "use client" added only where interactivity requires it. All AWS resources are provisioned through Terraform; no console-clicked infrastructure exists in the stack.

The project is in active development. Auth (Clerk), persistence (DynamoDB), and payments (Stripe) are in the roadmap.`,
    techStack: [
      "Next.js 16",
      "TypeScript",
      "Tailwind v4",
      "Node.js 20",
      "AWS Lambda",
      "Anthropic Claude API",
      "Terraform",
      "API Gateway",
      "DynamoDB",
    ],
    liveUrl: "https://www.vibingcoderai.com/",
    githubUrl: "https://github.com/emredogan-cloud/VibingCodeAI",
    images: [
      "/projects/vibing-coder-ai/logo.svg",
      "/projects/vibing-coder-ai/icon.svg",
    ],
    status: "building",
    pullQuote:
      "Casual ideas in, senior-engineer briefs out. The master prompt is the product.",
    stackByCategory: [
      {
        category: "Frontend",
        items: ["Next.js 16", "TypeScript", "Tailwind v4"],
      },
      {
        category: "Backend",
        items: ["Node.js 20", "AWS Lambda", "API Gateway"],
      },
      {
        category: "Data",
        items: ["DynamoDB"],
      },
      {
        category: "AI",
        items: ["Anthropic Claude API"],
      },
      {
        category: "Infrastructure",
        items: ["Terraform"],
      },
    ],
    overviewSections: [
      {
        label: "Why",
        body: "AI agents fail more from vague prompts than from weak models. Developers ship Cursor-or-Claude-Code requests like \"build me an auth flow\" and watch the agent hallucinate scope. VibingCoderAI is a strict translator — vague ideas in, structurally complete senior-engineer-grade briefs out.",
      },
      {
        label: "How",
        body: "A master system prompt enforces structural completeness — accessibility requirements, explicit error-handling, out-of-scope boundaries. The brief is copy-pasteable Markdown that Claude Code, Cursor, GitHub Copilot, or Windsurf can execute without re-interpretation. Next.js 16 App Router frontend on Vercel calls an AWS Lambda backend over public HTTPS; the Lambda runs the Anthropic Claude API behind Terraform-provisioned API Gateway + DynamoDB.",
      },
      {
        label: "Trade-offs",
        body: "The master prompt is opinionated — it forces structure that some developers find overkill for prototypes. Accepted: the target user is a senior engineer wanting prompt rigour, not a hobbyist seeking conversational flexibility. Lambda over HTTPS rather than direct browser-to-Claude was the more boring choice — and the right one for adding auth + billing later.",
      },
    ],
  },
  {
    id: "sixpack-ai",
    title: "FormAI - Fitness Koçu",
    shortDescription:
      "Flutter fitness coaching app with real-time pose detection, AI voice guidance, and a 30-day personalised training system.",
    detailedDescription: `FormAI - Fitness Koçu is a native Flutter application that delivers a full-stack AI fitness coaching experience from the device camera alone.

The core feature is real-time exercise form analysis: Google ML Kit's pose detection model tracks 33 body landmarks at 30fps through the device camera, calculates joint angles, and evaluates rep quality against reference biomechanics. Incorrect form triggers corrective audio cues via flutter_tts — effectively putting an AI coach in the room.

The 30-day programme generator produces personalised daily workouts based on the user's onboarding assessment (goals, fitness level, available equipment, dietary restrictions). Nutrition tracking covers macros and micronutrients with a meal photo database. The home screen widget and iOS Live Activity surface the current workout status without opening the app.

State management is handled by flutter_riverpod 3.3. Supabase provides authentication and a real-time Postgres backend. RevenueCat manages the subscription paywall with App Store and Play Store integration. Sentry captures crash reports and PostHog tracks conversion funnels. Cached network images and shimmer skeleton loaders maintain perceived performance during data fetches.

The app store optimisation system is a separate React + Vite toolchain that generates cinematic screenshot composites and localised store listings across EN, TR, and four other locales.`,
    techStack: [
      "Flutter 3.22",
      "Dart",
      "Supabase",
      "Google ML Kit",
      "RevenueCat",
      "flutter_riverpod",
      "Sentry",
      "PostHog",
      "go_router",
    ],
    images: [
      "/projects/sixpack-ai/screenshot-1.jpg",
      "/projects/sixpack-ai/screenshot-2.jpg",
      "/projects/sixpack-ai/screenshot-3.jpg",
      "/projects/sixpack-ai/screenshot-4.jpg",
    ],
    status: "building",
    pullQuote:
      "The model is on the device. The cloud is for billing, not for breath.",
    stackByCategory: [
      {
        category: "Mobile",
        items: ["Flutter 3.22", "Dart", "flutter_riverpod", "go_router"],
      },
      {
        category: "On-Device AI",
        items: ["Google ML Kit"],
      },
      {
        category: "Backend",
        items: ["Supabase"],
      },
      {
        category: "Identity & Billing",
        items: ["RevenueCat"],
      },
      {
        category: "Observability",
        items: ["Sentry", "PostHog"],
      },
    ],
    overviewSections: [
      {
        label: "Why",
        body: "Form-coaching apps that round-trip pose data to the cloud burn battery, leak privacy, and rely on connectivity. The best cloud architecture is sometimes knowing when not to use the cloud — pose detection runs on the device's NPU, the user's video never leaves the phone, and the experience works on a plane.",
      },
      {
        label: "How",
        body: "Google ML Kit tracks 33 body landmarks at 30 fps through the device camera. Joint-angle math evaluates rep quality against reference biomechanics; incorrect form triggers corrective audio cues via flutter_tts. Supabase + RevenueCat carry the parts that genuinely need a server (auth, subscription state, store integration). Riverpod 3.3 manages app state. The home-screen widget + iOS Live Activity surface workout status without opening the app.",
      },
      {
        label: "Trade-offs",
        body: "On-device ML caps the model size. Joint-angle heuristics are coarser than server-side pose-grading; for the rep-counting + form-cue use case, they're sufficient. The store-listing optimisation toolchain is a separate React + Vite codebase — would have been cleaner integrated, but the build cycles for app store screenshots are completely different from the Flutter dev loop.",
      },
    ],
  },
  {
    id: "pawdoc",
    title: "PawDoc",
    shortDescription:
      "AI-powered pet health triage app that uses computer vision to assess symptoms and guide emergency care decisions.",
    detailedDescription: `PawDoc addresses a high-stakes gap in pet ownership: knowing when a symptom is a true emergency versus a manageable condition that can wait for a routine appointment.

The application uses multimodal AI to analyse user-submitted photos and symptom descriptions against a structured veterinary triage framework. The output is a prioritised action recommendation — from "monitor at home" to "go to an emergency clinic now" — along with an explanation grounded in observable signs rather than speculation.

The target market is the 170M US pet-owning households, 72% of which report treating pets as family members and demonstrating a strong willingness to pay for health guidance. The platform is designed around three user archetypes: the First-Time Pet Owner (high anxiety, needs reassurance), the Busy Professional (wants fast decisions), and the Budget-Conscious Owner (wants to avoid unnecessary vet bills).

The product roadmap covers a symptom checker (MVP), integration with telemedicine vet consultations (Phase 2), and a health record + vaccination reminder system (Phase 3). Monetisation is subscription-based at $8–$12/month for standard access with a Pro tier unlocking unlimited photo analysis and direct vet chat.`,
    techStack: [
      "React Native",
      "TypeScript",
      "Computer Vision",
      "Multimodal AI",
      "Node.js",
    ],
    images: [],
    status: "planning",
    pullQuote:
      "\"Monitor at home\" or \"go to the clinic now.\" The triage framework is the moat — the AI is the surface.",
    stackByCategory: [
      {
        category: "Mobile",
        items: ["React Native", "TypeScript"],
      },
      {
        category: "Backend",
        items: ["Node.js"],
      },
      {
        category: "AI",
        items: ["Computer Vision", "Multimodal AI"],
      },
    ],
    overviewSections: [
      {
        label: "Why",
        body: "Pet owners search symptoms at midnight, find Reddit threads of varying quality, and either panic-drive to an ER or wait too long. The willingness to pay for a calm, structured, evidence-grounded triage opinion is high — and the addressable market (170M US pet households, 72% treating pets as family) is real.",
      },
      {
        label: "How",
        body: "Multimodal AI reads photos + symptom descriptions and scores them against a structured veterinary triage framework. The output is a prioritised action recommendation — \"monitor at home\" / \"book a routine appointment\" / \"go to an emergency clinic now\" — explained in terms of observable signs, not speculation. Three user archetypes — First-Time Pet Owner (anxious), Busy Professional (decision-driven), Budget-Conscious Owner (cost-aware) — shape the prompt and the response framing.",
      },
      {
        label: "Trade-offs",
        body: "Liability is the central trade-off. The triage framework defaults conservative — the cost of a false-negative (\"monitor at home\" when the pet needs the ER) dwarfs the cost of a false-positive. Real telemedicine integration (Phase 2) requires veterinary licensing infrastructure we don't yet have. The roadmap is intentionally staged: ship the symptom checker first, validate willingness to pay, then layer the regulated surfaces.",
      },
    ],
  },
  {
    id: "aevum",
    title: "Aevum",
    shortDescription:
      "AI eldercare coordination platform that acts as a unified operating system for adult children managing aging parents.",
    detailedDescription: `Aevum targets what caregivers describe as "fragmented dread" — the cognitive load of simultaneously managing a parent's medications, appointments, insurance claims, and daily safety across multiple disconnected systems.

The platform aggregates these responsibilities into a single intelligent dashboard with an AI-generated daily briefing: "Mum's blood pressure reading was high yesterday, her cardiology appointment is in 3 days, and her Medicare Part D renewal deadline is next week." Proactive alerts surface issues before they become crises.

The core modules cover medication management (schedule adherence, refill reminders, drug interaction warnings), appointment coordination (calendar integration, transport logistics, follow-up tracking), insurance document management (claim status, pre-authorisation deadlines), and family communication (role-based access so siblings share caregiving responsibilities without information gaps).

The primary persona is a 52-year-old professional providing approximately 24 hours of unpaid care per week and spending $7,200 per year out-of-pocket on parental care. The platform's value proposition is time recovery and reduced decision fatigue, priced at $15–$25/month. The addressable market is the 53M US family caregivers, with particularly high willingness-to-pay among high-income segments.`,
    techStack: [
      "React Native",
      "TypeScript",
      "Node.js",
      "AI Briefings",
      "Healthcare APIs",
    ],
    images: [],
    status: "planning",
    pullQuote:
      "One briefing, every morning, across medications, appointments, insurance, and family hand-off.",
    stackByCategory: [
      {
        category: "Mobile",
        items: ["React Native", "TypeScript"],
      },
      {
        category: "Backend",
        items: ["Node.js", "Healthcare APIs"],
      },
      {
        category: "AI",
        items: ["AI Briefings"],
      },
    ],
    overviewSections: [
      {
        label: "Why",
        body: "Caregivers describe their state as \"fragmented dread\" — the cognitive overhead of juggling a parent's medications, appointments, insurance claims, and safety across five disconnected systems. The target persona is the 52-year-old professional spending 24 hours / week unpaid + $7,200 / year out-of-pocket on parental care. Time recovery is the value proposition, not feature density.",
      },
      {
        label: "How",
        body: "A unified dashboard aggregates medication adherence, appointment coordination, insurance claim status, and family role-based access into a single AI-generated daily briefing: \"Mum's BP was high yesterday; her cardiology appointment is in 3 days; her Medicare Part D renewal deadline is next week.\" Proactive alerts surface issues before they become crises. Role-based access lets siblings share caregiving without information gaps.",
      },
      {
        label: "Trade-offs",
        body: "Healthcare API integration is heavyweight — insurance providers, pharmacy chains, and care-network systems each carry their own auth, rate limits, and compliance burden. Shipping the MVP without full integrations means starting as a structured journal that becomes a system-of-record as integrations layer in. The $15–$25 price point assumes high-WTP caregiver segments; the platform must prove it before pricing-down for broader reach.",
      },
    ],
  },
];

export function getProjectById(id: string): Project | undefined {
  return projectsData.find((p) => p.id === id);
}
