import { describe, expect, test } from "bun:test";
import manifest from "../../plans/20261030-2249-floodops-web-mobile-implementation/worktree-execution/roles.json";
import { assertOwnedPaths, assertRepoPath, changedPathsFromNameStatus, ownersForPath } from "./ownership.ts";

const item = "contracts-client-phase-01-v1";

describe("delivery write ownership", () => {
  test("protected manifests remain Lead-owned inside worker source prefixes", () => {
    expect(ownersForPath("packages/contracts/package.json", manifest, item)).toEqual(["integration-lead"]);
    expect(() => assertOwnedPaths(["packages/contracts/package.json"], "contracts-client", item, manifest)).toThrow();
    assertOwnedPaths(["packages/contracts/src/common/ids.ts"], "contracts-client", item, manifest);
  });

  test("review subtrees retain their separate owner", () => {
    const path = "apps/api/src/features/reports/review/router.ts";
    expect(ownersForPath(path, manifest, item)).toEqual(["review-rewards"]);
    expect(() => assertOwnedPaths([path], "sources-media", item, manifest)).toThrow();
  });

  test("reports are scoped to the exact role and work item", () => {
    const own = `plans/reports/worktree-contracts-client-${item}.md`;
    assertOwnedPaths([own], "contracts-client", item, manifest);
    expect(() => assertOwnedPaths([own], "web-console", item, manifest)).toThrow();
    expect(() => assertOwnedPaths([own], "contracts-client", "other-item", manifest)).toThrow();
  });

  test("unassigned paths and ambiguous ownership fail closed", () => {
    expect(() => assertOwnedPaths(["private/credentials.json"], "contracts-client", item, manifest)).toThrow();
    const overlapping = { ...manifest, roles: [...manifest.roles, { ...manifest.roles[1]!, id: "duplicate-owner" }] };
    expect(() => assertOwnedPaths(["packages/contracts/src/ids.ts"], "contracts-client", item, overlapping)).toThrow();
  });

  test("renames check both the old and new paths", () => {
    const paths = changedPathsFromNameStatus("R100\0packages/contracts/src/old.ts\0apps/api/src/index.ts\0");
    expect(paths).toHaveLength(2);
    expect(() => assertOwnedPaths(paths, "contracts-client", item, manifest)).toThrow();
  });

  test("rejects traversal, absolute paths and malformed diff records", () => {
    for (const path of ["/etc/passwd", "../secret", "a/../b", "a//b", "a/./b", "a/", "a\\b", "C:/temp/a"]) {
      expect(() => assertRepoPath(path)).toThrow();
    }
    expect(() => changedPathsFromNameStatus("R100\0only-one-side\0")).toThrow();
    expect(() => changedPathsFromNameStatus("U\0unmerged.ts\0")).toThrow();
    expect(() => changedPathsFromNameStatus("M\0unfinished.ts")).toThrow();
  });
});
