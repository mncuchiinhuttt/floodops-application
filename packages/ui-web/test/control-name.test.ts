import { expect, test } from "vitest";
import { requireControlName } from "../src/primitives/control-name";

test("empty or rich unlabeled content cannot create an unnamed control", () => {
  for (const value of [null, undefined, false, "", " ", ["nested text"]]) {
    expect(() => requireControlName(value)).toThrow("non-empty");
  }
  expect(() => requireControlName("visible", " ")).toThrow("non-empty");
});
test("plain visible text, zero and explicit names are accepted", () => {
  expect(() => requireControlName("Save")).not.toThrow();
  expect(() => requireControlName(0)).not.toThrow();
  expect(() => requireControlName(null, "Refresh")).not.toThrow();
});
