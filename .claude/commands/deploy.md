---
description: Verify and deploy the static site to Cloudflare Workers.
argument-hint: "[--dry-run]"
allowed-tools: Bash(npm run verify), Bash(npm run build), Bash(npx wrangler deploy:*), Bash(npx wrangler deploy --dry-run)
---

Deploy this Astro site to Cloudflare Workers static assets.

Steps:

1. Run `npm run verify` (astro check + eslint + build). Abort if it fails and report why.
2. Run `npx wrangler deploy --dry-run` to validate `wrangler.jsonc` and the `dist/` output.
3. If `$ARGUMENTS` contains `--dry-run`, stop here and report the dry-run result.
4. Otherwise run `npx wrangler deploy` and report the deployed URL.

Note: real deploys require Cloudflare auth (`wrangler login`) — if unauthenticated, tell the
user to run `! npx wrangler login` in the session, then re-run.
