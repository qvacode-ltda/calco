// @ts-check
import { defineConfig } from "astro/config";
import tailwindcss from "@tailwindcss/vite";

// https://astro.build/config
// Static-first output → deployed to Cloudflare Workers static assets (see wrangler.jsonc).
// No adapter needed for a purely static clone. If a page ever needs SSR, install
// `@astrojs/cloudflare` and set `export const prerender = false` on that page only.
export default defineConfig({
  // Replace with the deployed URL of the clone (used for canonical + sitemap).
  site: "https://example.com",
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
