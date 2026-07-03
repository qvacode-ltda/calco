---
description: Create Conventional Commits grouped by related change from the working tree.
---

Launch the **commit-crafter** agent (it follows the `conventional-commits` skill).

It should: inspect `git status` / `git diff`, group changes by concern (one logical change per
commit, never bundling unrelated work), stage each group's files, and commit with a
`type(scope): subject` message plus a body and the required `Co-Authored-By` footer.

Do not `git push` unless explicitly asked. Report the resulting `git log --oneline`.

Extra guidance (optional): $ARGUMENTS
