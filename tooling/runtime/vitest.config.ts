import { defineConfig } from "vitest/config";
import { cloudflareTest } from "@cloudflare/vitest-plugin";
export default defineConfig({
  plugins: [cloudflareTest({ remoteBindings: false, wrangler: { configPath: new URL("./wrangler.jsonc", import.meta.url).pathname } })],
  test: { include: ["tooling/runtime/*.workerd.ts"], testTimeout: 20000 }
});
