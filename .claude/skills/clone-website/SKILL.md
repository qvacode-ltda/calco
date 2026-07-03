---
name: clone-website
description: Reverse-engineer and clone one or more websites in one shot — extracts assets, CSS, and content section-by-section and dispatches parallel Astro builder agents in worktrees as it goes. Use whenever the user wants to clone, replicate, rebuild, reverse-engineer, or copy any website. Also triggers on "make a copy of this site", "rebuild this page", "pixel-perfect clone". Provide one or more target URLs as arguments.
argument-hint: "<url1> [<url2> ...]"
user-invocable: true
---

# Clone Website

You are about to reverse-engineer and rebuild **$ARGUMENTS** as pixel-perfect clones in
this **Astro + Tailwind v4** project (static-first, deployed to Cloudflare Workers).

When multiple URLs are provided, process them independently and keep each site's artifacts
isolated under `docs/research/<hostname>/` and `docs/design-references/<hostname>/`.

You are a **foreman walking the job site** — as you inspect each section you write a
detailed spec to a file, then hand that file to a specialist `astro-builder` agent with
everything it needs. Extraction and construction happen in parallel, but extraction is
meticulous and produces auditable artifacts.

## Your team (agents & tools)

- **`design-extractor`** — inspects the live site via Playwright MCP + the deterministic
  scripts and produces artifacts. Its manual is `docs/research/INSPECTION_GUIDE.md`.
- **`astro-builder`** — builds one `.astro` component from a spec.
- **`code-reviewer`** — reviews built sections (correctness, a11y, fidelity).
- **`design-critic`** — final visual QA diff (original vs clone).
- **Scripts:** `scripts/inspection/fetch-source.mjs` (Phase 0 capture),
  `{extract-styles,discover-assets}.js` (browser payloads), `rgb-to-oklch.mjs`,
  `rewrite-media.mjs` (map source media → `/images` + inject dims), `download-assets.mjs`.
- **Reusable workflow:** `.claude/workflows/clone-sections.js` — fan out the section rebuild
  (frame first, then sections batched at 3, with auto-retry on agent failure). Invoke with
  `Workflow({name: "clone-sections", args: {prettyPath, assetsPath, frame, sections}})`.
- **Templates:** `docs/research/templates/*`.

> **Token economy:** reuse the scripts and templates above — do not re-derive extraction
> logic or re-dump raw HTML. Every fact is extracted once into an artifact and reused.
> **Parallelism cap: never run more than 3 builder/extractor agents at once.**

## Scope defaults

- **Fidelity:** pixel-perfect — exact colors, spacing, typography, animations.
- **In scope:** visual layout/styling, component structure & interactions, responsive design, mock data.
- **Out of scope:** real backend, auth, real-time features. (Basic a11y/SEO come for free from good Astro markup.)
- **Customization:** none — pure emulation. (Use `/refine` afterward to enhance.)

Honor any user-provided instructions over these defaults.

## Pre-flight

1. **Browser automation required.** Confirm Playwright MCP is available (`browser_*` tools).
   If not, ask the user to connect it. This skill cannot work without it.
2. Parse `$ARGUMENTS` as URL(s); normalize/validate; verify each is reachable.
3. Verify the base builds: `npm run build`. The Astro + Tailwind v4 scaffold is already in
   place (`src/layouts/BaseLayout.astro`, `src/styles/global.css`, `src/pages/index.astro`).
4. Create per-host output dirs: `docs/research/<host>/components/`, `docs/design-references/<host>/`.
5. Ensure this is a git repo (`git status`); worktrees require it (`git init` if needed).

## Guiding principles

1. **Completeness beats speed.** Every builder receives everything: screenshot, exact CSS,
   local asset paths, verbatim text, structure. If a builder must guess, extraction failed.
2. **Small tasks, perfect results.** One focused component per builder. **Complexity budget:**
   if a builder's spec exceeds ~150 lines, split the section. Mechanical check — don't override.
3. **Real content, real assets.** Extract actual text/images/videos/SVGs. **Layered assets
   matter** — one visual is often background + foreground mockup + overlay; enumerate every
   `<img>` and background-image in the container.
4. **Foundation first (sequential).** Design tokens → fonts → SVG icons → downloaded assets.
   Everything after parallelizes (≤3 at a time).
5. **Extract how it looks AND behaves.** For every element capture appearance
   (`getComputedStyle`) and behavior (trigger, before/after states, transition/easing).
6. **Identify the interaction model before building.** Scroll FIRST, then click. Building a
   click UI when the original is scroll-driven is the #1 most expensive mistake (full rewrite).
7. **Extract every state, not just the default.** Click each tab; capture styles at scroll 0
   and past the trigger; record the diff.
8. **Spec files are the source of truth.** Every component gets a filled
   `docs/research/<host>/components/<name>.spec.md` before any builder is dispatched.
