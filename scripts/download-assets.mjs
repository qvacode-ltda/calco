#!/usr/bin/env node
/**
 * download-assets.mjs — batch asset downloader for the clone pipeline.
 *
 * Reads a JSON manifest (built from discover-assets.js) and downloads every asset
 * into public/ under the right subfolder. Concurrency is capped at 3 (project rule).
 * Doing downloads here — not through the model — is a core token-saving move.
 *
 * Manifest shape (any subset):
 *   {
 *     "images": ["https://…/hero.png", { "url": "https://…/a.webp", "name": "hero.webp" }],
 *     "videos": ["https://…/promo.mp4"],
 *     "fonts":  ["https://…/Inter.woff2"],
 *     "seo":    ["https://…/favicon.ico", "https://…/og.png"]
 *   }
 *
 * Usage:
 *   node scripts/download-assets.mjs docs/research/<hostname>/assets.json
 *   node scripts/download-assets.mjs < assets.json        # from stdin
 */

import { mkdir, writeFile, access } from "node:fs/promises";
import { dirname, join, basename, extname } from "node:path";

const CONCURRENCY = 3; // never exceed — project-wide parallelism cap
const PUBLIC = "public";
const DEST_DIR = { images: "images", videos: "videos", fonts: "fonts", seo: "seo" };

function safeName(url, fallbackExt = "") {
  try {
    const u = new URL(url);
    let name = basename(u.pathname) || "asset";
    name = name.split("?")[0].replace(/[^a-zA-Z0-9._-]/g, "-");
    if (!extname(name) && fallbackExt) name += fallbackExt;
    return name || "asset";
  } catch {
    return "asset";
  }
}

async function exists(p) {
  try {
    await access(p);
    return true;
  } catch {
    return false;
  }
}

async function downloadOne({ url, dest }) {
  if (await exists(dest)) return { url, dest, status: "skipped (exists)" };
  const res = await fetch(url, { redirect: "follow" });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  await mkdir(dirname(dest), { recursive: true });
  await writeFile(dest, buf);
  return { url, dest, status: `ok (${(buf.length / 1024).toFixed(1)} KB)` };
}

/** Run tasks with a fixed concurrency ceiling. */
async function pool(items, limit, worker) {
  const results = [];
  let i = 0;
  const runners = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (i < items.length) {
      const idx = i++;
      try {
        results[idx] = await worker(items[idx]);
      } catch (e) {
        results[idx] = {
          url: items[idx].url,
          dest: items[idx].dest,
          status: "FAILED: " + e.message,
        };
      }
    }
  });
  await Promise.all(runners);
  return results;
}

async function readInput() {
  const file = process.argv[2];
  if (file) return JSON.parse(await (await import("node:fs/promises")).readFile(file, "utf8"));
  const chunks = [];
  for await (const c of process.stdin) chunks.push(c);
  return JSON.parse(Buffer.concat(chunks).toString("utf8"));
}

const manifest = await readInput();

const tasks = [];
for (const [key, subdir] of Object.entries(DEST_DIR)) {
  for (const entry of manifest[key] || []) {
    const url = typeof entry === "string" ? entry : entry.url;
    if (!url) continue;
    const name = typeof entry === "object" && entry.name ? entry.name : safeName(url);
    tasks.push({ url, dest: join(PUBLIC, subdir, name) });
  }
}

if (!tasks.length) {
  console.error("No assets in manifest. Expected keys: " + Object.keys(DEST_DIR).join(", "));
  process.exit(1);
}

console.log(`Downloading ${tasks.length} asset(s) with concurrency ${CONCURRENCY}…`);
const results = await pool(tasks, CONCURRENCY, downloadOne);

let ok = 0;
let failed = 0;
for (const r of results) {
  if (r.status.startsWith("FAILED")) failed++;
  else ok++;
  console.log(`  ${r.status.startsWith("FAILED") ? "✗" : "✓"} ${r.dest}  [${r.status}]`);
}
console.log(`\nDone: ${ok} ok, ${failed} failed.`);
if (failed) process.exit(1);
