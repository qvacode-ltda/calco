<!-- TEMPLATE — copy to docs/research/<hostname>/BEHAVIORS.md. Output of the Phase 1 interaction sweep. -->

# Behaviors — <hostname>

Captured during the mandatory interaction sweep (scroll → click → hover → responsive),
BEFORE building. Interaction model is decided by SCROLLING first, then clicking.

## Global

- **Smooth scroll lib:** `none | Lenis | Locomotive` (detected via discover-assets.js `signals`)
- **Animation lib:** `none | GSAP/ScrollTrigger | Framer | CSS`
- **Scroll-snap:** `yes/no — where`
- **Custom scrollbar / cursor:** `<describe>`
- **Global keyframes / gradients / backdrop-filters:** `<describe>`

## Header / nav

- **On scroll:** `<shrinks? bg change? shadow? at what scrollY?>`
- **Transition:** `<CSS>`
- **Mobile menu:** `<drawer? animation?>`

## Per-section behaviors

### `<section name>`

- **Interaction model:** `scroll-driven | click-driven | static`
- **Trigger:** `<exact mechanism + threshold>`
- **Before → after:** `<property changes>`
- **Transition/timing:** `<duration + easing>`

## Hover inventory

| Element | Property | Before → After | Transition |
| ------- | -------- | -------------- | ---------- |
|         |          |                |            |

## Things to watch (checklist)

- [ ] Navbar change on scroll
- [ ] Enter-on-view animations (fade-up, stagger)
- [ ] Scroll-snap / parallax layers
- [ ] Tabs/pills — click vs scroll-driven (IntersectionObserver)
- [ ] Auto-playing carousels
- [ ] Dark→light section transitions
- [ ] Modals / accordions / dropdowns (enter/exit)
- [ ] `<video>` / Lottie / canvas (not a mockup!)
