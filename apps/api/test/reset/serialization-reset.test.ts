import { afterEach, describe, expect, it } from "vitest";
import { reset, evictDurableObject, runInDurableObject } from "cloudflare:test";
import { parseSchema } from "@floodops/contracts";
import { bindings, command, fixture, headers, mutateSnapshot, request, requestKey, rpc, type Fixture } from "../capabilities/helpers";
import { createVersioned, removeMarker, snapshot } from "../commands/versioned-helpers";
afterEach(reset);
async function doReset(f: Fixture, key = requestKey()) {
  return request(`/sessions/${f.id}/resets`, { method: "POST", headers: headers(f, { "Content-Type": "application/json", "Idempotency-Key": key, "If-Match": f.etag }),
    body: JSON.stringify({ confirm: true, client_type: f.cookie ? "web" : "native" }) });
}
describe("explicit Reset selects a fresh server seed, never relabels old values", () => {
  it("allows legacy identity and explicit Reset into fresh M1 state", async () => {
    const f = await createVersioned(); await removeMarker(f, "old");
    await mutateSnapshot(f, s => { s.values.counter = 44; s.values.report = { legacy_evidence: "synthetic" }; });
    expect((await rpc(f, {})).status).toBe(200); expect((await command(f, 1)).status).toBe(503);
    const response = await doReset(f); expect(response.status).toBe(201); const body = parseSchema("ResetResultResponse", await response.json()).data!;
    const replacement = fixture(body.replacement, response.headers.get("Set-Cookie")); const fresh = await snapshot(replacement);
    expect(fresh.seed.values.runtime_contract).toEqual({ serialization: "m1-v1", version: "0.5.0-m1" }); expect(fresh.values.counter).toBe(0);
    expect(fresh.values.report).toEqual({ pending: true, digest: "a".repeat(64) }); expect(fresh.meta.generation).toBe(1); expect(fresh.meta.revision).toBe(0);
    expect((await command(replacement, 1)).status).toBe(200); expect((await rpc(f, {})).status).toBe(410);
  });
  it.each(["wrong-scenario", "missing-marker", "async", "throws", "no-resolver"])("fails %s seed selection before persisting a Reset intent", async mode => {
    const f = await createVersioned(); await removeMarker(f);
    await mutateSnapshot(f, s => { s.seed.values.test_reset_seed_mode = mode; }); await evictDurableObject(bindings.SESSIONS.get(bindings.SESSIONS.idFromName(f.id)));
    const before = await snapshot(f); expect((await doReset(f)).status).toBe(503);
    const after = await snapshot(f); expect(after.meta.status).toBe("active"); expect(after.values).toEqual(before.values); expect(after.seed).toEqual(before.seed);
    const intents = await runInDurableObject(bindings.SESSIONS.get(bindings.SESSIONS.idFromName(f.id)), (_instance, state) => state.storage.sql.exec<{ count: number }>("SELECT COUNT(*) AS count FROM documents WHERE collection='reset'").one().count);
    expect(intents).toBe(0);
  });
  it("reuses a matching creation seed without requiring a resolver", async () => {
    const f = await createVersioned(); await mutateSnapshot(f, s => { s.seed.values.test_reset_seed_mode = "no-resolver"; });
    await evictDurableObject(bindings.SESSIONS.get(bindings.SESSIONS.idFromName(f.id))); expect((await doReset(f)).status).toBe(201);
  });
  it("recovers the persisted chosen seed and target without rerunning the factory", async () => {
    const f = await createVersioned(); await removeMarker(f); await mutateSnapshot(f, s => { s.seed.values.test_reset_fail_once = true; });
    await evictDurableObject(bindings.SESSIONS.get(bindings.SESSIONS.idFromName(f.id))); const key = requestKey(); expect((await doReset(f, key)).status).toBe(503);
    const locked = await snapshot(f); expect(locked.meta.status).toBe("resetting"); const target = locked.values.replacement_session_id;
    await mutateSnapshot(f, s => { s.seed.values.test_reset_seed_mode = "throws"; }); await evictDurableObject(bindings.SESSIONS.get(bindings.SESSIONS.idFromName(f.id)));
    const response = await doReset(f, key); expect(response.status).toBe(201); const result = parseSchema("ResetResultResponse", await response.json()).data!;
    expect(result.replacement.session.session_id).toBe(target); expect((await doReset(f, key)).status).toBe(201);
  });
});
