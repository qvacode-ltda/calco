<!--
  TEMPLATE — copy to docs/research/<hostname>/components/<component-name>.spec.md
  This file is the CONTRACT between extraction and the astro-builder agent.
  Every value must come from getComputedStyle (scripts/inspection/extract-styles.js),
  never estimated. If a section doesn't apply write "N/A" — but think twice before
  marking States & Behaviors N/A.
-->

# <ComponentName> — Spec

## Overview

- **Target file:** `src/components/<ComponentName>.astro`
- **Screenshot:** `docs/design-references/<hostname>/<name>.png`
- **Interaction model:** `static | hover | click-driven | scroll-driven | time-driven`
- **Depends on:** `<shared components / icons from src/components/icons>`

## DOM structure

```
<describe the element hierarchy, e.g.>
section.hero
  div.container
    h1.title
    p.subtitle
    a.cta
    img.hero-media
```

## Computed styles (exact, from getComputedStyle)

### Container `<selector>`

- display / flex|grid props:
- padding / margin:
- max-width / width:
- background:

### `<child element>` `<selector>`

- font: family / size / weight / line-height / letter-spacing
- color:
- (…every relevant property)

## States & behaviors

### `<behavior name>`

- **Trigger:** `<scroll y>50px | IntersectionObserver rootMargin "-30% 0" | click .tab | hover>`
- **State A (before):** `<props>`
- **State B (after):** `<props>`
- **Transition:** `<transition/animation CSS + duration + easing>`
- **Implementation:** `<CSS transition | GSAP ScrollTrigger | IntersectionObserver | CSS animation-timeline>`

## Per-state content (stateful components only)

### State: `<name>`

- Title / body / items: `<verbatim>`

## Assets

- Images: `public/images/<file>` (note layered/overlay images explicitly)
- Video: `public/videos/<file>`
- Icons: `<IconName>` from `src/components/icons/`

## Text content (verbatim)

```
<paste all copy exactly as it appears on the live site>
```

## Responsive behavior

- **Desktop (1440px):** `<layout>`
- **Tablet (768px):** `<changes>`
- **Mobile (390px):** `<changes>`
- **Breakpoint(s):** `<~px where layout switches>`
