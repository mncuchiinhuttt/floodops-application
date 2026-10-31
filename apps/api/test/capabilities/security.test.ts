import { afterEach, describe, expect, it } from "vitest";
import { reset } from "cloudflare:test";
import { parseSchema } from "@floodops/contracts";
import { command, create, headers, invite, request, requestKey } from "./helpers";
afterEach(reset);
describe("actual Hono/SQLite capability boundary", () => {
  it("serves health and JSON API 404 through the Hono factory", async () => {
    expect(parseSchema("HealthResponse", await (await request("/health")).json()).data?.status).toBe("ok");
    const missing = await request("/not-a-route"); expect(missing.status).toBe(404);
    expect(missing.headers.get("Content-Type")).toContain("application/json");
  });
  it("isolates sessions and denies absent capabilities", async () => {
    const a = await create(); const b = await create();
    expect((await request(`/sessions/${a.id}/identity`)).status).toBe(401);
    expect((await request(`/sessions/${b.id}/identity`, { headers: headers(a) })).status).toBe(401);
    expect((await request(`/sessions/${a.id}/identity`, { headers: headers(a) })).status).toBe(200);
  });
  it("issues HttpOnly cookies and enforces paired CSRF/Origin", async () => {
    const f = await create("web");
    const identity = await request(`/sessions/${f.id}/identity`, { headers: headers(f) });
    expect(parseSchema("IdentityResponse", await identity.json()).data?.csrf_token === f.csrf).toBe(true);
    const h = headers(f, { "Content-Type": "application/json", "Idempotency-Key": requestKey() }); delete h["X-CSRF-Token"];
    expect((await request(`/sessions/${f.id}/invitations`, { method: "POST", headers: h, body: JSON.stringify({ role: "viewer", bound_entity_id: null, expires_in_seconds: 60 }) })).status).toBe(403);
    expect((await request(`/sessions/${f.id}/identity`, { headers: headers(f, { Origin: "https://evil.invalid" }) })).status).toBe(403);
  });
  it("does not let a bearer transport use a web cookie capability", async () => {
    const f = await create("web");
    expect((await request(`/sessions/${f.id}/identity`, { headers: { Authorization: `Bearer ${f.token}` } })).status).toBe(401);
  });
  it("derives role/entity from invitations and limits delegation", async () => {
    const owner = await create(); const driver = await invite(owner, "driver"); const dispatcher = await invite(owner, "dispatcher");
    expect((await command(driver, 1)).status).toBe(403);
    const identity = parseSchema("IdentityResponse", await (await request(`/sessions/${driver.id}/identity`, { headers: headers(driver) })).json()).data!;
    expect(identity.participant.bound_entity_id).toBe("driver_driver01"); expect(identity.participant.is_owner).toBe(false);
    const denied = await request(`/sessions/${owner.id}/invitations`, { method: "POST", headers: headers(dispatcher, { "Content-Type": "application/json", "Idempotency-Key": requestKey() }), body: JSON.stringify({ role: "dispatcher", bound_entity_id: null, expires_in_seconds: 60 }) });
    expect(denied.status).toBe(403);
  });
  it("revokes a capability without changing operational revision", async () => {
    const owner = await create(); const driver = await invite(owner, "driver");
    const revoked = await request(`/sessions/${owner.id}/participants/${driver.participant}`, { method: "DELETE", headers: headers(owner, { "Idempotency-Key": requestKey() }) });
    expect(revoked.status).toBe(200); expect(revoked.headers.get("ETag")).toBe(owner.etag);
    expect((await request(`/sessions/${driver.id}/identity`, { headers: headers(driver) })).status).toBe(401);
  });
  it("rejects arbitrary invitation entity and extra mutation fields", async () => {
    const f = await create();
    const r = await request(`/sessions/${f.id}/invitations`, { method: "POST", headers: headers(f, { "Content-Type": "application/json", "Idempotency-Key": requestKey() }), body: JSON.stringify({ role: "driver", bound_entity_id: "not_in_scenario", expires_in_seconds: 60 }) });
    expect(r.status).toBe(422);
    const extra = await request("/sessions", { method: "POST", headers: { "Content-Type": "application/json", "Idempotency-Key": requestKey(), "X-Client-Request-Scope": requestKey() }, body: JSON.stringify({ scenario_id: "scenario_platform01", scenario_version: "1", client_type: "native", role: "dispatcher" }) });
    expect(extra.status).toBe(422);
  });
  it("bounds JSON bytes while reading the actual request stream", async () => {
    const f = await create();
    const r = await request(`/sessions/${f.id}/test-commands/counter`, { method: "POST", headers: headers(f, { "Content-Type": "application/json", "Idempotency-Key": requestKey() }), body: JSON.stringify({ amount: 1, text: "x".repeat(70000) }) });
    expect(r.status).toBe(413);
  });
});
