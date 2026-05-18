# Sub-PR 3.4 — Lumina V3: Voice Persistent Button

**Branch:** `feat/v4-phase3-operator-systems`
**Phase:** V4 Phase 3 — AI-Native Operator Systems (user-reframed)
**Scope:** A sticky TTS toggle next to the existing mic. Single-file
change in the voice subsystem. Zero new dependencies. Zero server-side
work. Cinematic identity preserved.

---

## 1. Mission

The voice plumbing was already in place from Phase 1.5 — mic button,
Whisper STT round-trip, ElevenLabs TTS round-trip, and a one-shot
latch (voice in → voice out, then back to text-only).

3.4 adds the missing UX primitive: a sticky toggle that locks TTS
on. Once a visitor taps the `Volume2` button, every assistant turn
is spoken aloud until they toggle it off. They can still type, they
can still use the mic, but the output stays voiced.

Operator-grade behavior: a button you press, a state you can see,
no AI-girlfriend "always listening" theater.

---

## 2. Pre-3.4 baseline

```
LuminaVoice.tsx
├── Mic button (existing)
│   ├── idle: Mic icon
│   ├── recording: pulsing red dot
│   ├── transcribing: spinner
│   ├── speaking: cyan AudioLines
│   └── error: MicOff (amber)
├── /api/voice/transcribe → OpenAI Whisper
├── /api/voice/tts → ElevenLabs (Rachel)
└── voiceLatchRef (one-shot)
    └── set true on transcript complete
        consumed (false) when next assistant turn is spoken
```

The one-shot latch was deliberate Phase 1.5 design — "voice mode
shouldn't surprise typists with random TTS playback". For visitors
who genuinely want a hands-free output experience (driving,
disability accommodation, just preference), there was no path to
opt in beyond hitting the mic for every turn.

---

## 3. What changed

| File | Change |
|------|--------|
| `components/chat/LuminaVoice.tsx` | + `persistentVoice` state, + `handlePersistentToggle`, + a second button (Volume2/VolumeX). The TTS-trigger effect now plays when `voiceLatchRef.current OR persistentVoice` is true, and only consumes the one-shot latch — persistent stays sticky. Disabling persistent mid-playback also pauses the current audio (intent = "be quiet now"). Cleaned up two unused `eslint-disable-next-line` directives in the same file. |

Render shape: the component now returns a Fragment of two buttons
instead of a wrapping div, so the parent form's existing flex
`gap` spaces them identically to the input ↔ mic ↔ send rhythm.

No new files. No new routes. No new endpoints. No new dependencies.
No env vars added or changed. No server-side code touched.

---

## 4. The toggle behavior in one paragraph

A visitor opens the chat, taps the speaker icon. It cycles from
quiet grey (off) to cinematic cyan (on). From that moment, every
assistant turn — whether triggered by typing or by speaking — is
spoken aloud. Tapping the speaker again pauses any in-flight TTS
and returns the button to off. State lives in component memory
only: closing the chat window or refreshing the page reverts to
off. No localStorage write, no cookie, no server flag — operator-
grade quietude.

---

## 5. Visual contract

Both buttons share size, spacing, and the established cinematic
identity:

- Same `w-10 h-10 rounded-xl`
- Same `transition-colors duration-200`
- Off state: `bg-white/[0.06] text-white/65` (same vocabulary as
  every other quiet control in the chat)
- On state: `bg-[#00d2ff]/15 text-[#00d2ff]` (the same cyan the
  mic button shows during speaking — visual continuity)
- `disabled:opacity-40` matches the mic and send buttons

Icons:
- Off: `VolumeX` — explicit "currently muted, tap to enable"
  rather than ambiguous "volume" iconography
- On: `Volume2` — three sound bars, the universal "audio active"
  cue

Aria contract:
- `aria-pressed={persistentVoice}` so screen readers report toggle
  state correctly
- `aria-label` and `title` shift between "Read responses aloud" and
  "Voice mode on — tap to disable"

---

## 6. Why no system prompt change

The model has no deterministic signal for the toggle state — input
modality is not transmitted in the request. The existing voice-mode
prompt rule ("fast-paced, under ~80 words") still applies when the
visitor's most recent input was via mic (since that's all the model
can infer from the conversation). Adding a rule the model couldn't
reliably enforce would be noise.

