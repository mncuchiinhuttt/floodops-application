import { describe, expect, test } from "bun:test";
import worker from "../apps/api/src/index.ts";

describe("bootstrap Worker handler under Bun", () => {
  test("reports bootstrap status over the health route", async () => {
    const response = await worker.fetch(new Request("https://bootstrap.test/api/v1/health"));
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ status: "bootstrap", api_version: "v1" });
  });

  test("does not claim unimplemented application routes are available", async () => {
    const response = await worker.fetch(new Request("https://bootstrap.test/api/v1/sessions"));
    expect(response.status).toBe(404);
  });
});
