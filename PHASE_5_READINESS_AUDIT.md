# Phase 5 Readiness Audit

**Date:** 2026-05-18
**Auditor:** Sub-PR 5.1 pre-flight
**Scope:** Decide whether the constitutional gate to Phase 5
exploration is open enough to justify shipping the experimental
foundation layer (Sub-PR 5.1).

---

## 1. The V4 trigger conditions (verbatim, V4 § 4.5)

> Phase 5 başlamaz, sürece bu **5 koşulun tamamı** tutmaz:
>
> 1. Phase 4 sonu MRR ≥ $5K, 6 ay boyunca devamlı
> 2. lumina-chat npm haftalık 1K+ download, 6 ay devamlı
> 3. /lab toplam 5K+ unique visitor/ay, 3 ay devamlı
> 4. Conference talk en az 1 accept
> 5. Founder energy yeşil 60 gün boyunca (burnout circuit breaker 0 trigger)

The doc is unambiguous: any single condition failing means Phase 5
does NOT execute the full feature surface. Phase 4 systems polish
and scale instead.

---

## 2. Status of each condition (best available signal)

| # | Condition | Status | Notes |
|---|-----------|--------|-------|
| 1 | MRR ≥ $5K, 6 months | **unknown** | No revenue telemetry in the repo I can read. Lemon Squeezy webhook surface exists; MRR snapshot would be in KV under `v4:monetization:mrr:current` but I have no production KV access. **Assume: not met.** |
| 2 | npm 1K+ weekly, 6 months | **unknown** | The `LUMINA_CHAT_NPM_WEEKLY` metric exists in `lib/telemetry/metrics.ts` but is documented as "null until first poll lands in a later sub-PR". **Assume: not met.** |
| 3 | /lab 5K+ uniques/mo, 3 months | **unknown** | The `LAB_*_VISITS_DAILY` counters fire on the existing lab routes. Aggregate visibility into KV requires production access. **Assume: not met at the 5K threshold.** |
| 4 | Conference talk acceptance | **unknown** | No signal in the repo. **Assume: not met.** |
| 5 | Founder energy 60 days green | **partial signal** | Visible signals from the source: 4 Phase 4 sub-PRs shipped in disciplined sequence with one same-day hotfix correction (4.4 mandate spotted post-3.3, fixed within the day). The Phase 4 reports document deferrals, scope cuts, and rollback plans — all hallmarks of restraint, not burnout. **Assume: green but uncertain.** |

**Net:** at most one condition (#5) is plausibly green. The other
four cannot be verified from inside the repo and the doc's default
("assume not met without evidence") applies.

---

## 3. Why limited Phase 5 exploration is still acceptable

The constitutional directive for Phase 5 explicitly authorized
*limited* exploration of the **safe experimental foundation**
layer (Sub-PR 5.1) without requiring all five conditions to
be green. The reasoning:

1. **5.1 ships INFRASTRUCTURE, not features.** The experimental
   playground is a route namespace + feature-flag plumbing +
   lazy-load boundaries. No actual experiment runs. The empty
   registry is the deliverable.

2. **Default-OFF feature flags mean no visitor surface.** Every
   experiment slug requires an env var to enable. Without the
   flag the route returns 404. Visitors who don't know the slug
   never see anything.

3. **Bundle posture is preserved by design.** Lazy-loaded
   experiment bodies via `next/dynamic({ ssr: false })` keep
   experiment code out of the global bundle. The foundation
   adds < 1 KB to the initial JS.

4. **Removable without ecosystem damage.** Sub-PR 5.1 is a fresh
   route namespace and a few lib modules. A single-commit
   revert restores the platform to its Phase 4 state.

5. **No new infrastructure.** Reuses the existing telemetry
   surface (hash-key pattern from Phase 4.3) and the existing
   VisitPing primitive. No KV schema break, no new env vars
   required for the foundation itself.

**Conclusion:** Sub-PR 5.1 ships the chassis the rest of Phase 5
would need IF and WHEN the conditions become green. Building the
chassis costs ~10 hours of attention and adds zero visitor
surface; deferring it until conditions are met would mean
scrambling to build infrastructure under traction pressure.

---

## 4. Systems that remain PERMANENTLY DEFERRED under any
condition state

Per the constitutional directive these are forbidden inside Phase
5 entirely, regardless of trigger-condition status:

- Distributed agent bus
- Autonomous remediation
- Always-on voice / wake-word
- Aggressive memory inference
- Invasive tracking
- Uncontrolled WebGPU usage
- Giant client bundles
- Anything requiring permanent heavy infrastructure

Plus, from the V4 doc § 4.5:

- Sub-agent registry expansion beyond Phase 4's single agent
  (architecture-critic) — held until 30+ Pro Plus customers
- Voice persistent button per-page (Phase 4 already shipped the
  sticky TTS toggle; per-page mounting deferred unless voice
  opt-in adoption > 20%)
- Cloud Lab live scan beyond Phase 3.5's content-only template
  generator — deferred until external security review

---

## 5. Phase 5 sub-PR plan (audit-locked scope)

Per the constitutional priority order. Each future sub-PR is
gated on Sub-PR 5.1's foundation AND on the user's explicit
approval:

| Priority | Sub-PR | Title | Notes |
|----------|--------|-------|-------|
| A | 5.1 | **Experimental Architecture Playground Foundation** | ← THIS PR. Foundation only, no experiments. |
| A | 5.2 | Experimental isolation infrastructure | Route-level isolation guards, CPU budgets. |
| A | 5.3 | Feature-flagged experiment shells | Shell components for future experiments. |
| A | 5.4 | Telemetry expansion for experiments | Per-experiment KV adoption surface. |
| B | 5.5 | Lightweight topology experiments | First actual visual experiment. Conditional. |
| B | 5.6 | Optional GPU-enhanced rendering | WebGPU, route-isolated. Strictly conditional. |
| B | 5.7 | Local-first exploration prototypes | WebLLM-flavoured. Strictly conditional. |
| C | 5.8 | Multimodal experimental surfaces | Conditional + sandboxed. |
| C | 5.9 | Additional sub-agents | Constitutional MUST: one new agent at a time. |
| C | 5.10 | Conditional live systems | Most invasive of Phase 5. May never ship. |

Priority B and C are strictly conditional. The audit recommends
shipping Priority A in full before opening any B work.

---

## 6. Audit recommendation

**Proceed with Sub-PR 5.1 only.**

Rationale: 5.1 is a foundation that delivers value as scaffolding
without exposing any visitor-facing experimental surface. It
satisfies the constitutional MUSTs (measurable, reversible,
isolated, performance-safe, opt-in, maintenance-aware) and adds
zero new public functionality.

Each subsequent Phase 5 sub-PR will require its own approval and
its own narrow audit. If the trigger conditions never reach the
five-of-five threshold, Priority A may be the only Phase 5 work
that ever ships — which the V4 doc explicitly anticipates as
"disciplined product evolution", not failure.
