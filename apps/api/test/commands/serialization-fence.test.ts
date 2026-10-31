import { afterEach, describe, expect, it } from "vitest";
import { reset, evictDurableObject } from "cloudflare:test";
import { parseSchema } from "@floodops/contracts";
import { bindings, command, create, invite, mutateSnapshot, requestKey, rpc } from "../capabilities/helpers";
import { context, metadata, queued, reportId, stored } from "./image-fixtures";
import { createVersioned, removeMarker, snapshot } from "./versioned-helpers";
afterEach(reset);
describe("optional registry serialization fence on real Workerd", () => {
  it("keeps unconfigured generic registries usable without a domain marker", async () => {
    const f = await create(); expect((await snapshot(f)).seed.values.runtime_contract).toBeUndefined();
    expect((await command(f, 1)).status).toBe(200); expect((await rpc(f, { kind: "view", name: "counter" })).body.data).toBe(1);
    expect((await queued(f)).job.status).toBe("queued");
  });
  it.each(["missing", "old", "null", "mutable-only"] as const)("fences %s marker without rewriting legacy values or outcomes", async mode => {
    const f = await createVersioned(); await removeMarker(f, mode); await mutateSnapshot(f, s => { s.values.report = { legacy_evidence: "synthetic" }; });
    await evictDurableObject(bindings.SESSIONS.get(bindings.SESSIONS.idFromName(f.id))); const before = await snapshot(f);
    const result = await command(f, 9); expect(result.status).toBe(503); expect((await result.json() as { error: { code: string } }).error.code).toBe("CONFIG_INCOMPLETE");
    expect((await rpc(f, { kind: "view", name: "counter" })).status).toBe(503);
    expect((await metadata.read(context(f), reportId)).status).toBe(503);
    const identity = await rpc(f, {}); expect(identity.status).toBe(200); expect(identity.body.meta.revision).toBe(0);
    expect((await rpc(f, { kind: "meta" })).status).toBe(200); expect((await rpc(f, { kind: "events", after: 0 })).status).toBe(200);
    const after = await snapshot(f); expect(after.values).toEqual(before.values); expect(after.seed).toEqual(before.seed); expect(after.meta.event_sequence).toBe(0);
  });
  it("fences even a cached legacy reply while preserving exact current-version replay before CAS", async () => {
    const f = await createVersioned(); const key = requestKey(); const response = await command(f, 1, key); const committed = await response.text();
    expect((await command(f, 2, requestKey(), response.headers.get("ETag"))).status).toBe(200);
    const seed = (await snapshot(f)).seed; await removeMarker(f);
    expect((await command(f, 1, key, f.etag)).status).toBe(503);
    await mutateSnapshot(f, state => { state.seed = seed; state.values.runtime_contract = seed.values.runtime_contract; });
    const replay = await command(f, 1, key, f.etag); expect(replay.status).toBe(200); expect(await replay.text()).toBe(committed);
    expect((await command(f, 2, key, f.etag)).status).toBe(409); expect((await rpc(f, {})).body.meta.revision).toBe(2);
  });
  it("authorizes before revealing serialization state for commands, views and image hooks", async () => {
    const f = await createVersioned("web"); const driver = await invite(f, "driver"); await removeMarker(f);
    expect((await command(driver, 0, requestKey(), f.etag, "metadata-reject")).status).toBe(403);
    expect((await rpc(driver, { kind: "view", name: "counter" })).status).toBe(403);
    expect((await metadata.read(context(driver), reportId)).status).toBe(403);
    const bad = context(f); bad.auth.csrf = null;
    expect((await metadata.reserve(bad, reportId, requestKey())).status).toBe(403);
    const absent = { ...f, token: "A".repeat(43), cookie: null, csrf: null };
    expect((await metadata.read(context(absent), reportId)).status).toBe(401);
  });
  it("blocks old image callbacks, cached reserve and reads without a charge or publication", async () => {
    const f = await createVersioned(); const key = requestKey(); const reserved = await metadata.reserve(context(f), reportId, key);
    const job = parseSchema("ImageReviewJob", reserved.body.data); const lease = reserved.effect!.lease as string; const before = await stored(f); await removeMarker(f);
    for (const result of [await metadata.reserve(context(f), reportId, key), await metadata.read(context(f), reportId),
      await metadata.start(context(f), reportId, job.job_id, lease), await metadata.complete(context(f), reportId, job.job_id, lease, { error_code: "MODEL_UNAVAILABLE" }),
      await metadata.failQueued(context(f), reportId, job.job_id, lease, "STORAGE_UNAVAILABLE")]) expect(result.status).toBe(503);
    expect(await stored(f)).toEqual(before); expect((await rpc(f, {})).body.meta.event_sequence).toBe(1);
  });
});
