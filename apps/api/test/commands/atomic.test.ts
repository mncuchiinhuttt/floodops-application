import { afterEach, describe, expect, it } from "vitest";
import { reset, evictDurableObject, runInDurableObject } from "cloudflare:test";
import { bindings, command, create, headers, request, requestKey, rpc } from "../capabilities/helpers";
afterEach(reset);
describe("real SQLite atomic commands", () => {
  it("requires CAS, rejects stale CAS and does not reserve failed keys", async () => {
    const f = await create(); const key = requestKey();
    expect((await command(f, 1, key, null)).status).toBe(428);
    const first = await command(f, 1, key); expect(first.status).toBe(200);
    expect((await command(f, 2)).status).toBe(412);
    const replay = await command(f, 1, key); expect(replay.status).toBe(200);
    expect(await replay.text()).toBe(await first.text());
    expect((await command(f, 2, key)).status).toBe(409);
  });
  it("serializes simultaneous same-revision writes", async () => {
    const f = await create(); const results = await Promise.all([command(f, 1), command(f, 3)]);
    expect(results.map(r => r.status).sort()).toEqual([200, 412]);
    const identity = await rpc(f, {}); expect(identity.body.meta.revision).toBe(1); expect(identity.body.meta.event_sequence).toBe(1);
  });
  it("rolls back a reducer exception including event and outcome rows", async () => {
    const f = await create();
    const r = await request(`/sessions/${f.id}/test-commands/counter`, { method: "POST", headers: headers(f, { "Content-Type": "application/json", "If-Match": f.etag, "Idempotency-Key": requestKey() }), body: JSON.stringify({ amount: 9, fail: true }) });
    expect(r.status).toBe(503);
    const identity = await rpc(f, {}); expect(identity.body.meta.revision).toBe(0); expect(identity.body.meta.event_sequence).toBe(0);
    expect((await request(`/sessions/${f.id}/test-counter`, { headers: headers(f) })).status).toBe(200);
    const count = await (await request(`/sessions/${f.id}/test-counter`, { headers: headers(f) })).json() as { data: number }; expect(count.data).toBe(0);
  });
  it("replays the exact committed result after actual DO eviction", async () => {
    const f = await create(); const key = requestKey(); const r = await command(f, 7, key); const original = await r.text();
    await evictDurableObject(bindings.SESSIONS.get(bindings.SESSIONS.idFromName(f.id)));
    const replay = await command(f, 7, key); expect(replay.status).toBe(200); expect(await replay.text()).toBe(original);
  });
  it("keeps metadata changes separate from revision", async () => {
    const f = await create(); expect((await command(f, 0, requestKey(), null, "metadata")).status).toBe(200);
    const identity = await rpc(f, {}); expect(identity.body.meta.revision).toBe(0); expect(identity.body.meta.event_sequence).toBe(1);
  });
  it("rolls back a failure after the first event INSERT", async () => {
    const f = await create(); expect((await command(f, 1, requestKey(), f.etag, "invalid-event")).status).toBe(422);
    const r = await rpc(f, {}); expect(r.body.meta.revision).toBe(0); expect(r.body.meta.event_sequence).toBe(0);
    const page = await rpc(f, { kind: "events", after: 0 }); expect((page.body.data as { events: unknown[] }).events).toHaveLength(0);
  });
  it("stores sealed credential outcomes and capability digests", async () => {
    const f = await create();
    const leaks = await runInDurableObject(bindings.SESSIONS.get(bindings.SESSIONS.idFromName(f.id)), (_instance, state) => {
      const rows = state.storage.sql.exec<{ value: string }>("SELECT value FROM documents UNION ALL SELECT value FROM outcomes").toArray();
      return rows.some(r => r.value.includes(f.token));
    });
    expect(leaks).toBe(false);
  });
});
