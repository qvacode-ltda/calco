---
name: conventional-commits
description: Write Conventional Commits grouped by related change. Load when committing work in this repo, or when the commit-crafter agent runs. Defines types, scopes, grouping strategy, message format, and breaking-change handling.
---

# Conventional Commits

Produce a clean history: one commit per logical change, typed and scoped. Complements the
global COMMIT-GENERATOR skill; this file is the project-local contract.

## Format

```
<type>(<scope>): <subject>

<body — what changed and why, wrapped ~72 cols>

<footer — BREAKING CHANGE / refs>
Co-Authored-By: Claude <noreply@anthropic.com>
```

## Types

`feat` (new capability) · `fix` (bug) · `docs` · `style` (formatting only) ·
`refactor` (no behavior change) · `perf` · `test` · `build` (deps/build system) ·
`ci` · `chore` (tooling/meta) · `revert`.

## Scope

The area touched. In this repo, common scopes: `hero`, `nav`, `footer` (and other section
names), `inspection`, `config`, `deps`, `skill`, `agents`, `commands`, `deploy`.

## Subject

Imperative mood, lowercase, no trailing period, ≤ ~72 chars.
Good: `feat(hero): add scroll-driven headline reveal`.
Bad: `Added hero animation.`

## Grouping strategy (most important)

Commit by **concern, not by file**:

- Building a section → `feat(<section>): …` with that section's component + spec.
- Config/tooling tweak → its own `chore`/`build` commit.
- Never bundle unrelated work (a component and a dependency bump) into one commit.
- Split a large working tree into a logical _sequence_ of commits.

Workflow: `git status` / `git diff` → decide groups → for each group `git add <paths>` then
commit → verify with `git log --oneline`.

## Breaking changes

Append `!` after type/scope and add a footer:

```
feat(config)!: switch deploy target to Cloudflare Workers

BREAKING CHANGE: `vercel.json` removed; use `wrangler deploy`.
```

## Rules

- One logical change per commit; keep the build green per commit where practical.
- Do not `git push` unless explicitly asked.
- On the default branch, create a feature branch first if the user wants one.
- Always end every commit message with the Co-Authored-By line above.
