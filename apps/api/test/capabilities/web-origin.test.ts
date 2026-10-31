import { expect, test } from "vitest";
import { isWebOrigin } from "../../src/shared/web-origin";

const configured = "https://floodops-api.example.workers.dev, https://floodops.example.dev";

test("every configured origin is accepted, with surrounding spaces ignored", () => {
  expect(isWebOrigin(configured, "https://floodops-api.example.workers.dev")).toBe(true);
  expect(isWebOrigin(configured, "https://floodops.example.dev")).toBe(true);
});

test("origins that merely resemble a configured one are rejected", () => {
  for (const origin of ["https://floodops.example.dev.evil.test", "http://floodops.example.dev", "https://floodops.example.dev:8443", "https://FLOODOPS.example.dev/", "", null, undefined])
    expect(isWebOrigin(configured, origin)).toBe(false);
});

test("a single-origin value behaves exactly like the previous equality check", () => {
  expect(isWebOrigin("https://floodops.test", "https://floodops.test")).toBe(true);
  expect(isWebOrigin("https://floodops.test", "https://other.test")).toBe(false);
});
