#!/usr/bin/env node
/**
 * One-shot setup for Calco: checks the runtime, installs dependencies and the
 * Playwright browser the MCP server drives, and verifies Claude Code is
 * available. MCP servers themselves need no install step — Claude Code reads
 * .mcp.json at the repo root and launches them on demand via npx.
 *
 * Usage: npm run setup
 */
import { execSync, spawnSync } from "node:child_process";

const cyan = (s) => `\x1b[36m${s}\x1b[0m`;
const dim = (s) => `\x1b[2m${s}\x1b[0m`;
const ok = (s) => console.log(`  \x1b[32m✓\x1b[0m ${s}`);
const fail = (s) => console.error(`  \x1b[31m✗\x1b[0m ${s}`);

const run = (cmd) => execSync(cmd, { stdio: "inherit" });
const has = (cmd) =>
  spawnSync(process.platform === "win32" ? "where" : "which", [cmd]).status === 0;

console.log(`\n${cyan("▪")} calco setup\n`);

// 1. Node version — Astro 7 and wrangler require Node 20+.
const major = Number(process.versions.node.split(".")[0]);
if (major < 20) {
  fail(`Node ${process.versions.node} found — Calco needs Node 20+ (22 recommended, see .nvmrc).`);
  process.exit(1);
}
ok(`Node ${process.versions.node}`);

// 2. Project dependencies (Astro, Tailwind, wrangler, linters).
console.log(`\n${dim("installing dependencies…")}`);
run("npm install");
ok("dependencies installed");

// 3. Chromium for the Playwright MCP server (the extraction pipeline drives it).
console.log(`\n${dim("installing the Playwright Chromium browser…")}`);
run("npx -y playwright install chromium");
ok("Playwright Chromium ready");

// 4. Claude Code — the agent that drives the whole pipeline.
if (has("claude")) {
  ok("Claude Code CLI detected");
} else {
  fail("Claude Code CLI not found — install it: https://claude.com/claude-code");
}

console.log(`
${cyan("▪")} done. MCP servers (playwright + context7) are preconfigured in .mcp.json —
  Claude Code picks them up automatically when you open this folder.

  next steps:
    ${cyan("claude")}                          ${dim("# open Claude Code here")}
    ${cyan("/clone-website <url>")}            ${dim("# clone your first site")}
    ${cyan("npm run deploy")}                  ${dim("# ship it to Cloudflare")}
`);
