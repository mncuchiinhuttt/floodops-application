import js from "@eslint/js";
import tseslint from "typescript-eslint";

const publicImports = [
  {
    group: ["@floodops/*/src/**", "**/node_modules/**"],
    message: "Import public workspace entrypoints; request missing exports from the owner."
  }
];

export default [
  {
    ignores: ["**/dist/**", "**/build/**", "coverage/**", "apps/*/coverage/**", "packages/*/coverage/**", "**/node_modules/**", "**/.wrangler/**", "**/.expo/**"]
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ["**/*.{js,mjs,ts,tsx}"],
    rules: {
      "max-lines": ["error", 199],
      "no-restricted-imports": ["error", { patterns: publicImports }]
    }
  },
  {
    files: ["packages/{domain,simulation,contracts}/src/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-globals": ["error", "window", "document", "Bun", "process"],
      "no-restricted-imports": ["error", {
        patterns: [...publicImports, {
          group: ["react", "react/*", "react-native", "hono", "hono/*", "cloudflare:*", "@cloudflare/*", "openai", "openai/*", "bun", "bun:*", "node:*", "**/apps/**"],
          message: "Keep shared domain and wire logic portable; inject platform ports."
        }]
      }]
    }
  },
  {
    files: ["apps/mobile/**/*.{ts,tsx}", "packages/ui-native/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": ["error", {
        patterns: [...publicImports, {
          group: ["@floodops/ui-web", "@floodops/ui-web/*", "@radix-ui/*", "react-dom", "react-dom/*", "**/apps/web/**"],
          message: "Native code must use native primitives and shared platform-neutral contracts."
        }]
      }]
    }
  },
  {
    files: ["**/*.{test,spec}.{ts,tsx}"],
    rules: { "max-lines": "off" }
  }
];

