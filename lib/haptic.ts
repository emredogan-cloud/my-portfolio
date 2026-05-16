/**
 * Haptic feedback helpers — thin wrappers around the Vibration API.
 *
 * Platform reality (worth being explicit about, because it shapes
 * where we use these and what we expect):
 *   - Android Chrome/Firefox: navigator.vibrate(...) works.
 *   - iOS Safari: navigator.vibrate is undefined. iOS does not expose
 *     the haptics engine to web pages. These calls are silent no-ops
 *     on iOS — that's the right behaviour, since iOS users get
 *     subtle UI motion as their tactile affordance.
 *   - Desktop: the API exists in Chrome/Edge but vibration motors
 *     don't, so the calls are also no-ops.
 *
 * Why we still ship this:
 *   - Android is ~70% of mobile globally. A small, intentional
 *     vibration on the primary CTA (open Lumina, send message,
 *     decompose-bento) makes the widget feel like real software,
 *     not a webpage. The cost of the polyfill check is one
 *     property-existence check.
 *
 * Reduced motion:
 *   - All three helpers bail when prefers-reduced-motion: reduce is
 *     set. Vibration is motion; visitors who opted out should get
 *     silence. We check via matchMedia at call time (cheap), not at
 *     module load (which would lock the value before user changes).
 *
 * Patterns:
 *   - tap()      — 10ms blip for everyday primary taps.
 *   - confirm()  — short two-pulse pattern for "I committed to this"
 *                  moments (sending a message, decompose trigger).
 *   - error()    — longer, distinct pattern for "something went
 *                  wrong" — currently unused but available for
 *                  future error states.
 */

const TAP_DURATION_MS = 10;
const CONFIRM_PATTERN = [12, 28, 12] as const;
const ERROR_PATTERN = [60, 30, 60] as const;

function isReducedMotion(): boolean {
  if (typeof window === "undefined") return true;
  if (typeof window.matchMedia !== "function") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function vibrate(pattern: number | readonly number[]): void {
  if (typeof navigator === "undefined") return;
  if (typeof navigator.vibrate !== "function") return;
  if (isReducedMotion()) return;
  // Vibration API rejects readonly arrays under strict TS — spread
  // into a fresh mutable array. The cost is negligible.
  navigator.vibrate(typeof pattern === "number" ? pattern : [...pattern]);
}

/** Single 10ms blip — primary tap. Use sparingly: every nav link
 *  vibrating is haptic spam. Reserve for the visitor's most-touched
 *  primary action on a screen. */
export function tapHaptic(): void {
  vibrate(TAP_DURATION_MS);
}

/** Two-pulse pattern — "I committed to this" moments. Reserve for
 *  send-message, submit-form, trigger-effect interactions where the
 *  visitor wants tactile confirmation that the system received their
 *  intent. */
export function confirmHaptic(): void {
  vibrate(CONFIRM_PATTERN);
}

/** Long distinct pattern — error states. Currently exported for
 *  future use; no callers wire it yet. */
export function errorHaptic(): void {
  vibrate(ERROR_PATTERN);
}
