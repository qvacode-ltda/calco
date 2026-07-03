#!/usr/bin/env node
/**
 * fetch-source.mjs — capture a page's REAL source (HTML + CSS) to disk.
 *
 * This is Phase 0 of the correct clone flow: get the actual markup/styles first,
 * then reverse-engineer. For a server-rendered site (Next.js/Astro/Rails/etc.) the
 * served HTML already contains the real DOM with its exact (Tailwind) class strings —
 * which is a far higher-fidelity, cheaper starting point than sampling getComputedStyle.
 *
 * Usage:
 *   node scripts/inspection/fetch-source.mjs https://example.com docs/research/example.com/raw
 *
 * Output (in <outDir>): index.html, <each>.css, _all.css (concatenated), js-bundles.txt.
 * Then prettify for navigation:  npx prettier --parser html <outDir>/index.html > <outDir>/index.pretty.html
 *
 * NOTE: for a client-rendered SPA the served HTML is a near-empty shell. In that case
 * capture the RENDERED DOM instead via Playwright MCP:
 *   browser_evaluate(() => document.documentElement.outerHTML)  → write to index.html.
 */

import { mkdir, writeFile } from "node:fs/promises";
import { join, basename } from "node:path";

const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 " +
  "(KHTML, like Gecko) Chrome/126 Safari/537.36";

const url = process.argv[2];
const outDir = process.argv[3];
if (!url || !outDir) {
  console.error("Usage: node scripts/inspection/fetch-source.mjs <url> <outDir>");
  process.exit(1);
}

const get = async (u) => {
  const res = await fetch(u, { headers: { "user-agent": UA }, redirect: "follow" });
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${u}`);
  return res.text();
};

await mkdir(outDir, { recursive: true });

// 1) HTML
const html = await get(url);
await writeFile(join(outDir, "index.html"), html);
console.log(`index.html  ${(html.length / 1024).toFixed(0)} KB`);

// 2) linked stylesheets
const cssHrefs = [
  ...html.matchAll(/<link[^>]+rel=["']stylesheet["'][^>]*>/gi),
]
  .map((m) => /href=["']([^"']+)["']/i.exec(m[0])?.[1])
  .filter(Boolean);

const cssParts = [];
for (const href of [...new Set(cssHrefs)].slice(0, 12)) {
  try {
    const abs = new URL(href, url).href;
    const css = await get(abs);
    const name = basename(new URL(abs).pathname) || "style.css";
    await writeFile(join(outDir, name), css);
    cssParts.push(css);
    console.log(`${name}  ${(css.length / 1024).toFixed(0)} KB`);
  } catch (e) {
    console.error(`  css skip ${href}: ${e.message}`);
  }
}
if (cssParts.length) await writeFile(join(outDir, "_all.css"), cssParts.join("\n"));

// 3) note JS bundles (do not download; inventory for behavior review)
const jsSrcs = [
  ...new Set(
    [...html.matchAll(/<script[^>]+src=["']([^"']+)["']/gi)].map((m) => m[1])
  ),
];
await writeFile(join(outDir, "js-bundles.txt"), jsSrcs.join("\n") + "\n");

console.log(
  `\nDone. ${cssParts.length} css file(s), ${jsSrcs.length} js bundle(s) noted.\n` +
    `Next: npx prettier --parser html ${join(outDir, "index.html")} > ${join(outDir, "index.pretty.html")}`
);
