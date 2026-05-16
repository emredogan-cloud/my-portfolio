/**
 * Public type surface for @emredogan/lumina-chat.
 *
 * Every prop is optional and has a sensible default; the minimum
 * usable mount is `<LuminaChat />` once a `/api/chat` endpoint
 * exists. Customize from there.
 */

export interface LuminaTheme {
  /** Hex (`#00d2ff` style). Used for the avatar glow, the trigger
   *  pulse, the input focus ring, and tool-call status pills. */
  brandColor?: string;
  /** Avatar image URL. Falls back to a pure-CSS radial gradient if
   *  the image fails to load (e.g. consumer hasn't dropped a PNG
   *  into /public yet). */
  avatarSrc?: string;
  /** Strength multiplier for the avatar's outer glow. 1 = spec
   *  intensity. Reduce on backgrounds where the cyan halo competes
   *  with content. */
  glowIntensity?: number;
}

export interface LuminaPersistence {
  /**
   * sessionStorage key for the conversation history. Empty string
   * disables persistence. Default `"lumina-conversation-v1"`.
   *
   * The "v1" suffix lets you invalidate the schema on breaking
   * changes — bump to "v2" and old saved conversations will be
   * ignored gracefully.
   */
  conversationKey?: string;
  /**
   * sessionStorage key for the "user has minimized once" flag, which
   * controls whether subsequent opens go to centered or bottom-right.
   * Empty string disables; default `"lumina-minimized-v1"`.
   */
  minimizedKey?: string;
}

export interface LuminaTransportConfig {
  /** Endpoint that the underlying useChat hook POSTs to. Must accept
   *  AI SDK message arrays and return a streaming response. Default
   *  `"/api/chat"`. */
  apiEndpoint?: string;
  /**
   * Optional body augmentation. Returned object is shallow-merged into
   * the chat request body on every send — handy for passing a
   * sessionId, locale, or feature flags through to the server route.
   */
  bodyExtras?: () => Record<string, unknown>;
}

/** Layout mode for the window. `centered-then-bottom-right` (default)
 *  matches the portfolio behaviour: first open is dramatic centre-of-
 *  screen, after the user closes once it pins to the corner.
 *  `bottom-right` skips the centred first reveal entirely. */
export type LuminaPositionMode =
  | "centered-then-bottom-right"
  | "bottom-right";

export interface LuminaChatProps {
  /** Welcome messages, played in sequence on first open. Default is
   *  a generic 3-line introduction; override to brand it for your
   *  product. Empty array skips the welcome sequence entirely. */
  welcomeMessages?: readonly string[];
  /** Display name in the window header. Default `"Lumina"`. */
  assistantName?: string;
  /** Input placeholder. Default `"Ask Lumina anything..."`. */
  placeholder?: string;
  /** Position behaviour. Default `"centered-then-bottom-right"`. */
  position?: LuminaPositionMode;
  /** Auto-open delay on first visit, in ms. `0` disables auto-open
   *  entirely (the user must click the trigger). Default `1500`. */
  autoOpenDelayMs?: number;
  /** When in centered mode on first open, dim the rest of the page
   *  for cinematic focus. Default `true`. */
  dimOverlay?: boolean;
  /** Map of tool name → human label, used to render tool-call pills
   *  inline (e.g. `{ searchNotes: "searching notes" }`). Unknown
   *  tool names fall back to a humanized form of the name. */
  toolLabels?: Readonly<Record<string, string>>;
  /** Theme overrides. */
  theme?: LuminaTheme;
  /** Persistence keys. Pass `{ conversationKey: "" }` to fully
   *  disable conversation persistence. */
  persistence?: LuminaPersistence;
  /** Transport config (endpoint + body extras). */
  transport?: LuminaTransportConfig;
}

/** Props for the standalone window — most consumers want LuminaChat,
 *  but advanced users can compose their own trigger + window. */
export interface LuminaWindowProps
  extends Omit<LuminaChatProps, "autoOpenDelayMs" | "dimOverlay"> {
  isOpen: boolean;
  onClose: () => void;
  hasBeenMinimized: boolean;
}

export interface LuminaTriggerProps {
  isOpen: boolean;
  onClick: () => void;
  /** Optional theme override — only `brandColor` matters here. */
  theme?: Pick<LuminaTheme, "brandColor">;
}

export interface LuminaAvatarProps {
  /** Tailwind sizing/positioning classes. Default sets a responsive
   *  scale: 96px on mobile, 128px on desktop. */
  className?: string;
  /** Theme override. */
  theme?: LuminaTheme;
}
