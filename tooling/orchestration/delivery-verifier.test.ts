import { afterEach, describe, expect, test } from "bun:test";
import { symlink } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { createFixture } from "./delivery-test-fixture.ts";
import { verifyDelivery } from "./delivery-verifier-core.ts";

const fixtures: Awaited<ReturnType<typeof createFixture>>[] = [];
async function fixture(options: Parameters<typeof createFixture>[0] = {}) { const value = await createFixture(options); fixtures.push(value); return value; }
afterEach(async () => { await Promise.all(fixtures.splice(0).map(value => value.dispose())); });

describe("exact delivery protocol on isolated Git histories", () => {
  test("accepts regular owned source followed by report-only R", async () => {
    const f = await fixture(); const result = await verifyDelivery(await f.finish(), f.git);
    expect(result.owned_changed_paths).toBe(2); expect(result.report_path).toBe(f.report);
  });
  test("accepts an explicitly narrower independent slice", async () => {
    const f = await fixture({ partial: true }); expect((await verifyDelivery(await f.finish(), f.git)).work_item).toBe("simulation-test-v1");
  });
  test("CLI verifies a real isolated delivery from its working directory", async () => {
    const f = await fixture({ partial: true }); const input = await f.finish();
    const cli = fileURLToPath(new URL("./verify-delivery.ts", import.meta.url));
    const process = Bun.spawn([Bun.argv[0]!, cli, input.receiptPath, input.launchSha, input.sourceSha, input.deliverySha], { cwd: f.root, stdin: "ignore", stdout: "pipe", stderr: "pipe" });
    const [output, error, status] = await Promise.all([new Response(process.stdout).text(), new Response(process.stderr).text(), process.exited]);
    expect(error).toBe(""); expect(status).toBe(0); expect(JSON.parse(output).delivery_sha).toBe(input.deliverySha);
  });
  test("rejects role-owned source outside the partial work item", async () => {
    const f = await fixture({ partial: true });
    await expect(verifyDelivery(await f.finish([["packages/simulation/src/scenario.ts", "export const scenario = 1;\n"]]), f.git)).rejects.toThrow("Outside partial");
  });
  test("rejects a forged pinned index hash", async () => {
    const f = await fixture({ badHash: true }); await expect(verifyDelivery(await f.finish(), f.git)).rejects.toThrow("Pinned hash mismatch");
  });
  test("rejects indexed input drift between declaration and launch", async () => {
    const f = await fixture({ artifactDrift: true }); await expect(verifyDelivery(await f.finish(), f.git)).rejects.toThrow("Artifact drift");
  });
  test("rejects application changes hidden in launch metadata", async () => {
    const f = await fixture({ launchSource: true }); await expect(verifyDelivery(await f.finish(), f.git)).rejects.toThrow("metadata only");
  });
  test("rejects protected manifests even within a worker source prefix", async () => {
    const f = await fixture(); await expect(verifyDelivery(await f.finish([["packages/simulation/package.json", "{}\n"]]), f.git)).rejects.toThrow("Ownership denied");
  });
  test("rejects delivered policy changes", async () => {
    const f = await fixture(); await expect(verifyDelivery(await f.finish([["AGENTS.md", "relaxed\n"]]), f.git)).rejects.toThrow("Delivered policy");
  });
  test("rejects source changes in report commit", async () => {
    const f = await fixture(); await expect(verifyDelivery(await f.finish(undefined, { extraSource: true }), f.git)).rejects.toThrow("C-to-R");
  });
  test("requires direct C-to-R, not only ancestor reachability", async () => {
    const f = await fixture(); await expect(verifyDelivery(await f.finish(undefined, { gap: true }), f.git)).rejects.toThrow("direct child");
  });
  test("requires report evidence to reference the exact source C", async () => {
    const f = await fixture(); await expect(verifyDelivery(await f.finish(undefined, { wrongSource: true }), f.git)).rejects.toThrow("reference C");
  });
  test("rejects committed source symlinks", async () => {
    const f = await fixture(); await f.write("packages/simulation/src/graph/target.ts", "export {};\n");
    await symlink("target.ts", join(f.root, "packages/simulation/src/graph/link.ts"));
    await expect(verifyDelivery(await f.finish(), f.git)).rejects.toThrow("Non-regular source");
  });
  test("rejects malformed SHAs before calling Git", async () => {
    const f = await fixture(); const input = await f.finish();
    await expect(verifyDelivery({ ...input, launchSha: "HEAD" }, f.git)).rejects.toThrow("exact SHA");
  });
});
