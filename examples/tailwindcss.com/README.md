# tailwindcss.com — cloned with Calco

**Live demo:** <https://qvacode.github.io/calco/>

This is the proof-of-work for [**Calco**](../../README.md): a static clone of the
[tailwindcss.com](https://tailwindcss.com) homepage produced by the `/clone-website` pipeline,
built with [Astro](https://astro.build) + [Tailwind CSS v4](https://tailwindcss.com).
Reconstructed source-first from the real rendered DOM, so the signature details are faithful:
the hatch-rail frame, the dashed "Plus" nav button, the inline-SVG sponsor logos, and the live
bento demo components (not screenshots). Open the demo next to the original and compare.

> **Disclaimer** — this clone exists to demonstrate what Calco can do. It is not affiliated
> with or endorsed by Tailwind Labs. The deployed demo is `noindex`ed, and all trademarks and
> content belong to their owners. Clone responsibly: learn, prototype, then replace the content
> with your own before shipping anything.

## Develop

```bash
npm install
npm run dev        # http://localhost:4321
```

## Scripts

| Script                      | Does                                               |
| --------------------------- | -------------------------------------------------- |
| `dev` / `build` / `preview` | Astro dev / build → `dist/` / preview              |
| `build:pages`               | build + rebase asset URLs for GitHub Pages         |
| `check`                     | `astro check` (types)                              |
| `lint` / `format`           | ESLint / Prettier                                  |
| `verify`                    | check + lint + build                               |
| `deploy` / `cf:preview`     | `wrangler deploy` / local Workers preview          |

## How it deploys

The public demo is published automatically by GitHub Actions
([`.github/workflows/deploy-demo.yml`](../../.github/workflows/deploy-demo.yml)): every push
that touches `examples/tailwindcss.com/` builds with `ASTRO_BASE=/calco` and ships `dist/` to
GitHub Pages. `scripts/rebase-assets.mjs` rewrites the root-relative `public/` asset URLs to
the base path after the build, so the clone's source stays byte-faithful to the original.

It also deploys to Cloudflare Workers like any Calco clone (`wrangler.jsonc` serves `dist/`):

```bash
npx wrangler login       # once
npm run deploy
```

## Structure

```
src/
  pages/index.astro        # the homepage
  layouts/BaseLayout.astro # HTML shell + the page frame (hatch rails, fixed header)
  components/              # Header, Hero, Sponsors, Features, ShipFaster, InTheWild, Templates, Footer
    icons/                 # inline SVG icons
  styles/global.css        # @import "tailwindcss" + @theme tokens + fonts
  lib/utils.ts             # cn()
public/                    # images, self-hosted fonts, favicons, _headers
scripts/rebase-assets.mjs  # post-build URL rebase for GitHub Pages
```

Requires Node ≥ 20.
