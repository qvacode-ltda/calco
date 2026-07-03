---
description: Review the current working diff for correctness, Astro/Tailwind best practices, a11y, perf, and spec fidelity.
---

Launch the **code-reviewer** agent on the current working tree.

It should start from `git diff` (and `git diff --staged`), run `npm run check`, and return a
prioritized findings list (most severe first) with `file:line`, the concrete failure scenario,
and a suggested fix. It must NOT edit code. If nothing material is wrong, it should say so plainly.

$ARGUMENTS
