<!--
  TEMPLATE — copy to docs/research/<hostname>/DESIGN.md.
  The extracted design system, in the impeccable "match your system, don't invent one"
  spirit. This is the human-readable twin of the @theme block in src/styles/global.css.
  Fill it from getComputedStyle + discover-assets.js; convert colors with rgb-to-oklch.mjs.
-->

# Design system — <hostname>

## Register

- **Type:** `brand (impression-driven) | product (task-driven)`
- **Overall feel:** `<3–5 adjectives observed, e.g. calm, editorial, dense>`

## Color tokens (→ `@theme` in global.css)

| Token                | Source (as seen) | oklch        | Usage           |
| -------------------- | ---------------- | ------------ | --------------- |
| `--color-background` | `rgb(...)`       | `oklch(...)` | page bg         |
| `--color-foreground` |                  |              | body text       |
| `--color-primary`    |                  |              | CTAs / accents  |
| `--color-muted`      |                  |              | subtle surfaces |
| `--color-border`     |                  |              | dividers        |

## Typography

| Role            | Family | Weight | Size / line-height | Letter-spacing | Source                     |
| --------------- | ------ | ------ | ------------------ | -------------- | -------------------------- |
| Display / H1    |        |        |                    |                | Google Fonts / self-hosted |
| H2–H3           |        |        |                    |                |                            |
| Body            |        |        |                    |                |                            |
| Caption / label |        |        |                    |                |                            |

- **Font delivery:** `<Google Fonts <link> | self-hosted @font-face in public/fonts>`

## Spacing & radius

- **Section rhythm:** `<vertical padding scale observed>`
- **Container max-width:** `<px>`
- **Radius scale:** `<sm/md/lg/xl values>`

## Elevation & effects

- **Shadows:** `<box-shadow values in use>`
- **Blur / backdrop:** `<values>`
- **Gradients:** `<exact gradients>`

## Motion

- **Default transition:** `<duration + easing>`
- **Signature interactions:** `<scroll reveals, parallax, hover>`
- **Library:** `<none | GSAP | Lenis>`

## Iconography & imagery

- **Icons:** `<inline SVG set → src/components/icons>`
- **Image style:** `<photography | 3D | illustration | screenshots>`
