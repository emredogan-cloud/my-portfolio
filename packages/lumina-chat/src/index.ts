/**
 * @emredogan/lumina-chat — public entry point.
 *
 * Stable public API surface:
 *   - LuminaChat       composed orchestrator (trigger + window + dim)
 *   - LuminaWindow     the chat panel itself (advanced composition)
 *   - LuminaTrigger    the dormant-core activator button
 *   - LuminaAvatar     the cyan neural-core circle
 *
 * Style import (consumers must include this once at app startup):
 *   import "@emredogan/lumina-chat/styles.css";
 */

export { LuminaChat } from "./LuminaChat.js";
export { LuminaWindow } from "./LuminaWindow.js";
export { LuminaTrigger } from "./LuminaTrigger.js";
export { LuminaAvatar } from "./LuminaAvatar.js";

export type {
  LuminaTheme,
  LuminaPersistence,
  LuminaTransportConfig,
  LuminaPositionMode,
  LuminaChatProps,
  LuminaWindowProps,
  LuminaTriggerProps,
  LuminaAvatarProps,
} from "./types.js";
