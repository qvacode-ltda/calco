#!/usr/bin/env node
/**
 * rewrite-media.mjs — deterministic media-URL rewrite for source-first rebuilds.
 *
 * When you reconstruct a component from the target's real HTML, its <img> src values
 * point at the origin (e.g. /_next/static/media/<hash>.png). This maps every one to the
 * local download (/images/<name>) using the manifest, and injects intrinsic width/height
 * + loading="lazy" for PNG/JPEG so the clone has no layout shift. Doing this in Node (not
 * by hand in the model) is exact and cheap.
 *
 * Usage:
 *   node scripts/inspection/rewrite-media.mjs <file.astro|html> <assets.json>
 */

import { readFile, writeFile } from "node:fs/promises";
import { basename } from "node:path";

const [file, assetsPath] = process.argv.slice(2);
if (!file || !assetsPath) {
  console.error("Usage: node scripts/inspection/rewrite-media.mjs <file> <assets.json>");
  process.exit(1);
}

const manifest = JSON.parse(await readFile(assetsPath, "utf8"));
const DIRS = { images: "images", videos: "videos", fonts: "fonts", seo: "seo" };

// Build url/pathname -> /local/path map.
const map = new Map();
for (const [key, dir] of Object.entries(DIRS)) {
  for (const entry of manifest[key] || []) {
    const url = typeof entry === "string" ? entry : entry.url;
    if (!url) continue;
    const name = typeof entry === "object" && entry.name ? entry.name : basename(new URL(url).pathname);
    const local = `/${dir}/${name}`;
    map.set(url, local);
    try {
      map.set(new URL(url).pathname, local);
    } catch {
      /* ignore */
    }
  }
}

let text = await readFile(file, "utf8");
let rewrites = 0;
// Replace longest keys first so full URLs win over pathnames.
for (const key of [...map.keys()].sort((a, b) => b.length - a.length)) {
  const local = map.get(key);
  const parts = text.split(key);
  if (parts.length > 1) {
    rewrites += parts.length - 1;
    text = parts.join(local);
  }
}

// ---- intrinsic dimensions (PNG/JPEG), injected into <img> lacking width/height ----
function pngSize(buf) {
  if (buf.length < 24 || buf.readUInt32BE(0) !== 0x89504e47) return null;
  return { w: buf.readUInt32BE(16), h: buf.readUInt32BE(20) };
}
function jpegSize(buf) {
  if (buf[0] !== 0xff || buf[1] !== 0xd8) return null;
  let o = 2;
  while (o < buf.length) {
    if (buf[o] !== 0xff) {
      o++;
      continue;
    }
    const marker = buf[o + 1];
    const len = buf.readUInt16BE(o + 2);
    if ((marker >= 0xc0 && marker <= 0xcf) && ![0xc4, 0xc8, 0xcc].includes(marker)) {
      return { h: buf.readUInt16BE(o + 5), w: buf.readUInt16BE(o + 7) };
    }
    o += 2 + len;
  }
  return null;
}
async function dims(localPath) {
  try {
    const buf = await readFile("public" + localPath);
    return pngSize(buf) || jpegSize(buf);
  } catch {
    return null;
  }
}

let injected = 0;
const imgTags = [...text.matchAll(/<img\b[^>]*>/gi)].map((m) => m[0]);
for (const tag of new Set(imgTags)) {
  if (/\bwidth=/.test(tag) && /\bheight=/.test(tag)) continue;
  const src = /\bsrc=["']([^"']+)["']/.exec(tag)?.[1];
  if (!src || !src.startsWith("/images/")) continue;
  const d = await dims(src);
  if (!d) continue;
  let next = tag.replace(/\s*\/?>$/, "");
  if (!/\bwidth=/.test(next)) next += ` width="${d.w}"`;
  if (!/\bheight=/.test(next)) next += ` height="${d.h}"`;
  if (!/\bloading=/.test(next)) next += ` loading="lazy"`;
  next += tag.endsWith("/>") ? " />" : ">";
  text = text.split(tag).join(next);
  injected++;
}

await writeFile(file, text);
console.log(`rewrote ${rewrites} media URL(s); injected dims into ${injected} <img>; wrote ${file}`);
