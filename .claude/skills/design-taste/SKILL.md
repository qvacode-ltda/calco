---
name: design-taste
description: Design-quality rubric for the clone pipeline. Two modes — (1) gap-filling during a 1:1 clone (avoid generic "AI slop" when the source is ambiguous) and (2) enhance mode for /refine (deliberately improve a design using taste dials + PRODUCT.md/DESIGN.md). Load for /refine, for the design-critic's taste pass, or whenever a builder must decide something the source didn't specify.
---

# Design Taste

Adapted from taste-skill (design dials, anti-repetition) and impeccable
(PRODUCT.md/DESIGN.md, "register"). Core doctrine for this project:

> **Match the system, don't invent one.** In a clone, the target site _is_ the design
> system. Fidelity beats flair. Taste only fills genuine gaps or drives an explicit enhance.

## Mode 1 — Gap-filling (default, during 1:1 clone)

When the source leaves something ambiguous (a hover the original lacked, a mobile layout not
observed, placeholder-only content), fill it in the target's own language — never with defaults
that scream "AI generated". Concrete anti-slop rules:

- **No generic system fonts** when the target uses a real typeface — reproduce the actual face.
- **No unmotivated purple/indigo gradients**, no glassmorphism-by-default, no neon glows.
- **No card-grid-on-card-grid** — respect the original's layout rhythm.
- **Real hierarchy** — size/weight/spacing/color must encode importance; avoid flat, same-size blocks.
- **Consistent spacing scale** — reuse the extracted rhythm, don't sprinkle arbitrary gaps.
- **Ban em-dashes (—) in UI microcopy** — use commas, periods, or restructure.
- **Motion has meaning** — match the original's easing/duration; don't add gratuitous animation.
- **Contrast & focus** — keep text legible (WCAG AA) and keyboard focus visible.

When in doubt in clone mode: replicate the original exactly rather than "improving" it.

## Mode 2 — Enhance (only for /refine or explicit user request)

Improve beyond 1:1. Requires intent, so read/create two files (templates in
`docs/research/templates/`):

- **PRODUCT.md** — users, purpose, brand voice, anti-references. Establishes the _register_:
  `brand` (impression-driven, marketing) vs `product` (task-driven, application).
- **DESIGN.md** — the concrete system: colors (oklch), type scale, spacing, elevation, motion.

Then set the **dials (0–10)** and apply them surgically:

- **DESIGN_VARIANCE** — `0` centered/clean · `10` asymmetric/expressive layout.
- **MOTION_INTENSITY** — `0` hover only · `10` scroll scenes / magnetic / parallax.
- **VISUAL_DENSITY** — `0` spacious/editorial · `10` dashboard-dense.

Enhance workflow:

1. Confirm register + dials with the user (or infer from PRODUCT.md).
2. Audit the current build against the rubric below; list the highest-impact issues.
3. Apply changes **surgically**, one concern at a time, keeping tokens in `@theme`.
4. Re-run `design-critic` / `/qa` to confirm it improved without breaking fidelity where
   fidelity was required.

## Rubric (used by design-critic's taste pass)

- **Typography** — deliberate scale, sensible line-length (~60–75ch body), tuned
  line-height/letter-spacing, real font pairing.
- **Color** — restrained palette from tokens, sufficient contrast, purposeful accents.
- **Layout & spacing** — clear grid, consistent rhythm, intentional whitespace, alignment.
- **Hierarchy** — the eye lands on the right thing first; primary action is obvious.
- **Motion** — purposeful, consistent easing, respects `prefers-reduced-motion`.
- **Polish** — pixel alignment, states (hover/focus/active/disabled), empty/edge cases.
- **Slop check** — none of the anti-slop patterns above.

Report findings prioritized by impact; never apply enhance changes in pure clone mode.
