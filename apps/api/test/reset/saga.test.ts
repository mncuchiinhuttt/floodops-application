import { afterEach, describe, expect, it } from "vitest";
import { reset, runInDurableObject, evictDurableObject } from "cloudflare:test";
import { parseSchema } from "@floodops/contracts";
import { bindings, command, create, headers, invite, mutateSnapshot, request, requestKey, type Fixture } from "../capabilities/helpers";
afterEach(reset);
async function doReset(f: Fixture, key: string, auth = f): Promise<Response> {
  return request(`/sessions/${f.id}/resets`, { method: "POST", headers: headers(auth, { "Content-Type": "application/json", "Idempotency-Key": key, "If-Match": f.etag }), body: JSON.stringify({ client_type: f.cookie ? "web" : "native", confirm: true }) });
}
describe("durable reset saga", () => {
  it("allocates one replacement across concurrent retries and emits one tombstone", async () => {
    const f = await create(); const key = requestKey();
    const replies = await Promise.all([doReset(f, key), doReset(f, key), doReset(f, key)]);
    expect(replies.map(r => r.status)).toEqual([201, 201, 201]);
    const data = await Promise.all(replies.map(async r => parseSchema("ResetResultResponse", await r.json()).data!));
    expect(new Set(data.map(d => d.replacement.session.session_id)).size).toBe(1);
    const count = await runInDurableObject(bindings.SESSIONS.get(bindings.SESSIONS.idFromName(f.id)), (_instance, state) => state.storage.sql.exec<{ count: number }>("SELECT COUNT(*) AS count FROM events WHERE json_extract(value,'$.type')='session_reset'").one().count);
    expect(count).toBe(1);
    expect((await command(f, 1)).status).toBe(410);
  });
  it("recovers a rotated cookie when the reset response body was lost", async () => {
    const f = await create("web"); const key = requestKey(); const result = await doReset(f, key);
    expect(result.status).toBe(201);
    const cookie = result.headers.get("Set-Cookie")!.split(";")[0]!;
    await result.body!.cancel(); // The only delivered state is the rotated HttpOnly cookie.
    const replacement: Fixture = { ...f, token: cookie.split("=")[1]!, cookie, csrf: f.csrf };
    const replay = await doReset(f, key, replacement); expect(replay.status).toBe(201);
    const recovered = parseSchema("ResetResultResponse", await replay.json()).data!;
    replacement.id = recovered.replacement.session.session_id;
    expect(replacement.id === f.id).toBe(false);
    expect((await request(`/sessions/${f.id}/identity`, { headers: headers(replacement) })).status).toBe(401);
    expect((await request(`/sessions/${replacement.id}/identity`, { headers: headers(replacement) })).status).toBe(200);
  });
  it("rejects unrelated credentials, different key and different body in recovery", async () => {
    const f = await create(); const other = await create(); const key = requestKey(); expect((await doReset(f, key)).status).toBe(201);
    expect((await doReset(f, key, other)).status).toBe(401);
    expect((await doReset(f, requestKey())).status).toBe(410);
    const different = await request(`/sessions/${f.id}/resets`, { method: "POST", headers: headers(f, { "Content-Type": "application/json", "Idempotency-Key": key, "If-Match": f.etag }), body: JSON.stringify({ client_type: "web", confirm: true }) });
    expect(different.status).toBe(409);
  });
  it("resumes allocated and initialized crash checkpoints after eviction", async () => {
    const f = await create(); const key = requestKey();
    const first = await doReset(f, key); const target = parseSchema("ResetResultResponse", await first.json()).data!.replacement.session.session_id;
    for (const stage of ["allocated", "initialized"]) {
      await runInDurableObject(bindings.SESSIONS.get(bindings.SESSIONS.idFromName(f.id)), (_instance, state) => {
        const row = state.storage.sql.exec<{ value: string }>("SELECT value FROM documents WHERE collection='reset' AND id='intent'").one();
        const record = JSON.parse(row.value); record.stage = stage;
        state.storage.sql.exec("UPDATE documents SET value=? WHERE collection='reset' AND id='intent'", JSON.stringify(record));
        const snapshot = JSON.parse(state.storage.sql.exec<{ value: string }>("SELECT value FROM documents WHERE collection='runtime' AND id='snapshot'").one().value); snapshot.meta.status = "resetting";
        state.storage.sql.exec("UPDATE documents SET value=? WHERE collection='runtime' AND id='snapshot'", JSON.stringify(snapshot));
      });
      await evictDurableObject(bindings.SESSIONS.get(bindings.SESSIONS.idFromName(f.id)));
      const resumed = await doReset(f, key); expect(resumed.status).toBe(201);
      expect(parseSchema("ResetResultResponse", await resumed.json()).data!.replacement.session.session_id).toBe(target);
    }
  });
  it("keeps the old lock and fixed target when replacement initialization actually fails", async () => {
    const f = await create(); const key = requestKey();
    await mutateSnapshot(f, s => { s.seed.values.test_reset_fail_once = true; });
    expect((await doReset(f, key)).status).toBe(503);
    expect((await command(f, 1)).status).toBe(409);
    const target = await runInDurableObject(bindings.SESSIONS.get(bindings.SESSIONS.idFromName(f.id)), (_instance, state) => JSON.parse(state.storage.sql.exec<{ value: string }>("SELECT value FROM documents WHERE collection='reset' AND id='intent'").one().value).initialization.sessionId as string);
    const installed = await runInDurableObject(bindings.SESSIONS.get(bindings.SESSIONS.idFromName(target)), (_instance, state) => state.storage.sql.exec("SELECT id FROM documents WHERE collection='runtime' AND id='snapshot'").toArray().length);
    expect(installed).toBe(0);
    await evictDurableObject(bindings.SESSIONS.get(bindings.SESSIONS.idFromName(f.id)));
    const retry = await doReset(f, key); expect(retry.status).toBe(201);
    expect(parseSchema("ResetResultResponse", await retry.json()).data!.replacement.session.session_id).toBe(target);
  });
  it("does not let Reset elevate an invited dispatcher to owner", async () => {
    const owner = await create(); const invited = await invite(owner, "dispatcher");
    const result = await doReset(invited, requestKey()); expect(result.status).toBe(201);
    const replacement = parseSchema("ResetResultResponse", await result.json()).data!.replacement;
    expect(replacement.participant.is_owner).toBe(false);
    expect(replacement.participant.permissions.includes("manage_dispatchers")).toBe(false);
  });
});
