import { defineConfig } from "vitest/config";
import { cloudflareTest } from "@cloudflare/vitest-plugin";
export default defineConfig({
  plugins: [cloudflareTest({ remoteBindings: false, wrangler: { configPath: new URL("./wrangler.review.jsonc", import.meta.url).pathname } })],
  test: { include: ["apps/api/test/review/runtime/*.workerd.ts"], testTimeout: 20000 }
});
