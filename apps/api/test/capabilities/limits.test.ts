import { afterEach, describe, expect, it } from "vitest";
import { reset, runInDurableObject } from "cloudflare:test";
import { parseSchema } from "@floodops/contracts";
import { bindings, create, headers, invite, request, requestKey } from "./helpers";
afterEach(reset);
describe("resource limits and strict wire projections", () => {
  it("enforces ten creations per IP/hour and caches public create credentials", async () => {
    const key = requestKey(); const scope = requestKey();
    const options = { method: "POST", headers: { "Content-Type": "application/json", "Idempotency-Key": key, "X-Client-Request-Scope": scope }, body: JSON.stringify({ scenario_id: "scenario_platform01", scenario_version: "1", client_type: "native" }) };
    const first = await request("/sessions", options); const a = parseSchema("SessionCreatedResponse", await first.json()).data!;
    for (let i = 0; i < 9; i++) await create();
    const replay = await request("/sessions", options); expect(replay.status).toBe(201);
    expect(parseSchema("SessionCreatedResponse", await replay.json()).data!.session.session_id).toBe(a.session.session_id);
    const denied = await request("/sessions", { ...options, headers: { ...options.headers, "Idempotency-Key": requestKey() } });
    expect(denied.status).toBe(429); expect(Number(denied.headers.get("Retry-After"))).toBeGreaterThan(0);
  });
  it("paginates participants and rejects cross-session cursors", async () => {
    const f = await create(); await invite(f, "viewer"); await invite(f, "driver");
    const first = parseSchema("ParticipantListResponse", await (await request(`/sessions/${f.id}/participants?limit=1`, { headers: headers(f) })).json()).data!;
    expect(first.items).toHaveLength(1); expect(first.page.has_more).toBe(true);
    const second = parseSchema("ParticipantListResponse", await (await request(`/sessions/${f.id}/participants?limit=1&cursor=${encodeURIComponent(first.page.next_cursor!)}`, { headers: headers(f) })).json()).data!;
    expect(second.items[0]!.participant_id === first.items[0]!.participant_id).toBe(false);
    const other = await create();
    expect((await request(`/sessions/${other.id}/participants?cursor=${encodeURIComponent(first.page.next_cursor!)}`, { headers: headers(other) })).status).toBe(422);
  });
  it("rejects stale retention cursors with a typed 410", async () => {
    const f = await create();
    await runInDurableObject(bindings.SESSIONS.get(bindings.SESSIONS.idFromName(f.id)), (_instance, state) => state.storage.sql.exec("INSERT INTO documents(collection,id,value) VALUES('runtime','event_floor','1')"));
    const r = await request(`/sessions/${f.id}/events?after=0`, { headers: headers(f) }); expect(r.status).toBe(410);
    expect(parseSchema("ErrorResponse", await r.json()).error.code).toBe("EVENT_CURSOR_EXPIRED");
  });
});