9. **Build must always compile.** Each builder verifies `astro check` (0 errors) before
   finishing; you verify `npm run build` after each merge.

Behaviors to watch for (illustrative, not exhaustive): sticky/shrinking navbar, enter-on-view
animations, scroll-snap, parallax, animated hover, modals/accordions/dropdowns, scroll-driven
progress, auto carousels, section theme transitions, tab/pill cycling, scroll-driven tab
switching (IntersectionObserver, not clicks), smooth-scroll libs (Lenis/Locomotive).

## Phase 0 — Capture the real source (do this FIRST)

The highest-fidelity, cheapest starting point is the target's actual markup + styles, not
screenshots:

```bash
node scripts/inspection/fetch-source.mjs <url> docs/research/<host>/raw
npx prettier --parser html docs/research/<host>/raw/index.html > docs/research/<host>/raw/index.pretty.html
```

- Server-rendered sites yield the real DOM with exact class strings; since the target and we
  are both Tailwind v4, those classes **reuse verbatim** → reconstruct from source, don't
  re-derive. (SPA? capture rendered DOM via `browser_evaluate(() => document.documentElement.outerHTML)`.)
- Grep the prettified HTML for section landmarks → line ranges; hand each builder ONLY its
  slice. Grep `raw/_all.css` for `@keyframes`/`@property`/custom props to port into `global.css`.
- `getComputedStyle` (Phase 3) is now a fallback for the few values source doesn't reveal.

## Phase 1 — Reconnaissance

Delegate to the **`design-extractor`** agent (or do it yourself following
`docs/research/INSPECTION_GUIDE.md`). Produce, per host:

- Full-page screenshots at **1440** and **390** → `docs/design-references/<host>/`.
- `discover-assets.js` output → global palette, fonts, favicons, media, behavior `signals`.
- **Interaction sweep** (scroll → click → hover → responsive at 1440/768/390) → `BEHAVIORS.md`.
- **Page topology** (sections top→bottom, interaction model per section, build order) → `PAGE_TOPOLOGY.md`.
- **Extract the GLOBAL FRAME first.** Before sections, find the page-level chrome in the raw
  HTML: the outer wrapper / grid, any side rails or gutters (`--gutter-width`, hatch
  patterns), the fixed header shell, and the per-section wrapper pattern (hairlines, rotated
  gutter eyebrows). Reproduce it in `BaseLayout.astro` (header + content slots). Sections are
  built INTO this frame — getting it wrong warps every section.

## Phase 2 — Foundation build (sequential, do it yourself)

1. **Fonts** — add the target's fonts to `BaseLayout.astro` (Google Fonts `<link>` in the
   `head` slot, or self-host `.woff2` into `public/fonts` + `@font-face` in `global.css`).
   Set `--font-sans/serif/mono` in `@theme`.
2. **Color + design tokens** — convert the extracted palette with
   `node scripts/inspection/rgb-to-oklch.mjs --css` and paste the `--color-*` lines into the
   `@theme` block of `src/styles/global.css`. Add radii, shadows, and any global behaviors
   (smooth scroll, custom scrollbar, keyframes) in the base layer. Mirror it in `DESIGN.md`.
3. **SVG icons** — extract inline `<svg>`s, dedupe, save as `src/components/icons/<Name>.astro`
   (named by function: `SearchIcon.astro`, `ArrowRightIcon.astro`, `LogoIcon.astro`).
4. **Assets** — build `docs/research/<host>/assets.json` and run
   `node scripts/download-assets.mjs docs/research/<host>/assets.json` (concurrency 3).
5. **SEO** — favicons/OG/webmanifest into `public/seo/`; wire into `BaseLayout.astro`.
6. Verify: `npm run build` passes.

## Phase 3 — Component spec & dispatch (core loop)

For each section in `PAGE_TOPOLOGY.md`: **extract → write spec → dispatch → merge.**

### Extract

- Screenshot the section → `docs/design-references/<host>/`.
- Run the `extract-styles.js` payload via `browser_evaluate` on the section selector — never
  hand-measure. Capture multi-state styles (State A → trigger → State B → diff).
- Capture verbatim text; for tabs, click each and capture per-state content.
- Identify the section's assets (downloaded files + icon components; watch for layers).
- Assess complexity (count distinct sub-components).

### Write the spec

Copy `docs/research/templates/component.spec.md` → `docs/research/<host>/components/<name>.spec.md`
and fill **every** section. Target file is `src/components/<Name>.astro`. Not optional.

### Dispatch builders (≤3 concurrent, in worktrees)

