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
  },
];

export function getProjectById(id: string): Project | undefined {
  return projectsData.find((p) => p.id === id);
}
