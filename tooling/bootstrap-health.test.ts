import { describe, expect, test } from "bun:test";
import { parseSchema } from "@floodops/contracts";
import { createApp, type PlatformBindings } from "../apps/api/src/app/index.ts";

const app = createApp([], { loadScenario: async () => { throw new Error("unexpected scenario access"); } });
const env = { APP_ENV: "development", WEB_ORIGIN: "https://floodops.test" } as PlatformBindings;
describe("integrated portable Hono health boundary under Bun", () => {
  test("returns the canonical health envelope and privacy headers", async () => {
    const response = await app.request("https://floodops.test/api/v1/health", {}, env);
    expect(response.status).toBe(200);
    expect(parseSchema("HealthResponse", await response.json()).data).toEqual({ status: "ok", version: "0.0.0", environment: "development" });
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    expect(response.headers.get("X-Content-Type-Options")).toBe("nosniff");
  });
  test("keeps unknown endpoints unavailable with a typed error", async () => {
    const response = await app.request("https://floodops.test/api/v1/unknown-feature", {}, env);
    expect(response.status).toBe(404);
    expect(((await response.json()) as { error: { code: string } }).error.code).toBe("NOT_FOUND");
  });
  test("rejects an untrusted Origin before dispatch", async () => {
    const response = await app.request("https://floodops.test/api/v1/health", { headers: { Origin: "https://other.test" } }, env);
    expect(response.status).toBe(403);
    expect(((await response.json()) as { error: { code: string } }).error.code).toBe("FORBIDDEN");
  });
});