- **Simple** (1–2 sub-components): one `astro-builder`.
- **Complex** (3+): one builder per sub-component + one for the wrapper (sub-components first).
- Each builder receives, **inline**: the full spec contents, the screenshot path, which shared
  pieces to import (`icons/*`, `cn()` from `@/lib/utils`), the target file path, and the rule
  to pass `astro check` before finishing. **Never** tell a builder to "go read a doc."
- Use the `astro-builder` agent with **worktree isolation** so parallel builders don't collide.
- **Don't wait** — after dispatching a section's builders, extract the next section. But keep
  no more than 3 agents running at once.

### Merge

As builders finish, merge their worktree branches into `main`. You have full context — resolve
conflicts intelligently. After each merge, verify `npm run build`; fix type errors immediately.

## Phase 4 — Page assembly

Wire everything in `src/pages/index.astro` (and other `src/pages/*.astro` routes):

- Import all section components; lay out per the topology (scroll containers, sticky, z-index).
- Connect real content to component props/frontmatter.
- Implement page-level behaviors in a scoped `<script>`: GSAP `ScrollTrigger` for
  scroll-driven animation, `IntersectionObserver` for reveals/tab-switching, Lenis for smooth
  scroll if the original used it. Match the interaction model exactly.
- Verify: `npm run build` passes clean.

## Phase 5 — Visual QA diff

Delegate to the **`design-critic`** agent. Do NOT declare done before this:

- Screenshot original vs clone at 1440 and 390, section by section.
- For each discrepancy: if the spec was wrong, re-extract and update it; if the build diverged
  from a correct spec, fix the component.
- Test every interaction: scroll, click each tab/button, hover; confirm transitions feel right.
- Optionally run `code-reviewer` on the final diff before committing.

## Pre-dispatch checklist

- [ ] Spec written with ALL sections filled.
- [ ] Every CSS value from `getComputedStyle`, not estimated.
- [ ] Interaction model identified and documented.
- [ ] Every state captured (stateful components).
- [ ] Scroll-driven: trigger threshold + before/after + transition recorded.
- [ ] Hover: before/after + timing recorded.
- [ ] All images identified (including overlays/layers).
- [ ] Responsive documented (desktop + mobile min).
- [ ] Text verbatim.
- [ ] Builder spec < ~150 lines; else split.

## What NOT to do

- Don't build click tabs when the original is scroll-driven — decide by scrolling first.
- Don't extract only the default state.
- Don't miss overlay/layered images.
- Don't mock a `<video>`/Lottie/canvas — reproduce the real media.
- **Don't rasterize editable/animated components.** If the source draws it with inline SVG
  or CSS (dashed borders, corner sparkles, hatch rails, gradients, rotated eyebrows, code
  editors, brand logos), rebuild it as SVG/CSS — never a screenshot. Only genuine photos /
  product screenshots become `<img>`.
- Don't approximate CSS — reuse the real class strings from source (getComputedStyle is fallback).
- Don't reference external docs in a builder prompt — inline the spec.
- Don't skip asset extraction — a clone without real media looks fake.
- Don't overload a builder — long prompt = split the section.
- Don't bundle unrelated sections into one agent.
- Don't skip responsive extraction (1440/768/390).
- Don't forget smooth-scroll libraries (Lenis/Locomotive).
- Don't dispatch without a spec file.
- **Don't exceed 3 concurrent agents.**

## Hard-won lessons (gotchas)

- **Frame before sections.** The most-missed personality lives in the page-level chrome
  (gutters, hatch rails, fixed header, rotated eyebrows, 200vw hairlines). Build the frame in
  `BaseLayout.astro` first; place sections into it.
- **Class leakage into grids.** Source section roots often carry frame-placement classes
  (`col-start-2`, `row-start-N`). If you nest them inside a CSS **grid**, those create
  implicit tracks and scatter sections into columns. Make the content wrapper `flex flex-col`
  (classes stay inert) or make sections direct children of the frame grid. Diagnose layout by
  inspecting the DOM (`browser_evaluate` computed `grid-template-columns` + child rects), not
  by guessing.
- **`set:html` for verbatim blocks.** Astro parses `{ }` as expressions, so pasting real
  markup that contains literal braces (code editors) breaks. Emit those via
  `<Fragment set:html={\`…\`} />` after checking there are no backticks/`${}` inside.
- **Deterministic media rewrite.** Don't hand-edit dozens of image URLs — run
  `node scripts/inspection/rewrite-media.mjs <file> <assets.json>` to map source media →
  `/images/*` and inject width/height.
- **Verify each builder actually wrote.** Agents can die mid-response (connection). After a
  batch, check `git status` / file mtimes and re-dispatch any section that didn't change.
  The `clone-sections` workflow does this retry automatically.

## Completion report

Sections built · components created · spec files written (should match) · assets downloaded
· `npm run build` status · visual QA results · known gaps.

To ship: `npm run verify` then `npm run deploy` (or the `/deploy` command).
