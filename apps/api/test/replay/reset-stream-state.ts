import { runInDurableObject } from "cloudflare:test";
import { parseSchema, type Event } from "@floodops/contracts";
import { bindings, type Fixture } from "../capabilities/helpers";
export async function storedReset(owner: Fixture): Promise<Event> {
  return runInDurableObject(bindings.SESSIONS.get(bindings.SESSIONS.idFromName(owner.id)), (_instance, state) =>
    parseSchema("Event", JSON.parse(state.storage.sql.exec<{ value: string }>("SELECT value FROM events WHERE json_extract(value,'$.type')='session_reset' ORDER BY sequence DESC LIMIT 1").one().value)));
}
export async function firstStreamId(owner: Fixture): Promise<string> {
  return runInDurableObject(bindings.SESSIONS.get(bindings.SESSIONS.idFromName(owner.id)), (_instance, state) =>
    state.storage.sql.exec<{ id: string }>("SELECT id FROM documents WHERE collection='streams' ORDER BY id LIMIT 1").one().id);
}
export async function alterParticipant(owner: Fixture, participantId: string, field: "revoked" | "expired" | "permission"): Promise<void> {
  await runInDurableObject(bindings.SESSIONS.get(bindings.SESSIONS.idFromName(owner.id)), (_instance, state) => {
    const row = state.storage.sql.exec<{ id: string; value: string }>("SELECT id,value FROM documents WHERE collection='participants' AND json_extract(value,'$.participant.participant_id')=?", participantId).one();
    const record = JSON.parse(row.value);
    if (field === "revoked") record.revoked = true;
    if (field === "expired") record.participant.expires_at = new Date(Date.now() - 1).toISOString();
    if (field === "permission") record.participant.permissions = record.participant.permissions.filter((p: string) => p !== "session:read");
    state.storage.sql.exec("UPDATE documents SET value=? WHERE collection='participants' AND id=?", JSON.stringify(record), row.id);
  });
}
export async function expireRegistration(owner: Fixture, id: string): Promise<void> {
  await runInDurableObject(bindings.SESSIONS.get(bindings.SESSIONS.idFromName(owner.id)), (_instance, state) => {
    const row = state.storage.sql.exec<{ value: string }>("SELECT value FROM documents WHERE collection='streams' AND id=?", id).one();
    const stream = JSON.parse(row.value); stream.expires = Date.now() - 1;
    state.storage.sql.exec("UPDATE documents SET value=? WHERE collection='streams' AND id=?", JSON.stringify(stream), id);
  });
}
export async function streamBound(owner: Fixture): Promise<number | null> {
  return runInDurableObject(bindings.SESSIONS.get(bindings.SESSIONS.idFromName(owner.id)), (_instance, state) => state.storage.getAlarm());
}
export async function storedIdleExpiry(owner: Fixture): Promise<string> {
  return runInDurableObject(bindings.SESSIONS.get(bindings.SESSIONS.idFromName(owner.id)), (_instance, state) =>
    JSON.parse(state.storage.sql.exec<{ value: string }>("SELECT value FROM documents WHERE collection='runtime' AND id='snapshot'").one().value).meta.expires_at);
}
