import { writeFileSync } from "node:fs";
import source from "../tokens.json";
import { flattenTokens, resolveTokens } from "../src/resolve-tokens";

const resolved = resolveTokens(source);
const flat = flattenTokens(resolved);
const declarations = Object.entries(flat).filter(([name]) => !name.startsWith("primitive-") && name !== "version");
function cssValue(name: string, value: string | number): string {
  if (name.startsWith("motion-")) return `${value}ms`;
  if (/^(space|radius|stroke|target|density|type-size)-/.test(name)) return `${value}px`;
  if (/^(semantic-.*-(icon|pattern|label|dash))$/.test(name)) return JSON.stringify(value);
  return String(value);
}
const variables = declarations.map(([name, value]) => `  --fo-${name}: ${cssValue(name, value)};`);
const theme = declarations.flatMap(([name, value]) => {
  if (typeof value === "string" && value.startsWith("#")) {
    return [`  --color-${name.replace(/^semantic-/, "")}: var(--fo-${name});`];
  }
  if (name.startsWith("space-")) return [`  --spacing-${name}: var(--fo-${name});`];
  if (name.startsWith("radius-")) return [`  --${name}: var(--fo-${name});`];
  if (name.startsWith("type-size-")) return [`  --text-${name.slice(10)}: var(--fo-${name});`];
  return [];
});
const pack = (lines: string[]) => lines.reduce<string[]>((rows, line, index) => {
  if (index % 2 === 0) rows.push(line);
  else rows[rows.length - 1] += ` ${line.trim()}`;
  return rows;
}, []).join("\n");
const css = `/* Generated from tokens.json; run bun packages/design-tokens/scripts/generate.ts. */
:root {
${pack(variables)}
}
@theme inline {
${pack(theme)}
}
@media (prefers-reduced-motion: reduce) {
  :root { --fo-motion-fast: 0ms; --fo-motion-standard: 0ms; }
}
`;
writeFileSync(new URL("../src/tokens.css", import.meta.url), css);
writeFileSync(new URL("../src/tokens.native.ts", import.meta.url),
  `// Generated from tokens.json. Numeric dimensions use native dp.
export const tokens = ${JSON.stringify(resolved)} as const;
`);
