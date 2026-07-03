<!-- TEMPLATE — copy to docs/research/<hostname>/PAGE_TOPOLOGY.md. Map of the page, top → bottom. -->

# Page topology — <hostname> <route>

## Sections (in visual order)

| #   | Section    | Component file | Interaction model | Assets           | Complexity |
| --- | ---------- | -------------- | ----------------- | ---------------- | ---------- |
| 1   | Header/Nav | `Header.astro` | sticky/scroll     | logo, icons      | S          |
| 2   | Hero       | `Hero.astro`   | scroll-driven     | hero.webp, video | M          |
| …   |            |                |                   |                  |            |

Complexity: S = 1–2 sub-components (1 builder) · M/L = 3+ sub-components (split builders).

## Layout & stacking

- **Page shell:** `<max-width, columns, sticky/fixed regions>`
- **Fixed/overlay elements:** `<header, floating CTA, cookie bar>`
- **z-index layers:** `<list from back to front>`
- **Scroll container:** `<body | wrapper for Lenis>`

## Dependencies / build order

1. Foundation (tokens, fonts, icons, assets) — sequential.
2. `<sections that block others, e.g. shared card built before grid>`
3. `<independent sections — parallelizable, max 3 builders at once>`

## Routes (multi-page clones)

- `/` → `src/pages/index.astro`
- `<path>` → `src/pages/<path>.astro`
