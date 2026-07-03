import eslintPluginAstro from "eslint-plugin-astro";
import tseslint from "typescript-eslint";

/** @type {import("eslint").Linter.Config[]} */
export default [
  // .claude/workflows/* run in the Workflow runtime (top-level await/return, agent()/phase()
  // globals) — not standard ES modules, so exclude them from linting.
  // examples/* are self-contained projects linted by their own eslint config.
  { ignores: ["dist/", ".astro/", ".wrangler/", "node_modules/", ".claude/workflows/", "examples/"] },
  ...tseslint.configs.recommended,
  ...eslintPluginAstro.configs.recommended,
  {
    rules: {
      // Cloning produces intentionally-typed content; keep the bar practical.
      "@typescript-eslint/no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],
    },
  },
];
