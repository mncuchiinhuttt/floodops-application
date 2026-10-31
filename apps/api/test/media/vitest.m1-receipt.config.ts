import { readFileSync } from "node:fs";
import { defineConfig } from "vitest/config";
import { cloudflareTest } from "@cloudflare/vitest-plugin";
const png = readFileSync(new URL("../../../../data/scenarios/functional-v2/synthetic-report.png", import.meta.url));
export default defineConfig({
  define: { __SOURCE_PNG__: JSON.stringify([...png]) },
  plugins: [cloudflareTest({ remoteBindings: false, wrangler: { configPath: new URL("./wrangler.m1-receipt.jsonc", import.meta.url).pathname } })],
  test: { include: ["apps/api/test/media/source-m1-receipt.workerd.ts"], testTimeout: 30000 }
});
