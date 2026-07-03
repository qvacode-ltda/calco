# Calco — website reverse-engineering kit (Astro + Cloudflare)

## This is the latest Astro — verify before you assume

This project tracks **Astro 7 + Tailwind CSS v4**, which have breaking changes vs older
docs and training data. When touching Astro/Tailwind APIs, confirm against current docs
(use **context7**) — don't rely on memory. Heed deprecation notices (e.g. `@astrojs/tailwind`
is dead; Tailwind is wired via `@tailwindcss/vite`).

## What this is

**Calco** (Spanish: an exact copy, a tracing) — a reusable kit for reverse-engineering **any**
website into a clean, static Astro codebase that deploys to Cloudflare in one command. Start a
clone with `/clone-website <url1> [<url2> ...]`. A finished example clone lives in
`examples/tailwindcss.com/` and auto-deploys to GitHub Pages as the public demo.

## Tech stack

- **Framework:** Astro 7 (static output, TypeScript strict, zero framework runtime by default)
- **Styling:** Tailwind CSS v4 via `@tailwindcss/vite`; design tokens as `oklch()` in an
  `@theme` block in `src/styles/global.css`
- **Interactivity/animation:** vanilla JS + **GSAP** in scoped `<script>` blocks (islands only
  if truly required)
- **Icons:** extracted inline SVGs → `src/components/icons/*.astro`
- **Deploy:** Cloudflare Workers static assets (`wrangler.jsonc`, `assets.directory: ./dist`)

## Commands

- `npm run dev` — dev server
- `npm run build` — production build → `dist/`
- `npm run check` — `astro check` (types/diagnostics)
- `npm run lint` / `npm run format` — ESLint / Prettier
- `npm run verify` — check + lint + build (run before shipping)
- `npm run deploy` — build + `wrangler deploy` · `npm run cf:preview` — local Workers preview
- `npm run assets:download <manifest.json>` — batch-download clone assets

## Code style

- TypeScript strict, no `any`. 2-space indent. Named exports; PascalCase components,
  camelCase utils.
- `.astro` first; import alias `@/*` → `src/*`.
- Tailwind utilities mapped to `@theme` tokens — **prefer tokens over hardcoded hex**; use
  arbitrary values `[…]` for one-off exact numbers from a spec. Merge conditional classes with
  `cn()` (`@/lib/utils`). No inline styles.
- Mobile-first responsive.

## Design principles

- **Pixel-perfect emulation** — match the target's spacing, colors, typography, animations 1:1.
- **Match the system, don't invent one** — the target site _is_ the design system; fidelity
  beats flair. Enhance only via `/refine`.
- **Real content, real assets** — actual text, images, videos, SVGs; never placeholders.
- **No AI slop** — see the `design-taste` skill (no generic fonts, no unmotivated purple
  gradients / glassmorphism, real hierarchy, no em-dashes in UI microcopy).

## How we work (Karpathy)

1. **Think before coding** — state assumptions; ask when uncertain rather than guessing.
2. **Simplicity first** — minimum code that solves the problem; nothing speculative.
3. **Surgical changes** — touch only what you must; don't refactor unrelated code.
4. **Goal-driven** — define success (matches spec + `astro check` passes) and loop to it.

## Token economy (do this)

- Reuse the deterministic scripts (`scripts/inspection/*`, `scripts/download-assets.mjs`) —
  extraction, color conversion, and downloads happen in Node/browser, not in model tokens.
- `browser_evaluate` returns distilled JSON; prefer `browser_snapshot` over raw DOM.
- Extract each fact once into an artifact (spec / DESIGN / BEHAVIORS) and reuse it.
- Isolate noisy work in subagents/worktrees so the orchestrator context stays lean.

## The clone system

Orchestrated by the `/clone-website` skill. **Source-first:** capture the target's real
HTML/CSS first (`fetch-source.mjs`), rebuild the GLOBAL FRAME, then reconstruct sections from
the real markup — preserve exact classes, reproduce personality (SVG/CSS) as code, never as a
screenshot. Flow: capture → frame → sections → assemble → QA.

- **Agents** (`.claude/agents/`): `design-extractor`, `astro-builder`, `code-reviewer`,
  `commit-crafter`, `design-critic`.
- **Skills** (`.claude/skills/`): `clone-website`, `astro-craft`, `design-taste`,
  `conventional-commits`.
- **Commands** (`.claude/commands/`): `/extract-design`, `/build-section`, `/review`,
  `/commit`, `/qa`, `/refine`, `/deploy`.
- **Reusable workflow:** `.claude/workflows/clone-sections.js` (frame + sections batched at 3,
  auto-retry on failure).
- **Extraction manual:** `docs/research/INSPECTION_GUIDE.md` (loaded on demand, not every session).

## Parallelism & worktrees

- When running builder/extractor agents in parallel, **never exceed 3 at once**, and give each
  its own git worktree branch; merge everyone's work at the end, resolving conflicts with full
  context. (Requires a git repo — `git init` if missing.)

## Project structure

```
src/
  pages/            # routes (index.astro → /)
  layouts/          # BaseLayout.astro (HTML shell + SEO)
  components/       # section/component .astro files
    icons/          # extracted SVGs as .astro
  styles/global.css # @import "tailwindcss" + @theme tokens (the DESIGN contract)
  lib/utils.ts      # cn()
public/             # images/ videos/ fonts/ seo/ + _headers, robots.txt, favicon.svg
docs/
  research/         # INSPECTION_GUIDE.md, templates/, <host>/ (DESIGN, BEHAVIORS, specs)
  design-references/# screenshots (<host>/)
examples/
  tailwindcss.com/  # finished demo clone (self-contained Astro app, deployed to GitHub Pages)
scripts/
  inspection/       # extract-styles.js, discover-assets.js, rgb-to-oklch.mjs
  download-assets.mjs
```
