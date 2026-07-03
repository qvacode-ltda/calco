// @ts-check
import process from "node:process";
import { defineConfig } from "astro/config";
import tailwindcss from "@tailwindcss/vite";

// https://astro.build/config
// Static-first output → deployed to Cloudflare Workers static assets (see wrangler.jsonc).
// No adapter needed for a purely static clone. If a page ever needs SSR, install
// `@astrojs/cloudflare` and set `export const prerender = false` on that page only.
export default defineConfig({
  // Public demo lives on GitHub Pages (project site → served under /calco/).
  // ASTRO_BASE is set only by the Pages workflow; local dev and Cloudflare
  // deploys keep the default root base.
  site: "https://qvacode.github.io",
  base: process.env.ASTRO_BASE ?? "/",
  output: "static",
  vite: {
    plugins: [tailwindcss()],
  },
  image: {
    // Cloning pulls remote images; downloads land in public/images via the asset script.
    // Kept permissive for local inspection — tighten per project before shipping.
    remotePatterns: [{ protocol: "https" }],
  },
});
