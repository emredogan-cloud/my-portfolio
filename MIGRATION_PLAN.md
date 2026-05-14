You are an elite Frontend Migration Architect, Motion Systems Engineer, and Next.js App Router specialist.

We have created a breathtaking cinematic UI prototype inside a separate Vite project.

Your mission is to migrate this experience into our production-grade Next.js App Router portfolio WITHOUT losing:

* visual fidelity
* animation quality
* cinematic atmosphere
* responsive behavior
* motion choreography
* performance quality

This is NOT a copy-paste task.

This is a HIGH-END FRONTEND MIGRATION.

==================================================
SOURCE PROJECT
==============

Source directory:

```txt id="m3wj4k"
/Downloads/web-site-deneme
```

Destination:
Our existing Next.js App Router project.

==================================================
MIGRATION OBJECTIVE
===================

Replace the current homepage experience with the cinematic Prisma-inspired design system from the Vite project while preserving:

* Next.js App Router architecture
* performance
* hydration stability
* SEO foundations
* responsive behavior
* maintainability

The final result must feel IDENTICAL to the source Vite project,
but implemented natively and correctly inside Next.js.

==================================================
PHASE 1 — SOURCE ANALYSIS
=========================

FIRST:
Analyze the entire source project before migrating anything.

Inspect carefully:

* `src/App.tsx`
* `src/main.tsx`
* `src/index.css`
* `tailwind.config.js`
* `src/components/**/*`
* `src/assets/**/*`
* `public/**/*`

Understand:

* animation systems
* layout composition
* spacing rhythm
* typography scales
* motion choreography
* responsive behavior
* color palette
* cinematic layering
* utility classes
* custom CSS
* asset usage
* Framer Motion patterns

CRITICAL:
Do NOT blindly copy code.

Understand the architecture first.

==================================================
PHASE 2 — ASSET MIGRATION
=========================

Locate ALL assets used by the Vite project:

* images
* videos
* SVGs
* textures
* noise overlays
* icons
* local fonts

COPY them into:

```txt id="7whc0h"
public/
```

inside the Next.js project.

CRITICAL RULES:

* Preserve filenames
* Preserve folder hierarchy where reasonable
* Optimize organization
* Remove unused duplicate assets

DO NOT leave assets referenced from the old Vite paths.

==================================================
PHASE 3 — NEXT.JS CONFIGURATION ADAPTATION
==========================================

Migrate the design system carefully.

==================================================
TAILWIND CONFIG
===============

DO NOT blindly overwrite the existing Tailwind config.

Instead:

* MERGE the Vite Tailwind theme
  with the existing Next.js config.

Preserve:

* existing breakpoints
* plugins
* utilities
* dark mode config
* animations already in use

Migrate:

* colors
* typography
* spacing tokens
* shadows
* gradients
* custom utilities
* cinematic theme extensions

==================================================
GLOBAL CSS
==========

Use the Vite `index.css`
as the cinematic design foundation.

HOWEVER:
Do NOT destroy existing:

* hydration fixes
* Next.js-specific globals
* accessibility utilities
* existing motion utilities

MERGE intelligently.

Preserve:

```css id="x6cc4m"
@tailwind base;
@tailwind components;
@tailwind utilities;
```

CRITICAL:
Ensure all:

* cinematic grain
* noise overlays
* blur systems
* glassmorphism utilities
* custom animations
* motion utilities

remain fully functional.

==================================================
PHASE 4 — FONT SYSTEM MIGRATION
===============================

If the Vite project uses Google Fonts imports,
convert them to:

```tsx id="5d0ej3"
next/font/google
```

inside Next.js App Router.

DO NOT keep legacy CSS @import font loading.

Fonts must:

* preload correctly
* avoid CLS
* remain visually identical

==================================================
PHASE 5 — COMPONENT PORTING
===========================

Rebuild the Vite components
inside:

```txt id="n3aqoo"
src/components/
```

using proper Next.js architecture.

==================================================
CLIENT/SERVER BOUNDARY RULES
============================

CRITICAL:

ONLY components requiring:

* Framer Motion
* useState
* useEffect
* DOM APIs
* event handlers

should use:

```tsx id="31i5i2"
"use client";
```

DO NOT convert the entire app into client components.

Preserve SSR wherever possible.

==================================================
ROUTING MIGRATION
=================

Replace internal:

```tsx id="1cazn6"
<a>
```

links with:

```tsx id="nt5q7q"
<Link>
```

from:

```tsx id="3w6gj1"
next/link
```

External links may remain `<a>`.

==================================================
IMAGE OPTIMIZATION
==================

Replace standard:

```tsx id="l4u6yt"
<img>
```

with:

```tsx id="rm7u4x"
<Image />
```

from:

```tsx id="h6r7uc"
next/image
```

WHEN appropriate.

Preserve:

* object-cover behavior
* responsiveness
* cinematic presentation

DO NOT break layout composition.

==================================================
PHASE 6 — HOMEPAGE RECONSTRUCTION
=================================

Completely rebuild:

```txt id="1xq6ij"
src/app/page.tsx
```

using the Vite homepage structure.

The homepage MUST preserve:

* Hero section
* cinematic typography
* animated text reveals
* Bento Grid
* atmospheric spacing
* motion choreography
* cinematic layering

VISUAL FIDELITY IS CRITICAL.

The final page should look visually identical
to the original Vite implementation.

==================================================
PHASE 7 — MOTION SYSTEM PRESERVATION
====================================

Preserve ALL premium motion behavior:

* stagger reveals
* fade-ups
* scroll-linked opacity
* hover micro-interactions
* cinematic easing
* ambient transitions

Use the exact motion curves from the source project.

CRITICAL:
Motion should feel:

* soft
* premium
* weighted
* cinematic

NOT:

* snappy
* aggressive
* playful

==================================================
PHASE 8 — HYDRATION SAFETY
==========================

Prevent hydration issues.

Requirements:

* preserve suppressHydrationWarning where needed
* ensure deterministic rendering
* avoid random client-side values on first render
* stabilize Framer Motion initial states
* preserve Dark Reader compatibility

Any component using browser-only APIs
must remain client-only.

==================================================
PHASE 9 — PERFORMANCE OPTIMIZATION
==================================

The migration MUST remain performant.

Requirements:

* maintain 60fps animations
* use transform/opacity animations where possible
* avoid layout thrashing
* preserve lazy loading
* optimize videos/images
* avoid unnecessary client rendering
* preserve Core Web Vitals

==================================================
PHASE 10 — RESPONSIVE PARITY VALIDATION
=======================================

The migrated Next.js version MUST match
the Vite version across:

* mobile
* tablet
* desktop
* ultra-wide displays

Preserve:

* spacing
* scaling
* typography rhythm
* cinematic composition

==================================================
FINAL REQUIREMENTS
==================

DO NOT:

* redesign the UI
* simplify animations
* remove cinematic effects
* flatten the visual depth
* replace motion systems with generic transitions

DO:

* preserve the masterpiece exactly
* adapt it correctly for Next.js App Router
* maintain production-level quality
* preserve engineering cleanliness

The final result should feel like:

* a premium Apple-quality experience
* a cinematic AI-native interface
* a world-class frontend production

Execute the migration carefully and completely.
