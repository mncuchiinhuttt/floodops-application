import { expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import source from "../tokens.json";
import { tokens } from "../src/index";
import { flattenTokens, resolveTokens } from "../src/resolve-tokens";

test("all canonical tokens resolve into the native adapter without losing semantics", () => {
  expect(tokens).toEqual(resolveTokens(source));
  expect(tokens.target.native).toBeGreaterThanOrEqual(44);
  expect(tokens.target.web).toBeGreaterThanOrEqual(44);
});

test("CSS adapter preserves every semantic and dimensional value", () => {
  const css = readFileSync(new URL("../src/tokens.css", import.meta.url), "utf8");
  for (const [name, value] of Object.entries(flattenTokens(tokens))) {
    if (name.startsWith("primitive-") || name === "version") continue;
    const expected = typeof value === "string" && /-(icon|pattern|label|dash)$/.test(name)
      ? JSON.stringify(value) : `${value}${/^(space|radius|stroke|target|density|type-size)-/.test(name) ? "px" : name.startsWith("motion-") ? "ms" : ""}`;
    expect(css).toContain(`--fo-${name}: ${expected};`);
  }
});

test("invalid or recursive aliases fail instead of producing incomplete colors", () => {
  expect(() => resolveTokens({ invalid: "{primitive.missing}" })).toThrow("Unknown token reference");
  expect(() => resolveTokens({ invalid: "{semantic.text.primary}" })).toThrow("primitive scalar");
});
