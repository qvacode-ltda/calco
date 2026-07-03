---
description: Visual QA — compare the built clone against the original at 1440 and 390 and report discrepancies.
argument-hint: "<original-url> [<clone-url>]"
---

Launch the **design-critic** agent to compare the clone against the original.

- Original URL / clone URL (if given): `$ARGUMENTS`. If no clone URL is provided, start the
  local site (`npm run dev`) and use its preview URL.
- Screenshot both at 1440 and 390, section by section (Playwright MCP).
- Report a prioritized list of discrepancies: **fidelity first** (spacing, type, color, imagery,
  interactive states), then a **taste pass** (per the `design-taste` rubric) only where the
  original was ambiguous.
- Report findings only — no edits. If it matches, say so plainly.
