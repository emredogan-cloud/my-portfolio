import type { Milestone } from "../../_components/types";

/**
 * SixPack AI — four milestones for /architecture/sixpack-ai.
 *
 * Mirrors data/projects.ts entry for sixpack-ai. The story is the
 * edge-first inversion: where most AI architectures push everything
 * into the cloud, SixPack AI's value comes from not sending video
 * frames over the network at all.
 */
export const MILESTONES: readonly Milestone[] = [
  {
    id: "edge-client",
    accent: "Step 01 · Flutter 3.22",
    title: "The edge client.",
    body:
      "A native Flutter app, single codebase for iOS and Android, state managed by flutter_riverpod 3.3. The home-screen widget and iOS Live Activity surface the current workout without opening the app. Cached network images + shimmer skeletons keep perceived perf snappy.",
    gradient: { x: 76, y: 24, intensity: 0.22 },
  },
  {
    id: "neural-engine",
    accent: "Step 02 · Google ML Kit",
    title: "The neural engine.",
    body:
      "Google ML Kit's pose-detection model runs on the device's NPU at 30 fps, tracking 33 body landmarks per frame. The app computes joint angles locally and evaluates rep quality against reference biomechanics — incorrect form triggers corrective audio cues via flutter_tts. Zero network round-trips per frame: the cloud never sees the camera.",
    gradient: { x: 24, y: 38, intensity: 0.26 },
  },
  {
    id: "sync",
    accent: "Step 03 · Supabase",
    title: "The sync layer.",
    body:
      "Supabase carries auth + a real-time Postgres backend. Workout history, programme state, and meal tracking sync in the background; the app stays usable offline and reconciles on reconnect. Sentry collects crash reports, PostHog the funnel — both opt-in, edge-instrumented.",
    gradient: { x: 78, y: 64, intensity: 0.22 },
  },
  {
    id: "monetization",
    accent: "Step 04 · RevenueCat",
    title: "The monetization layer.",
    body:
      "RevenueCat fronts the subscription paywall, unifying App Store + Play Store entitlements behind one entitlements API. The app reads the active tier from a single source of truth instead of duplicating receipt validation per platform; receipt-mode is the same on day-one as on day-one-thousand.",
    gradient: { x: 22, y: 70, intensity: 0.24 },
  },
] as const;
