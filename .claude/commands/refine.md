---
description: Enhance mode — deliberately improve the design beyond a 1:1 clone using taste dials + PRODUCT.md/DESIGN.md.
argument-hint: "[target section or page] [dials, e.g. variance=6 motion=4 density=3]"
---

Enter **enhance mode** using the `design-taste` skill (Mode 2). This intentionally deviates
from 1:1 fidelity — only do this when the user asked to improve the design.

1. Load `design-taste`. Read (or create from templates) `PRODUCT.md` and `DESIGN.md` for the site.
2. Establish the register (brand vs product) and the dials (DESIGN_VARIANCE / MOTION_INTENSITY /
   VISUAL_DENSITY). Use any provided in `$ARGUMENTS`; otherwise infer and confirm with the user.
3. Audit the target (`$ARGUMENTS` scope, or the whole page) against the taste rubric; list the
   highest-impact improvements.
4. Apply changes **surgically**, one concern at a time, keeping colors/type/spacing as `@theme`
   tokens. Do not touch sections the user marked as must-stay-1:1.
5. Run `/qa` (design-critic) to confirm it improved without regressing required fidelity.
