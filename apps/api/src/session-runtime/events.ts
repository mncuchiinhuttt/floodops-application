import { parseSchema, type Event, type EventPage } from "@floodops/contracts";
import { randomId } from "../shared/crypto";
import { fail } from "../shared/platform-error";
import type { EventInput, Snapshot, StoredParticipant } from "../shared/platform-types";
import { Store } from "./store";
interface Audience { roles: string[]; participants: string[] }
export function appendEvents(store: Store, snapshot: Snapshot, inputs: EventInput[], now: number, actor: Event["actor"] = "system"): void {
  for (const input of inputs) {
    const event = parseSchema("Event", { event_id: randomId("event"), event_sequence: ++snapshot.meta.event_sequence,
      session_id: snapshot.meta.session_id, generation: snapshot.meta.generation, revision: snapshot.meta.revision, sim_minute: snapshot.meta.sim_minute,
      type: input.type, actor, resource_ids: input.resource_ids ?? [], reason_code: input.reason_code ?? null,
      replacement_session_id: input.replacement_session_id ?? null, created_at: new Date(now).toISOString() });
    const roles = input.type === "image_review_changed" ? ["dispatcher"] : input.audience ?? ["dispatcher"];
    store.storage.sql.exec("INSERT INTO events(sequence,value,audience) VALUES(?,?,?)", event.event_sequence, JSON.stringify(event), JSON.stringify({ roles, participants: input.participantIds ?? [] }));
  }
  const floor = Math.max(0, snapshot.meta.event_sequence - 10000);
  store.storage.sql.exec("DELETE FROM events WHERE sequence<=?", floor);
  store.put("runtime", "event_floor", floor);
  store.save(snapshot);
}
export function eventPage(store: Store, snapshot: Snapshot, participant: StoredParticipant, after: number, limit: number): EventPage {
  if (!Number.isSafeInteger(after) || after < 0 || after > snapshot.meta.event_sequence || !Number.isInteger(limit) || limit < 1 || limit > 500) fail(422, "INVALID_SCHEMA");
  if (after < (store.get<number>("runtime", "event_floor") ?? 0)) fail(410, "EVENT_CURSOR_EXPIRED", snapshot);
  const rows = store.storage.sql.exec<{ sequence: number; value: string; audience: string }>("SELECT sequence,value,audience FROM events WHERE sequence>? ORDER BY sequence LIMIT ?", after, limit).toArray();
  const events = rows.filter(row => {
    const a = JSON.parse(row.audience) as Audience;
    return a.roles.includes(participant.participant.role) || a.participants.includes(participant.participant.participant_id);
  }).map(row => JSON.parse(row.value) as Event);
  const next = rows.at(-1)?.sequence ?? after;
  return { events, next_sequence: next, has_more: next < snapshot.meta.event_sequence };
}
