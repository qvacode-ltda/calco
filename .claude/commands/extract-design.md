---
description: Inspect a live URL and extract its design system (tokens, fonts, assets, behaviors) into artifacts — no building.
argument-hint: "<url>"
---

Launch the **design-extractor** agent on: `$ARGUMENTS`

Its manual is `docs/research/INSPECTION_GUIDE.md`. It must, for the given host:

1. Screenshot at 1440 and 390 → `docs/design-references/<host>/`.
2. Run `discover-assets.js` (via `browser_evaluate`) → palette, fonts, favicons, media, behavior signals.
3. Convert colors with `scripts/inspection/rgb-to-oklch.mjs` and write the token block to
   `docs/research/<host>/DESIGN.md` (and propose the `@theme` update for `src/styles/global.css`).
4. Run the interaction sweep → `docs/research/<host>/BEHAVIORS.md` and map sections in `PAGE_TOPOLOGY.md`.
5. Build `docs/research/<host>/assets.json` (do not download yet unless asked).

Keep it token-frugal: return a concise summary of artifacts + the design signals, not raw dumps.
Do NOT build any components — this is extraction only.
