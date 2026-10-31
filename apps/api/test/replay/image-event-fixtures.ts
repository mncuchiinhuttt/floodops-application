import { runInDurableObject } from "cloudflare:test";
import { parseSchema, type Event, type EventPage, type Role } from "@floodops/contracts";
import { bindings, headers, request, requestKey, type Fixture } from "../capabilities/helpers";
export const fieldRoles = ["contributor", "driver", "viewer"] as const;
export const eventActors: Event["actor"][] = ["system", "model", "dispatcher", "driver", "community", "external"];
export async function emitMisdirected(owner: Fixture, targets: Fixture[], audience: Role[]): Promise<Response> {
  return request(`/sessions/${owner.id}/test-commands/misdirected-image-event`, { method: "POST",
    headers: headers(owner, { "Content-Type": "application/json", "Idempotency-Key": requestKey() }),
    body: JSON.stringify({ audience, participant_ids: targets.map(t => t.participant) }) });
}
export async function page(f: Fixture, after = 0, limit = 50): Promise<EventPage> {
  const r = await request(`/sessions/${f.id}/events?after=${after}&limit=${limit}`, { headers: headers(f) });
  if (r.status !== 200) throw new Error(`Event request failed ${r.status}`);
  return parseSchema("EventPageResponse", await r.json()).data!;
}
export async function legacyEvent(owner: Fixture, target: Fixture, actor: Event["actor"], type: Event["type"] = "image_review_changed", roles: Role[] = []): Promise<void> {
  await runInDurableObject(bindings.SESSIONS.get(bindings.SESSIONS.idFromName(owner.id)), (_instance, state) => {
    const row = state.storage.sql.exec<{ value: string }>("SELECT value FROM documents WHERE collection='runtime' AND id='snapshot'").one();
    const snapshot = JSON.parse(row.value);
    const event = parseSchema("Event", { event_id: `event_${crypto.randomUUID().replaceAll("-", "")}`, event_sequence: ++snapshot.meta.event_sequence,
      session_id: owner.id, generation: snapshot.meta.generation, revision: snapshot.meta.revision, sim_minute: snapshot.meta.sim_minute,
      type, actor, resource_ids: ["report_report01", "imagejob_job0001"], reason_code: null, replacement_session_id: null, created_at: new Date().toISOString() });
    state.storage.transactionSync(() => {
      state.storage.sql.exec("INSERT INTO events(sequence,value,audience) VALUES(?,?,?)", event.event_sequence, JSON.stringify(event), JSON.stringify({ roles, participants: [target.participant] }));
      state.storage.sql.exec("UPDATE documents SET value=? WHERE collection='runtime' AND id='snapshot'", JSON.stringify(snapshot));
    });
  });
}
export async function stream(f: Fixture, after = 0) {
  const response = await request(`/sessions/${f.id}/events/stream?after=${after}`, { headers: headers(f) });
  if (response.status !== 200) throw new Error(`Stream failed ${response.status}`);
  const reader = response.body!.getReader();
  return { reader, async next() { return new TextDecoder().decode((await reader.read()).value); } };
}
export async function storedAudience(owner: Fixture): Promise<{ roles: string[]; participants: string[] }> {
  return runInDurableObject(bindings.SESSIONS.get(bindings.SESSIONS.idFromName(owner.id)), (_instance, state) =>
    JSON.parse(state.storage.sql.exec<{ audience: string }>("SELECT audience FROM events ORDER BY sequence DESC LIMIT 1").one().audience));
}
