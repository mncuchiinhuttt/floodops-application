import { defineConfig } from "vitest/config";
import { cloudflareTest } from "@cloudflare/vitest-plugin";
export default defineConfig({
  plugins: [cloudflareTest({ remoteBindings: false, wrangler: { configPath: "./wrangler.test.jsonc" } })],
  test: { include: ["test/{capabilities,commands,replay,reset,expiry}/**/*.test.ts"], testTimeout: 20000 },
});
