import { afterEach, describe, expect, it } from "vitest";
import { reset, runDurableObjectAlarm, runInDurableObject } from "cloudflare:test";
import { drainCleanup } from "../../src/session-runtime/lifecycle";
import { Store } from "../../src/session-runtime/store";
import { bindings, create, headers, mutateSnapshot, request, rpc } from "../capabilities/helpers";
afterEach(reset);
describe("wall-clock expiry and private media cleanup", () => {
  it("denies expired access without waiting for an alarm", async () => {
    const f = await create();
    await mutateSnapshot(f, s => { s.meta.expires_at = new Date(Date.now() - 1).toISOString(); });
    const r = await request(`/sessions/${f.id}/identity`, { headers: headers(f) }); expect(r.status).toBe(410);
    const b = await r.json() as { error: { code: string } }; expect(b.error.code).toBe("SESSION_EXPIRED");
  });
  it("refreshes authenticated idle TTL within the absolute cap", async () => {
    const f = await create();
    await mutateSnapshot(f, s => { s.meta.expires_at = new Date(Date.now() + 1000).toISOString(); s.absoluteExpiry = Date.now() + 10000; });
    expect((await rpc(f, {})).status).toBe(200);
    const delta = await runInDurableObject(bindings.SESSIONS.get(bindings.SESSIONS.idFromName(f.id)), (_instance, state) => {
      const s = JSON.parse(state.storage.sql.exec<{ value: string }>("SELECT value FROM documents WHERE collection='runtime' AND id='snapshot'").one().value);
      return Date.parse(s.meta.expires_at) - s.absoluteExpiry;
    }); expect(delta).toBe(0);
  });
  it("does not refresh idle TTL for unauthorized probes", async () => {
    const f = await create(); const expiry = new Date(Date.now() + 1000).toISOString();
    await mutateSnapshot(f, s => { s.meta.expires_at = expiry; });
    expect((await request(`/sessions/${f.id}/identity`)).status).toBe(401);
    const stored = await runInDurableObject(bindings.SESSIONS.get(bindings.SESSIONS.idFromName(f.id)), (_instance, state) => JSON.parse(state.storage.sql.exec<{ value: string }>("SELECT value FROM documents WHERE collection='runtime' AND id='snapshot'").one().value).meta.expires_at);
    expect(stored).toBe(expiry);
  });
  it("retains cleanup intent during a delete failure and retries actual R2 deletion", async () => {
    const f = await create(); const key = `sessions/${f.id}/normalized/retry.png`;
    await bindings.REPORT_MEDIA!.put(key, "synthetic-private-media");
    const pending = await runInDurableObject(bindings.SESSIONS.get(bindings.SESSIONS.idFromName(f.id)), async (_instance, state) => {
      const store = new Store(state.storage); store.put("cleanup", key, { key });
      // Explicit fault stub only for this storage-outage case; retry below uses the real R2 binding.
      await drainCleanup(store, { ...bindings, REPORT_MEDIA: { delete: async () => { throw new Error("Synthetic R2 outage"); } } as unknown as R2Bucket });
      return store.list("cleanup").length;
    }); expect(pending).toBe(1);
    await runDurableObjectAlarm(bindings.SESSIONS.get(bindings.SESSIONS.idFromName(f.id)));
    expect(await bindings.REPORT_MEDIA!.head(key)).toBeNull();
  });
  it("cleans only owned report media through durable outbox and never advances sim time", async () => {
    const f = await create(); const key = `sessions/${f.id}/normalized/test.png`;
    await bindings.REPORT_MEDIA!.put(key, "synthetic-private-media");
    await bindings.REPORT_MEDIA!.put("shared-scenario/keep.png", "immutable-synthetic-fixture");
    await runInDurableObject(bindings.SESSIONS.get(bindings.SESSIONS.idFromName(f.id)), (_instance, state) => state.storage.sql.exec("INSERT INTO documents(collection,id,value) VALUES('media_keys',?,?)", key, JSON.stringify(key)));
    await mutateSnapshot(f, s => { s.meta.expires_at = new Date(Date.now() - 1).toISOString(); });
    await runDurableObjectAlarm(bindings.SESSIONS.get(bindings.SESSIONS.idFromName(f.id)));
    expect(await bindings.REPORT_MEDIA!.head(key)).toBeNull();
    expect((await bindings.REPORT_MEDIA!.head("shared-scenario/keep.png")) !== null).toBe(true);
    const sim = await runInDurableObject(bindings.SESSIONS.get(bindings.SESSIONS.idFromName(f.id)), (_instance, state) => JSON.parse(state.storage.sql.exec<{ value: string }>("SELECT value FROM documents WHERE collection='runtime' AND id='snapshot'").one().value).meta.sim_minute);
    expect(sim).toBe(0);
  });
});
