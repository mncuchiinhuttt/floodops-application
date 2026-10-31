import { defineConfig } from "vitest/config";
import { cloudflareTest } from "@cloudflare/vitest-plugin";
export default defineConfig({ plugins: [cloudflareTest({ remoteBindings: false,
  wrangler: { configPath: new URL("./wrangler.planning.jsonc", import.meta.url).pathname } })],
test: { include: ["apps/api/test/planning/*.workerd.ts", "apps/api/test/execution/*.workerd.ts"], testTimeout: 60000 } });
