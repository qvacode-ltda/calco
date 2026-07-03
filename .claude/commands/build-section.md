---
description: Build one Astro component from a spec file using the astro-builder agent.
argument-hint: "<path/to/component.spec.md>"
---

Read the spec file at `$ARGUMENTS`, then launch the **astro-builder** agent with the spec
contents **inlined** in its prompt (never tell the builder to open the file itself).

Give the builder:

- the full spec contents
- the screenshot path referenced in the spec
- shared pieces to import (`@/lib/utils` `cn`, any `src/components/icons/*`)
- the target file path (`src/components/<Name>.astro`)
- the requirement to pass `npx astro check` (0 errors) before finishing

If the spec exceeds ~150 lines or describes 3+ distinct sub-components, split it into multiple
builders (sub-components first, then the wrapper) — but never run more than 3 builder agents at once.
