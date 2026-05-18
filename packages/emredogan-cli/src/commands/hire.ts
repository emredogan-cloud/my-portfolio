/**
 * `emredogan hire` — print Emre's contact card.
 *
 * V4 Phase 2, CLI v0.1.1 expansion. Pure stdout write — no API
 * call, no network, no env dependency. Bytes-on-stdin to bytes-
 * on-stdout.
 *
 * Design posture: cinematic Unix manpage / business-card feel.
 * Single bordered box drawn with U+2500-series box-drawing
 * characters. The contact rows align in a `label  value`
 * two-column layout. The closing block mirrors the /about
 * page's "operator manifesto" voice — references the bakery
 * shift in past tense, names the operating tempo.
 *
 * Card width chosen so the longest line fits comfortably inside
 * 78 columns (the conservative POSIX line limit). LinkedIn URL
 * is the longest visible line at ~50 chars.
 *
 * Exit code: always 0 (pure print).
 */

const CARD = `
  ┌──────────────────────────────────────────────────────────┐
  │                                                          │
  │   ED.                                                    │
  │   Emre Doğan                                             │
  │   Cloud & SaaS Engineer · Adana · GMT+3                  │
  │                                                          │
  │   email      emre30283@gmail.com                         │
  │   site       emredogan.com                               │
  │   github     github.com/emredogan-cloud                  │
  │   linkedin   linkedin.com/in/emre-doğan-657a99388        │
  │                                                          │
  │   status     Monk Mode · daily build window              │
  │              the 01:30 bakery shift in past tense        │
  │              long arcs · slow is smooth · smooth is fast │
  │                                                          │
  │   to talk    \`emredogan ask "<question>"\`                 │
  │                                                          │
  └──────────────────────────────────────────────────────────┘
`;

export async function runHire(): Promise<number> {
  process.stdout.write(CARD);
  return 0;
}
