import { afterEach, describe, expect, it } from "vitest";
import { reset, runDurableObjectAlarm, runInDurableObject } from "cloudflare:test";
import { parseSchema } from "@floodops/contracts";
import { activeStreamCount, composed, createComposed, emitComposedEvent, memberHeaders } from "../capabilities/composed-http-fixtures";
import { bindings, mutateSnapshot, requestKey, rpc } from "../capabilities/helpers";
import { frames, joinComposed, openComposedStream, readUntilClosed, resetComposed, resetEvents } from "./reset-stream-fixtures";
import { alterParticipant, expireRegistration, storedIdleExpiry, storedReset, streamBound } from "./reset-stream-state";
afterEach(reset);
describe("bounded terminal Reset authority", () => {
  it("survives cleanup alarm before delivery, returns only the persisted Reset, and consumes the registration", async () => {
    const owner = await createComposed(); const member = await joinComposed(owner, "contributor"); const id = requestKey();
    expect((await rpc(member, { kind: "stream-open", streamId: id, after: 0 })).status).toBe(200);
    await emitComposedEvent(owner); await emitComposedEvent(owner);
    expect((await resetComposed(owner)).status).toBe(201); const committed = await storedReset(owner); const idle = await storedIdleExpiry(owner);
    await runDurableObjectAlarm(bindings.SESSIONS.get(bindings.SESSIONS.idFromName(owner.id)));
    expect(await activeStreamCount(owner)).toBe(1); expect((await streamBound(owner))! - Date.now()).toBeLessThanOrEqual(60000);
    const polled = await rpc(member, { kind: "stream-poll", streamId: id, after: 0 }); expect(polled.status).toBe(200);
    expect(parseSchema("EventPage", polled.body.data)).toEqual({ events: [committed], next_sequence: committed.event_sequence, has_more: false });
    expect(await storedIdleExpiry(owner)).toBe(idle); expect(await activeStreamCount(owner)).toBe(0);
    expect((await rpc(member, { kind: "stream-poll", streamId: id, after: 0 })).status).toBe(401);
    await runDurableObjectAlarm(bindings.SESSIONS.get(bindings.SESSIONS.idFromName(owner.id)));
    const rows = await runInDurableObject(bindings.SESSIONS.get(bindings.SESSIONS.idFromName(owner.id)), (_instance, state) => state.storage.sql.exec("SELECT sequence FROM events").toArray().length);
    expect(rows).toBe(0);
  });
  it("keeps cleanup retry backoff when a bounded R2 batch leaves pending intents", async () => {
    const owner = await createComposed();
    await runInDurableObject(bindings.SESSIONS.get(bindings.SESSIONS.idFromName(owner.id)), (_instance, state) => {
      for (let i = 0; i < 51; i++) {
        const key = `sessions/${owner.id}/orphan/${i}.png`;
        state.storage.sql.exec("INSERT INTO documents(collection,id,value) VALUES('cleanup',?,?)", key, JSON.stringify({ key }));
      }
    });
    expect((await resetComposed(owner)).status).toBe(201);
    await runDurableObjectAlarm(bindings.SESSIONS.get(bindings.SESSIONS.idFromName(owner.id)));
    const pending = await runInDurableObject(bindings.SESSIONS.get(bindings.SESSIONS.idFromName(owner.id)), (_instance, state) => state.storage.sql.exec<{ count: number }>("SELECT COUNT(*) AS count FROM documents WHERE collection='cleanup'").one().count);
    expect(pending).toBe(1); expect((await streamBound(owner))! - Date.now()).toBeGreaterThan(10000);
  });
  it("puts a canonical cursor before the terminal frame when hidden backlog is skipped", async () => {
    const owner = await createComposed(); const member = await joinComposed(owner, "contributor"); const stream = await openComposedStream(member);
    await emitComposedEvent(owner); await emitComposedEvent(owner); expect((await resetComposed(owner)).status).toBe(201);
    const committed = await storedReset(owner); const text = await readUntilClosed(stream); let cursor = 0; let notices = 0;
    for (const frame of frames(text)) {
      if (frame.event === "cursor") cursor = Math.max(cursor, parseSchema("CursorFrame", frame.data).next_sequence);
      else {
        const event = parseSchema("Event", frame.data); expect(frame.id).toBe(String(event.event_sequence));
        expect(event.event_sequence).toBe(cursor + 1); cursor = event.event_sequence;
        expect(event).toEqual(committed); notices++;
      }
    }
    expect(notices).toBe(1); expect(cursor).toBe(committed.event_sequence);
  });
  it.each(["revoked", "expired", "permission"] as const)("does not disclose terminal data to a credential that became %s", async field => {
    const owner = await createComposed(); const member = await joinComposed(owner, "driver"); const id = requestKey();
    await rpc(member, { kind: "stream-open", streamId: id, after: 0 }); expect((await resetComposed(owner)).status).toBe(201);
    await alterParticipant(owner, member.participant, field);
    const denied = await rpc(member, { kind: "stream-poll", streamId: id, after: 0 }); expect(denied.status).toBe(field === "permission" ? 403 : 401);
    expect(denied.body.data).toBeNull(); expect((denied.body.error as { replacement_session_id: unknown }).replacement_session_id).toBeNull();
  });
  it("rejects wrong owner, nonexistent/expired slot, wrong transport and wrong Origin", async () => {
    const owner = await createComposed(); const member = await joinComposed(owner, "driver"); const id = requestKey();
    await rpc(owner, { kind: "stream-open", streamId: id, after: 0 }); expect((await resetComposed(owner)).status).toBe(201);
    expect((await rpc(member, { kind: "stream-poll", streamId: id, after: 0 })).status).toBe(401);
    expect((await rpc(owner, { kind: "stream-poll", streamId: requestKey(), after: 0 })).status).toBe(401);
    expect((await rpc(owner, { kind: "stream-poll", streamId: id, after: 0, auth: { token: owner.token, transport: "cookie", origin: "https://floodops.test", csrf: null } })).status).toBe(401);
    expect((await rpc(owner, { kind: "stream-poll", streamId: id, after: 0, auth: { token: owner.token, transport: "bearer", origin: "https://other.invalid", csrf: null } })).status).toBe(403);
    await expireRegistration(owner, id); expect((await rpc(owner, { kind: "stream-poll", streamId: id, after: 0 })).status).toBe(401);
  });
  it("does not deliver terminal data past session wall expiry", async () => {
    const owner = await createComposed(); const id = requestKey(); await rpc(owner, { kind: "stream-open", streamId: id, after: 0 });
    expect((await resetComposed(owner)).status).toBe(201); await mutateSnapshot(owner, s => { s.absoluteExpiry = Date.now() - 1; });
    const denied = await rpc(owner, { kind: "stream-poll", streamId: id, after: 0 }); expect(denied.status).toBe(410); expect(denied.body.data).toBeNull();
  });
  it.each(["revoked", "expired"] as const)("closes a real open stream without Reset disclosure after %s", async field => {
    const owner = await createComposed(); const member = await joinComposed(owner, "driver"); const stream = await openComposedStream(member);
    await alterParticipant(owner, member.participant, field); expect((await resetComposed(owner)).status).toBe(201);
    expect(resetEvents(await readUntilClosed(stream))).toHaveLength(0); expect(await activeStreamCount(owner)).toBe(0);
  });
  it("keeps rotated-cookie body-loss recovery narrow while the original stream receives Reset", async () => {
    const owner = await createComposed("web"); const stream = await openComposedStream(owner); const key = requestKey();
    const result = await resetComposed(owner, key); expect(result.status).toBe(201); const cookie = result.headers.get("Set-Cookie")!.split(";")[0]!;
    await result.body!.cancel(); const terminal = resetEvents(await readUntilClosed(stream)); expect(terminal).toHaveLength(1);
    const rotated = { ...owner, token: cookie.split("=")[1]!, cookie, csrf: owner.csrf };
    expect((await composed(`/sessions/${owner.id}/identity`, { headers: memberHeaders(rotated) })).status).toBe(401);
    const recovered = await resetComposed(owner, key, rotated); expect(recovered.status).toBe(201);
    expect(parseSchema("ResetResultResponse", await recovered.json()).data!.replacement.session.session_id).toBe(terminal[0]!.replacement_session_id);
  });
});