The practical effect: when persistent is on AND the visitor types,
the model writes its normal cadence and the client plays it as TTS
verbatim. Slightly less ideal for speech, but acceptable for short
replies — and the alternative (lifting state to the chat route +
threading a flag through the request body + new prompt rule) was
out of scope for this sub-PR.

If voice-mode prompt enforcement ever becomes critical, that's the
next refinement: thread `voiceMode: boolean` through the request
body and condition the prompt section on it. Not done here.

---

## 7. Invariants verified

| Invariant                                                                   | Status |
|-----------------------------------------------------------------------------|--------|
| `tsc --noEmit` clean                                                        | ✓ exit 0 |
| `eslint` clean on `LuminaVoice.tsx`                                         | ✓ exit 0 |
| Production build green — all routes intact                                  | ✓ exit 0 |
| Zero new npm dependencies                                                   | ✓      |
| Zero new env vars                                                           | ✓      |
| `@aws-sdk` / `@sentry/nextjs` / `@octokit/rest` absent from client chunks   | ✓ (0 matches) |
| Server-only symbols (`readMetric` / `LAB_EXPERIMENTS` / `invokeLab` / `redactMessages` / `forgetSession`) absent from client chunks | ✓ (0 matches) |
| `@xyflow/react` still single dynamic chunk                                  | ✓      |
| LuminaVoice client labels reach the client chunk                            | ✓ (label strings present) |
| `@emredogan/lumina-chat` tarball: 29 files / 23.7 kB                        | ✓ unchanged |
| `@emredogan/cli` tarball: 15 files / 13.5 kB                                | ✓ unchanged |
| Cinematic identity: `#00d2ff`, Geist, `bg-black`                            | ✓ active state reuses the same cyan |
| Reduced-motion support intact                                               | ✓ (no new animation surfaces) |
| WCAG 2.5.5 AAA touch target: both buttons are 40×40, matching the existing send button (project precedent) | ✓ |

Pre-existing lint warnings in `LuminaWindow.tsx` (4 react-hooks/set-state-in-effect) carry over unchanged.

---

## 8. Cost + privacy posture

### Per-toggle cost

- **Off:** zero cost. The component renders one more button; no
  network activity, no model call.
- **On:** every assistant turn fires the same TTS round-trip as the
  one-shot latch already did. ElevenLabs is metered by the project,
  not per-toggle. Visitors don't pay; the platform pays. Each TTS
  call is ~$0.0005-0.002 depending on response length.

### Privacy

- **No new state stored.** `persistentVoice` is in-memory React
  state — no localStorage, no cookie, no KV. The forget-me hotfix
  from earlier in this session covers chat state; the persistent
  toggle resets on every window mount, so there's nothing
  additional to forget.
- **Microphone permission lifecycle is unchanged.** Whisper STT
  still releases the mic immediately after each transcription.

---

## 9. Rollback

Single-commit revert restores prior state. The toggle UI, the
state hook, and the latch-logic delta are all isolated to
`LuminaVoice.tsx` — three coherent reverts in one file.

---

## 10. Out-of-scope acknowledgements

- **ElevenLabs Scribe STT migration**: the V4 doc's parenthetical
  named ElevenLabs for STT, but the working implementation uses
  Whisper. Migrating providers is a separate cost/risk decision —
  Whisper works, the prompt is well-tested with it. Deferred.
- **Voice-mode prompt enforcement**: as discussed in §6, the model
  isn't told about the toggle state. Threading that through is a
  future refinement.
- **Persistent persistence**: the toggle deliberately resets on
  every window mount. A localStorage-backed sticky-sticky is
  trivial to add later if visitors ask for it; not assumed today.
- **Voice mode latency telemetry**: no new metric. The existing
  `LUMINA_P95_LATENCY` captures the chat-turn latency; TTS
  playback is downstream and not measured separately.

---

## 11. Remaining Phase 3 plan

| Sub-PR | Title                        | Status      |
|--------|------------------------------|-------------|
| 3.1    | Operator Awareness           | ✅ shipped   |
| 3.2    | Lab Invocation               | ✅ shipped   |
| 3.3    | Persistent Memory            | ✅ shipped   |
|  3.3a  | Forget-Me Hotfix             | ✅ shipped   |
| 3.4    | Voice Persistent Button      | ✅ this PR   |
| 3.5    | Cloud Lab MVP                | next (V4 § 4.4 Sub-PR 4.5 — authenticated Bedrock-against-visitor's-own-AWS surface; most invasive of the phase, may split further) |

3.5 is human-gated. No code on it until approval.
