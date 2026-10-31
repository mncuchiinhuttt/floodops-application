import { afterEach, describe, expect, it } from "vitest";
import { reset, evictDurableObject } from "cloudflare:test";
import { bindings, command, create, headers, invite, request, requestKey, rpc } from "../capabilities/helpers";
afterEach(reset);
describe("metadata CAS in the authoritative SQLite transaction", () => {
  it("requires a current ETag without incrementing operational revision", async () => {
    const f = await create(); const key = requestKey();
    expect((await command(f, 0, key, null, "metadata-reject")).status).toBe(428);
    expect((await command(f, 0, key, '"stale"', "metadata-reject")).status).toBe(412);
    const result = await command(f, 0, key, f.etag, "metadata-reject"); expect(result.status).toBe(200);
    const body = await result.json() as { data: unknown; meta: { revision: number; event_sequence: number } };
    expect(body.data).toEqual({ rejected: true }); expect(body.meta.revision).toBe(0); expect(body.meta.event_sequence).toBe(1);
    expect((await command(f, 0, requestKey(), f.etag, "metadata-reject")).status).toBe(409);
    expect((await rpc(f, {})).body.meta.event_sequence).toBe(1);
  });
  it("replays exactly after eviction and later revision before checking old CAS", async () => {
    const f = await create(); const key = requestKey();
    const first = await command(f, 0, key, f.etag, "metadata-reject"); const original = await first.text();
    expect((await command(f, 1)).status).toBe(200);
    await evictDurableObject(bindings.SESSIONS.get(bindings.SESSIONS.idFromName(f.id)));
    const replay = await command(f, 0, key, f.etag, "metadata-reject"); expect(replay.status).toBe(200); expect(await replay.text()).toBe(original);
    expect((await command(f, 2, key, f.etag, "metadata-reject")).status).toBe(409);
    const identity = await rpc(f, {}); expect(identity.body.meta.revision).toBe(1); expect(identity.body.meta.event_sequence).toBe(2);
  });
  it("serializes same-revision reject decisions and concurrent operational writes", async () => {
    const f = await create(); const first = await Promise.all([command(f, 0, requestKey(), f.etag, "metadata-reject"), command(f, 0, requestKey(), f.etag, "metadata-reject")]);
    expect(first.map(r => r.status).sort()).toEqual([200, 409]); expect((await rpc(f, {})).body.meta.event_sequence).toBe(1);
    const g = await create(); const [operational, metadata] = await Promise.all([command(g, 1), command(g, 0, requestKey(), g.etag, "metadata-reject")]);
    expect(operational.status).toBe(200); expect([200, 412]).toContain(metadata.status);
    const identity = await rpc(g, {}); expect(identity.body.meta.revision).toBe(1); expect(identity.body.meta.event_sequence).toBe(metadata.status === 200 ? 2 : 1);
  });
  it("enforces capability, Origin, CSRF and Reset even for cached metadata", async () => {
    const f = await create("web"); const driver = await invite(f, "driver");
    expect((await command(driver, 0, requestKey(), f.etag, "metadata-reject")).status).toBe(403);
    for (const extras of [{ "X-CSRF-Token": "wrong" }, { Origin: "https://unapproved.invalid" }] as Record<string, string>[]) {
      const response = await request(`/sessions/${f.id}/test-commands/metadata-reject`, { method: "POST", headers: headers(f, { "Content-Type": "application/json", "Idempotency-Key": requestKey(), "If-Match": f.etag, ...extras }), body: JSON.stringify({ amount: 0 }) });
      expect(response.status).toBe(403);
    }
    const key = requestKey(); expect((await command(f, 0, key, f.etag, "metadata-reject")).status).toBe(200);
    expect((await rpc(f, { kind: "reset", key: requestKey(), ifMatch: f.etag, payload: { confirm: true, client_type: "web" } })).status).toBe(201);
    expect((await command(f, 0, key, f.etag, "metadata-reject")).status).toBe(410);
  });
});
