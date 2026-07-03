# Inspection Guide — extracting a website's design via MCP

This is the canonical methodology for extracting colors, CSS, typography, assets, and
behaviors from a live site. It is loaded **on demand** by the `design-extractor` agent
and the `clone-website` skill — not into every session — to keep context lean.

**Token economy is a first-class goal.** The heavy lifting runs in the browser and in
Node, not in model tokens:

- `browser_evaluate` returns **distilled JSON**, never raw HTML dumps.
- `browser_snapshot` (accessibility tree) is preferred over reading the DOM when you
  only need structure/labels.
- `scripts/inspection/*` and `scripts/download-assets.mjs` do extraction, color
  conversion, and downloads deterministically — the model reads results, not pages.
- Every extracted fact is written **once** to an auditable artifact (spec / DESIGN /
  BEHAVIORS) and reused by builders.

## Tooling

**Browser (Playwright MCP):** `browser_navigate`, `browser_resize`, `browser_take_screenshot`
(`fullPage: true`), `browser_evaluate`, `browser_network_requests`, `browser_snapshot`,
`browser_click`, `browser_hover`, `browser_wait_for`, `browser_console_messages`.

**Deterministic scripts:**

| Script                                  | Where it runs                | Purpose                                                               |
| --------------------------------------- | ---------------------------- | --------------------------------------------------------------------- |
| `scripts/inspection/fetch-source.mjs`   | Node                         | **capture the real HTML + linked CSS to disk — do this FIRST**         |
| `scripts/inspection/discover-assets.js` | browser (`browser_evaluate`) | enumerate images/video/bg/fonts/favicons + detect libs (Lenis/GSAP/…) |
| `scripts/inspection/extract-styles.js`  | browser (`browser_evaluate`) | distilled `getComputedStyle` tree for one section                     |
| `scripts/inspection/rgb-to-oklch.mjs`   | Node                         | convert `rgb()/hex/hsl` → Tailwind `oklch(...)` tokens                |
| `scripts/inspection/rewrite-media.mjs`  | Node                         | map source media URLs → `/images/*` + inject `<img>` width/height     |
| `scripts/download-assets.mjs`           | Node                         | batch-download a JSON manifest into `public/` (concurrency 3)         |

> The `*.js` payloads are written as `export const fn = (…) => {…}`. Pass the arrow
> function to `browser_evaluate`'s `function` argument (copy the body). They must run in
> the page, so they use browser globals (`document`, `getComputedStyle`).

## Workflow

### 0. Capture the real source FIRST (source-first) — the highest-fidelity move

Before screenshots or `getComputedStyle`, get the actual markup and styles:

```bash
node scripts/inspection/fetch-source.mjs <url> docs/research/<host>/raw
npx prettier --parser html docs/research/<host>/raw/index.html > docs/research/<host>/raw/index.pretty.html
```

- For a **server-rendered** site (Next.js/Astro/Rails/WordPress…) the served HTML already
  contains the real DOM with its exact class strings. If the target is Tailwind (or any
  utility framework) and so are we, those classes are **reused verbatim** — near-perfect
  fidelity for a fraction of the tokens vs. re-deriving via `getComputedStyle`.
- For a **client-rendered SPA** the served HTML is an empty shell. Instead capture the
  RENDERED DOM: `browser_evaluate(() => document.documentElement.outerHTML)` → save to
  `raw/index.html`, then prettify.
- Grep the prettified HTML for section landmarks to get line ranges, and hand each builder
  ONLY its slice (`Read` with offset/limit) — this is how you reconstruct exactly while
  staying token-frugal.
- Grep `raw/_all.css` for custom bits the utility framework won't regenerate: `@keyframes`,
  `@property`, `:root` custom properties, non-utility rules. Port those into `global.css`.
- `getComputedStyle` (step 4 tools) becomes a *fallback / verification* for the few values
  the raw source doesn't make obvious (resolved colors, exact computed sizes) — not the
  primary source.

### 1. Reconnaissance

1. `browser_navigate` to the URL; `browser_wait_for` network idle / hero visible.
2. `browser_resize` to **1440** then screenshot full page → `docs/design-references/<host>/desktop.png`; repeat at **390** → `mobile.png`.
3. Run `discoverAssets()` via `browser_evaluate`. Save the JSON. It yields `meta`,
   `images/videos/backgroundImages`, `fonts`, `fontLinks`, `favicons`, and `signals`
   (which behavior libraries are present).
