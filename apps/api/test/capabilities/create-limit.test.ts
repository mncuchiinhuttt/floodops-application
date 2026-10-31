import { expect, test } from "vitest";
import { createLimit } from "../../src/features/session/creation";

test("the per-address create limit defaults to 10 when unset or invalid", () => {
  for (const configured of [undefined, "", "0", "-3", "2.5", "abc", "1001", "5000"]) expect(createLimit(configured)).toBe(10);
});

test("a configured integer within 1..1000 is honoured", () => {
  expect(createLimit("1")).toBe(1);
  expect(createLimit("200")).toBe(200);
  expect(createLimit("1000")).toBe(1000);
});
