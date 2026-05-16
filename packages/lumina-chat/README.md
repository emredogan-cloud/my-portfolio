# `@emredogan/lumina-chat`

> A drop-in cinematic AI chat widget for React. Neural-core avatar, smooth motion, tool-use rendering, voice-ready. **Bring your own `/api/chat` endpoint.**

[![npm](https://img.shields.io/npm/v/@emredogan/lumina-chat.svg?style=flat-square&color=00d2ff)](https://www.npmjs.com/package/@emredogan/lumina-chat)
[![types](https://img.shields.io/npm/types/@emredogan/lumina-chat.svg?style=flat-square&color=00d2ff)](https://www.npmjs.com/package/@emredogan/lumina-chat)
[![license](https://img.shields.io/npm/l/@emredogan/lumina-chat.svg?style=flat-square&color=00d2ff)](./LICENSE)
[![bundle](https://img.shields.io/bundlephobia/minzip/@emredogan/lumina-chat.svg?style=flat-square&color=00d2ff&label=bundle)](https://bundlephobia.com/package/@emredogan/lumina-chat)

Lumina is the same chat widget that ships on [emredogan.com](https://emredogan.com), now extracted as a reusable package. It pairs a dormant cyan "neural core" trigger with a cinematic chat panel that wakes up, plays a welcome sequence, and feels like a piece of intelligent software — not a customer-support bubble.

---

## Why Lumina

Most chat widgets feel grafted on. Lumina was designed as the centerpiece of a portfolio site, then extracted once the patterns proved stable. What you get:

- **A presence, not a popup.** The trigger pulses gently like dormant infrastructure. The window opens centered on first visit with a 3-line welcome sequence, then pins to the corner once the user closes it.
- **Designed-in reliability.** The conversation persists across page reload via `sessionStorage`. The input has three independent unlock paths so it can never deadlock during the welcome sequence — even under React Strict Mode's double-render.
- **Tool-use rendering, out of the box.** When your AI calls a tool, the response stream renders an inline status pill (`searching notes…` → `searching notes ✓`). Configure the labels with one prop.
- **Bring your own backend.** The package POSTs to whatever endpoint you wire up. AI SDK's `useChat` hook does the heavy lifting under the hood, so any server route that accepts AI SDK messages and returns a streaming response works — Anthropic, OpenAI, Mistral, your own LLM proxy, anything.
- **Cinematic motion budget.** All animations are compositor-friendly (opacity + transform). No `backdrop-filter`. No per-frame paints. The widget idles at zero GPU cost.

---

## Install

```bash
npm install @emredogan/lumina-chat
```

`react` and `react-dom` (≥18) are peer dependencies. The package itself depends on `motion`, `lucide-react`, `@ai-sdk/react`, and `ai` — these install automatically.

You also need **Tailwind CSS (v3 or v4)** in the consumer project. The components use Tailwind utility classes for layout and typography. If you're not on Tailwind yet, [install it in 60 seconds](https://tailwindcss.com/docs/installation).

---

## Quick start

```tsx
// app/layout.tsx (Next.js App Router)
import "@emredogan/lumina-chat/styles.css";
import { LuminaChat } from "@emredogan/lumina-chat";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        {children}
        <LuminaChat />
      </body>
    </html>
  );
}
```

Now wire up the backend. Lumina POSTs AI SDK messages to `/api/chat` by default — the simplest possible Next.js handler that streams Claude responses:

```ts
// app/api/chat/route.ts
import { anthropic } from "@ai-sdk/anthropic";
import { streamText, convertToModelMessages, type UIMessage } from "ai";

export const maxDuration = 30;

export async function POST(req: Request) {
  const { messages }: { messages: UIMessage[] } = await req.json();
  const result = streamText({
    model: anthropic("claude-haiku-4-5-20251001"),
    messages: convertToModelMessages(messages),
  });
  return result.toUIMessageStreamResponse();
}
```

That's the minimum mount. Everything else is opt-in.

---

## Customization

```tsx
<LuminaChat
  assistantName="Aria"
  welcomeMessages={[
    "Welcome to Acme.",
    "I'm Aria, your shopping assistant.",
    "What are you looking for today?",
  ]}
  placeholder="Ask Aria anything..."
  position="centered-then-bottom-right"
  autoOpenDelayMs={2000}
  dimOverlay={true}
  theme={{
    brandColor: "#ff6b00",
    avatarSrc: "/aria-avatar.png",
    glowIntensity: 0.85,
  }}
  toolLabels={{
    searchProducts: "searching catalog",
    checkInventory: "checking stock",
    calculateShipping: "calculating shipping",
  }}
  transport={{
    apiEndpoint: "/api/aria-chat",
    bodyExtras: () => ({ locale: "en-US", cartId: getCartId() }),
  }}
  persistence={{
    conversationKey: "aria-conversation-v1",
    minimizedKey: "aria-minimized-v1",
  }}
/>
```

### Props at a glance

| Prop | Type | Default | What it does |
|---|---|---|---|
| `welcomeMessages` | `readonly string[]` | 3-line generic intro | Lines played in sequence on first open. Empty array skips the welcome. |
| `assistantName` | `string` | `"Lumina"` | Display name in the window header. |
| `placeholder` | `string` | `"Ask Lumina anything..."` | Input placeholder once unlocked. |
| `position` | `"centered-then-bottom-right" \| "bottom-right"` | first | Lifecycle mode. `bottom-right` skips the centered first reveal. |
| `autoOpenDelayMs` | `number` | `1500` | Auto-open delay on first visit. `0` disables auto-open. |
| `dimOverlay` | `boolean` | `true` | Whether the centered first open dims the page. |
| `theme.brandColor` | `string` (hex) | `"#00d2ff"` | Re-tints avatar glow, trigger pulse, input focus, tool pills. |
| `theme.avatarSrc` | `string` | _none_ | Avatar PNG/JPG. Falls back to a pure-CSS gradient if missing or 404. |
| `theme.glowIntensity` | `number` | `1` | Multiplier for the avatar's outer glow. Reduce on busy backgrounds. |
| `toolLabels` | `Record<string, string>` | `{}` | Map of tool name → human label for inline tool-use pills. |
| `transport.apiEndpoint` | `string` | `"/api/chat"` | The endpoint that streams chat responses. |
| `transport.bodyExtras` | `() => Record<string, unknown>` | _none_ | Returns extras merged into every chat request body. |
| `persistence.conversationKey` | `string` | `"lumina-conversation-v1"` | sessionStorage key for chat history. Empty string disables. |
| `persistence.minimizedKey` | `string` | `"lumina-minimized-v1"` | sessionStorage key for the "user closed once" flag. |

---

## Composition (advanced)

If you don't want the orchestrator's lifecycle, compose the parts directly:

```tsx
import { LuminaWindow, LuminaTrigger } from "@emredogan/lumina-chat";

function MyChat() {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <>
      <LuminaTrigger isOpen={isOpen} onClick={() => setIsOpen(true)} />
      <LuminaWindow
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        hasBeenMinimized={true}  // skip the centered first reveal
        welcomeMessages={[]}     // skip welcome too
      />
    </>
  );
}
```

The `LuminaAvatar` is also exported standalone if you want to use the cyan neural-core circle elsewhere on your site.

---

## Server contract

The `transport.apiEndpoint` (default `/api/chat`) must accept a POST body shaped like:

```ts
{
  messages: UIMessage[];           // AI SDK 6 UIMessage shape
  ...bodyExtras                    // anything you returned from bodyExtras()
}
```

…and return a streaming response that AI SDK's `useChat` hook understands. The simplest implementation is `streamText(...).toUIMessageStreamResponse()` from the `ai` package, as shown in the Quick start above.

For tool use, register your tools on the server side and pass them to `streamText`:

```ts
const result = streamText({
  model: anthropic("claude-haiku-4-5-20251001"),
  messages: convertToModelMessages(messages),
  tools: { searchProducts, checkInventory },
});
```

The chat panel will automatically render an inline pill for each tool call. Map the tool names to human labels via the `toolLabels` prop.

---

## Browser support

- Modern evergreen browsers (Chrome, Edge, Firefox, Safari — last 2 versions).
- React 18 and React 19.
- Server-side rendering (Next.js, Remix, Astro islands) is supported — components are `"use client"` and degrade gracefully on the server.
- IE11: not supported. Safari < 14: untested.

---

## Performance notes

- **Idle CPU: zero.** All animations idle to a steady state, at which point `motion/react` stops the requestAnimationFrame loop entirely.
- **No `backdrop-filter`.** Early prototypes used full-viewport blur on the dim overlay; profiling showed this was the primary cause of jank on lower-end devices. The current dim is a simple opaque layer.
- **Tree-shakeable.** Per-file ESM emission means bundlers only pull what you import. If you only need `LuminaAvatar`, the trigger and window code never lands in your bundle.
- **Minified package size: ~10 KB gzipped** (the JS only — `motion`, `lucide-react`, and `ai` are larger and shared with the rest of your app).

---

## Roadmap

- **Voice mode.** Mic-button + streaming TTS already exists in the source portfolio; extracting it cleanly is the v0.2 milestone.
- **Headless mode.** Expose the `useChat` orchestration as a hook for consumers who want full control over the markup.
- **Theming via CSS custom properties.** Currently themed via inline RGB; a `--lumina-brand` custom property surface is on the way for static-CSS workflows.

---

## License

MIT © [Emre Doğan](https://emredogan.com)
