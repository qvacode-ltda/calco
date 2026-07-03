/**
 * Post-build rewrite for GitHub Pages project-site deploys.
 *
 * public/ assets are copied verbatim by Astro, so their root-relative URLs
 * (/images/…, /fonts/…) break when the site is served under a base path
 * (https://qvacode.github.io/calco/). Rewriting the built output keeps the
 * clone's source pristine (fidelity to the original markup) while making the
 * demo deployable anywhere. Also injects a noindex meta so the demo never
 * competes with the original site in search results.
 *
 * Usage: ASTRO_BASE=/calco node scripts/rebase-assets.mjs
 */
import { readdir, readFile, writeFile } from "node:fs/promises";
import { extname, join } from "node:path";

const base = (process.env.ASTRO_BASE ?? "").replace(/\/$/, "");
if (!base) {
  console.log("rebase-assets: ASTRO_BASE not set, nothing to do.");
  process.exit(0);
}

const DIST = new URL("../dist/", import.meta.url).pathname;
const EXTENSIONS = new Set([".html", ".css", ".js"]);
// Root-relative public/ asset prefixes, matched only after a URL boundary
// (quote, paren, comma, space or equals) so external URLs are never touched.
const ASSET_PATH = /(^|[\s"'(,=])\/(images|fonts|seo|videos)\//g;
const FAVICON = /(["'(])\/favicon\.svg/g;
const NOINDEX = '<meta name="robots" content="noindex">';

async function* walk(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) yield* walk(path);
    else if (EXTENSIONS.has(extname(entry.name))) yield path;
  }
}

let touched = 0;
for await (const file of walk(DIST)) {
  const source = await readFile(file, "utf8");
  let output = source
    .replaceAll(ASSET_PATH, `$1${base}/$2/`)
    .replaceAll(FAVICON, `$1${base}/favicon.svg`);
  if (file.endsWith(".html") && !output.includes(NOINDEX)) {
    output = output.replace("</head>", `${NOINDEX}</head>`);
  }
  if (output !== source) {
    await writeFile(file, output);
    touched += 1;
  }
}
console.log(`rebase-assets: rewrote ${touched} file(s) to base "${base}".`);
