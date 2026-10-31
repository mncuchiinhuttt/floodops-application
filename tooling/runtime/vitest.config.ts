import { defineConfig } from "vitest/config";
import { cloudflareTest } from "@cloudflare/vitest-plugin";
import { readFileSync } from "node:fs";
export default defineConfig({
  define: { __MVP_PNG__: JSON.stringify([...readFileSync(new URL("../../data/scenarios/functional-v1/synthetic-report.png", import.meta.url))]) },
  plugins: [cloudflareTest({ remoteBindings: false, wrangler: { configPath: new URL("./wrangler.jsonc", import.meta.url).pathname } })],
  test: { include: ["tooling/runtime/*.workerd.ts"], testTimeout: 20000 }
});