4. Also capture `browser_network_requests` to find real media URLs (CDN, video, fonts)
   that aren't in the DOM yet.

### 2. Global design tokens → `DESIGN.md` + `@theme`

1. From `discoverAssets()` + a few `extractComputedStyles("body")` samples, list the
   colors, font families/weights, radii, and shadows actually used.
2. Convert every color: `node scripts/inspection/rgb-to-oklch.mjs --css` (pipe a JSON
   map of `{tokenName: "rgb(...)"}`) → paste the `--color-*` lines into
   `src/styles/global.css` `@theme`.
3. Record the human-readable system in `docs/research/<host>/DESIGN.md`.
4. Fonts: prefer Google Fonts `<link>` (added in `BaseLayout.astro` head slot) or
   self-host `.woff2` into `public/fonts` and add `@font-face` in `global.css`.

### 3. Interaction sweep → `BEHAVIORS.md` (BEFORE building)

**Decide the interaction model by SCROLLING FIRST, then clicking.** Building a
click-based tab set when the original is scroll-driven is the single most expensive
mistake (full rewrite).

- **Scroll sweep:** scroll slowly; note header changes, enter-on-view animations,
  scroll-snap, parallax, `signals.lenis/gsap`. For each change, capture styles at
  scrollY 0 and after the trigger (see state capture below).
- **Click sweep:** click every tab/accordion/menu; capture each resulting state's
  content and styles.
- **Hover sweep:** hover buttons/cards/links; record before→after + transition.
- **Responsive sweep:** re-check at 1440 / 768 / 390.

### 4. Per-section extraction → `*.spec.md`

For each section in `PAGE_TOPOLOGY.md`:

1. Screenshot the section.
2. `extractComputedStyles("<section selector>")` via `browser_evaluate` → paste the
   returned tree into the spec's **Computed styles**. Never hand-measure.
3. Capture verbatim text (the tree includes text nodes; confirm exact copy).
4. List the section's assets (match against the downloaded files in `public/`).
5. Write `docs/research/<host>/components/<name>.spec.md` from the template — **every
   section filled**. This spec is the builder's only source of truth.

### State capture (multi-state elements)

1. `extractComputedStyles(sel)` at **State A**.
2. Trigger the change (`browser_click` / `browser_hover` / scroll via
   `browser_evaluate("() => window.scrollTo(0, N)")`).
3. `extractComputedStyles(sel)` at **State B**.
4. The diff (property, before, after, trigger, transition) is the behavior spec.

### 5. Assets

Build a manifest from `discoverAssets()`:

```json
{ "images": ["…"], "videos": ["…"], "fonts": ["…"], "seo": ["favicon…", "og…"] }
```

Save to `docs/research/<host>/assets.json`, then:

```bash
node scripts/download-assets.mjs docs/research/<host>/assets.json
```

Watch for **layered/overlay images** (a section can be background + foreground mockup +
overlay icon = 3 files) and real `<video>`/Lottie (never mock these).

## Outputs (per host)

```
docs/research/<host>/
  raw/                 # captured source: index.html, index.pretty.html, *.css, _all.css
  DESIGN.md            # tokens + type + motion (twin of @theme)
  BEHAVIORS.md         # interaction sweep results
  PAGE_TOPOLOGY.md     # sections, order, build plan
  assets.json          # download manifest
  components/*.spec.md  # one contract per component
docs/design-references/<host>/  # screenshots
```

## Golden rules

1. **Source-first:** reconstruct from the real captured HTML/CSS; preserve the exact class
   strings when the target shares our utility framework. `getComputedStyle` is the fallback.
2. **Reproduce personality as CODE, never as a screenshot.** Dashed borders, corner
   sparkles, diagonal hatch rails, gradients, rotated gutter eyebrows, animated code
   editors, SVG logos — these are inline SVG / CSS in the source, so build them as such.
   Only genuine raster images (photos, product screenshots) become `<img>`.
3. Interaction model identified **before** any code (scroll vs click); extract every state.
4. Real content, real assets — including layered images and videos.
5. One auditable artifact per component before dispatching a builder.
6. Hand each builder only its source slice + distilled data (token economy); never dump raw HTML into the orchestrator.
