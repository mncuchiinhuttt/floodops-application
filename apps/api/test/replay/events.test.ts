import { afterEach, describe, expect, it } from "vitest";
import { reset } from "cloudflare:test";
import { parseSchema } from "@floodops/contracts";
import { command, create, headers, invite, request, requestKey, rpc } from "../capabilities/helpers";
afterEach(reset);
describe("role-projected replay and actual SSE", () => {
  it("advances cursors across hidden events and preserves JSON visibility", async () => {
    const owner = await create(); const driver = await invite(owner, "driver");
    expect((await command(owner, 0, requestKey(), null, "metadata")).status).toBe(200);
    const r = await request(`/sessions/${driver.id}/events?after=0&limit=1`, { headers: headers(driver) });
    const page = parseSchema("EventPageResponse", await r.json()).data!;
    expect(page.events).toHaveLength(0); expect(page.next_sequence).toBe(1);
    const visible = await request(`/sessions/${owner.id}/events?after=0`, { headers: headers(owner) });
    expect(parseSchema("EventPageResponse", await visible.json()).data!.events).toHaveLength(1);
  });
  it("streams the same event IDs and releases a cancelled stream slot", async () => {
    const owner = await create(); await command(owner, 1);
    const r = await request(`/sessions/${owner.id}/events/stream?after=0`, { headers: headers(owner) }); expect(r.status).toBe(200);
    expect(r.headers.get("Content-Type")).toBe("text/event-stream");
    const reader = r.body!.getReader(); const first = await reader.read(); const text = new TextDecoder().decode(first.value);
    expect(text).toContain("id: 1"); expect(text).toContain("event: state_changed"); await reader.cancel();
  });
  it("emits a cursor frame without leaking a hidden-only event", async () => {
    const owner = await create(); const driver = await invite(owner, "driver"); await command(owner, 0, requestKey(), null, "metadata");
    const r = await request(`/sessions/${driver.id}/events/stream?after=0`, { headers: headers(driver) });
    const reader = r.body!.getReader(); const text = new TextDecoder().decode((await reader.read()).value);
    expect(text).toContain("event: cursor"); expect(text).not.toContain("proposal_changed"); await reader.cancel();
  });
  it("bounds stream slots and releases a revoked participant slot", async () => {
    const owner = await create(); const driver = await invite(owner, "driver");
    for (let i = 0; i < 5; i++) expect((await rpc(driver, { kind: "stream-open", streamId: `slot${i}`, after: 0 })).status).toBe(200);
    expect((await rpc(driver, { kind: "stream-open", streamId: "extra", after: 0 })).status).toBe(429);
    await request(`/sessions/${owner.id}/participants/${driver.participant}`, { method: "DELETE", headers: headers(owner, { "Idempotency-Key": requestKey() }) });
    expect((await rpc(driver, { kind: "stream-poll", streamId: "slot0", after: 0 })).status).toBe(401);
    expect((await rpc(driver, { kind: "stream-close", streamId: "slot0" })).status).toBe(200);
    expect((await rpc(owner, { kind: "stream-open", streamId: "replacement", after: 0 })).status).toBe(200);
  });
  it("rejects token query parameters and unauthorized full-state views", async () => {
    const owner = await create(); const contributor = await invite(owner, "contributor");
    expect((await request(`/sessions/${owner.id}/events?after=0&token=fake`, { headers: headers(owner) })).status).toBe(422);
    expect((await request(`/sessions/${owner.id}/snapshot`, { headers: headers(contributor) })).status).toBe(403);
  });
});
