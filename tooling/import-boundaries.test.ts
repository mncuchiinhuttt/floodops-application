import { describe, expect, test } from "bun:test";
import { ESLint } from "eslint";

const eslint = new ESLint();

async function rulesFor(source: string, filePath: string) {
  const results = await eslint.lintText(source, { filePath });
  return results.flatMap(result => result.messages.map(message => message.ruleId));
}

describe("workspace import boundaries", () => {
  test("rejects web UI in native features", async () => {
    const rules = await rulesFor('import "@floodops/ui-web";', "apps/mobile/src/features/reports/index.ts");
    expect(rules).toContain("no-restricted-imports");
  });

  test("rejects Bun-specific runtime imports in pure domain code", async () => {
    const rules = await rulesFor('import "bun";', "packages/domain/src/operations/index.ts");
    expect(rules).toContain("no-restricted-imports");
  });

  test("allows portable shared contract imports", async () => {
    const rules = await rulesFor('import "@floodops/contracts";', "apps/mobile/src/features/reports/index.ts");
    expect(rules).toEqual([]);
  });
});
