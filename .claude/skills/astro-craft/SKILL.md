---
name: astro-craft
description: Astro + Tailwind v4 best-practices reference for building static sites deployed to Cloudflare. Load when writing or reviewing .astro components/pages, deciding whether to use an island, setting up animations, handling images, or configuring the static build. Used by the astro-builder and code-reviewer agents.
---

# Astro Craft — best practices for this boilerplate

Static-first Astro 7 + Tailwind v4, deployed to Cloudflare Workers static assets. Zero
framework runtime by default. When unsure about an API, consult current Astro docs via
context7 — this project deliberately tracks the latest Astro, which may differ from memory.

## Component model

- `.astro` files: JS/TS **frontmatter** between `---` fences runs at **build time**; the
  template below renders to static HTML. No client JS ships unless you add a `<script>` or an
  island.
- Props: type them with an `interface Props { … }` and destructure `Astro.props`.
- Composition: `<slot />` (default) and named slots (`<slot name="head" />`).
- Reuse layouts (`src/layouts/*.astro`) for page shells; components (`src/components/*.astro`)
  for sections/pieces; icons as `src/components/icons/*.astro`.

## Islands — the default is NONE

This project reproduces sites with **vanilla JS + GSAP**, not framework islands.

- Prefer a scoped `<script>` in the `.astro` file for interactivity/animation.
- Only reach for a framework island (`@astrojs/react` + `client:*`) when a component has
  genuinely complex client state (e.g. a stateful multi-step widget) that vanilla JS would
  make brittle. If you add one, justify it and use the narrowest directive
  (`client:visible` > `client:idle` > `client:load`).

## Scripts & animation

- A bare `<script>` in a `.astro` file is processed & bundled by Astro and runs on the client.
  Use it for GSAP, `IntersectionObserver`, Lenis, etc.
- GSAP is a dependency: `import gsap from "gsap"; import { ScrollTrigger } from "gsap/ScrollTrigger";`
  then `gsap.registerPlugin(ScrollTrigger)`. Use `ScrollTrigger` for scroll-driven scenes,
  `IntersectionObserver` for simple reveals/active-section tracking.
- Match the extracted interaction model exactly (scroll-driven vs click-driven).
- Use `is:inline` only when you must skip bundling (rare — e.g. a third-party snippet).

## Reconstructing from real source (source-first)

When rebuilding from a target's captured HTML (`docs/research/<host>/raw/index.pretty.html`):

- **Preserve exact class strings.** Target + we are both Tailwind v4, so arbitrary utilities
  (`bg-[image:repeating-linear-gradient(...)]`, `[--pattern-fg:...]`, `col-start-15`, `h-112`,
  `text-[2.5rem]/10`) compile verbatim. Convert React-isms: `className`→`class`, self-close
  void tags, drop RSC `$L..` placeholders (rebuild that child from the visible DOM).
- **Literal braces need `set:html`.** Astro parses `{ }` in the template as expressions, so a
  pasted code-editor block breaks. Emit it raw: `<Fragment set:html={\`<div>…{ }…</div>\`} />`
  (confirm no backticks/`${}` inside). Tailwind still scans those literal classes.
- **Media:** run `node scripts/inspection/rewrite-media.mjs <file> <assets.json>` to map
  `/_next/.../media/*` → `/images/*` and inject width/height + `loading="lazy"`.
- **Frame vs section:** page-level chrome (3-col grid + gutter rails, fixed header, section
  hairlines/eyebrows) belongs in `BaseLayout.astro`; sections render into its content slot.
  **Gotcha:** source section roots carry `col-start-*/row-start-*`; nesting them in a CSS
  **grid** spawns implicit tracks and scatters them into columns — use `flex flex-col` for the
  content wrapper (those classes then stay inert) or make sections direct grid children.

## Styling — Tailwind v4

- Tailwind is wired via `@tailwindcss/vite`; global CSS is `src/styles/global.css` with
  `@import "tailwindcss";` and an `@theme { … }` token block.
- **Use `@theme` tokens** (`bg-primary`, `text-muted-foreground`, `font-sans`, `rounded-lg`)
  instead of hardcoded values wherever a token exists. Add new tokens to `@theme` rather than
  scattering hex codes.
- Use arbitrary values `class="mt-[37px] tracking-[-0.02em]"` for one-off exact numbers from a
  spec that don't warrant a token.
- Compose conditional classes with `cn()` from `@/lib/utils`.
- Colors are `oklch()` (convert with `scripts/inspection/rgb-to-oklch.mjs`).

## Images

- **`public/`**: unprocessed, served as-is at the root path (`/images/hero.webp`). Downloaded
  clone assets live here. Reference with a plain `<img>` and set `width`/`height` to avoid CLS.
- **`src/assets/` + `astro:assets`**: `import { Image } from "astro:assets"` for build-time
  optimization/responsive `srcset` when the source is in the project tree.
- Lazy-load below-the-fold media (`loading="lazy"`). Reproduce the original's real media —
  never mock a video with static HTML.

## Routing & pages

- File-based: `src/pages/index.astro` → `/`, `src/pages/about.astro` → `/about`.
- Multi-page clones add one `.astro` per route, all using `BaseLayout`.
- Optional: View Transitions via `<ClientRouter />` from `astro:transitions` for SPA-like nav.

## Cloudflare static constraints

- `output: 'static'` — no server code runs; everything is prerendered at build.
- Don't use server-only APIs, `Astro.request` bodies, or runtime env in components.
- Caching headers live in `public/_headers` (copied into `dist/`).
- Deploy: `npm run deploy` (`astro build && wrangler deploy`); preview: `npm run cf:preview`.

## Quality bar (Karpathy)

- **Simplicity first** — minimum markup that reproduces the spec; nothing speculative.
- **Surgical changes** — touch only the target file; don't refactor unrelated code.
- **Goal-driven** — done = matches the spec AND `astro check` passes with 0 errors.
