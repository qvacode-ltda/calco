import eslintPluginAstro from "eslint-plugin-astro";
import tseslint from "typescript-eslint";

/** @type {import("eslint").Linter.Config[]} */
export default [
  { ignores: ["dist/", ".astro/", ".wrangler/", "node_modules/"] },
  ...tseslint.configs.recommended,
  ...eslintPluginAstro.configs.recommended,
  {
    rules: {
      // Cloning produces intentionally-typed content; keep the bar practical.
      "@typescript-eslint/no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],
    },
  },
];
