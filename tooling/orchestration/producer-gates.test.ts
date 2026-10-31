import { afterEach, describe, expect, test } from "bun:test";
import { createFixture } from "./delivery-test-fixture.ts";
import { coordinationRoot, sha256 } from "./delivery-verifier-core.ts";
import { verifyProducerGates } from "./producer-gates.ts";

const fixtures: Awaited<ReturnType<typeof createFixture>>[] = [];
async function fixture() { const f = await createFixture(); fixtures.push(f); return f; }
afterEach(async () => { await Promise.all(fixtures.splice(0).map(f => f.dispose())); });
async function publish(f: Awaited<ReturnType<typeof createFixture>>, patch: Record<string, unknown> = {}) {
  await f.write(`${coordinationRoot}/gates/platform-ready.json`, JSON.stringify({ gate_id: "platform-ready", status: "passed", writer: "integration-lead", commit_sha: f.launchSha, ...patch }));
  return f.commit("fixture gate record");
}
describe("producer gate preflight", () => {
  test("accepts committed evidence bound to ancestor source", async () => {
    const f = await fixture(); const candidate = await publish(f, {producer_source_sha:f.launchSha});
    const result = await verifyProducerGates(candidate, ["platform-ready"], f.git);
    expect(result.coordination_ready).toBe(true); expect(result.checks[0]?.evidence_commit).toBe(f.launchSha);
  });
  test("missing gate remains blocked without synthesizing evidence", async () => {
    const f = await fixture(); const result = await verifyProducerGates(f.launchSha, ["simulation-ready", "platform-ready"], f.git);
    expect(result.coordination_ready).toBe(false); expect(result.checks.every(g=>g.status==="blocked")).toBe(true);
    expect((await f.git("status", "--porcelain")).trim()).toBe("");
  });
  test("pending or non-Lead records cannot pass", async () => {
    for (const patch of [{status:"pending"},{writer:"worker"},{gate_id:"other-gate"}]) {
      const f = await fixture(); expect((await verifyProducerGates(await publish(f,patch),["platform-ready"],f.git)).coordination_ready).toBe(false);
    }
  });
  test("unmerged producer commit blocks even with a passed label", async () => {
    const f = await fixture(); const tree=(await f.git("rev-parse",`${f.launchSha}^{tree}`)).trim();
    const sibling=(await f.git("commit-tree",tree,"-p",f.launchSha,"-m","unmerged producer")).trim();
    expect((await verifyProducerGates(await publish(f,{producer_delivery_sha:sibling}),["platform-ready"],f.git)).coordination_ready).toBe(false);
  });
  test("malformed or nonexistent evidence commit blocks", async () => {
    for (const commit_sha of ["HEAD","0".repeat(40)]) {
      const f=await fixture(); expect((await verifyProducerGates(await publish(f,{commit_sha}),["platform-ready"],f.git)).coordination_ready).toBe(false);
    }
  });
  test("optional public interface hash is verified, never ignored", async () => {
    const f=await fixture(); const path=`${coordinationRoot}/contracts/platform.json`; await f.write(path,"published ports\n");
    const candidate=await publish(f,{contract_index:{path,sha256:sha256("published ports\n")}});
    expect((await verifyProducerGates(candidate,["platform-ready"],f.git)).coordination_ready).toBe(true);
    const drifted=await publish(f,{contract_index:{path,sha256:"0".repeat(64)}});
    expect((await verifyProducerGates(drifted,["platform-ready"],f.git)).coordination_ready).toBe(false);
  });
  test("rejects empty, duplicate or unsafe IDs and symbolic candidate refs", async () => {
    const f=await fixture();
    for(const gates of [[],["platform-ready","platform-ready"],["../escape"]]) await expect(verifyProducerGates(f.launchSha,gates,f.git)).rejects.toThrow();
    await expect(verifyProducerGates("HEAD",["platform-ready"],f.git)).rejects.toThrow("exact");
  });
});
