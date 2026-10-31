import { expect } from "vitest";
import { env, runInDurableObject, SELF } from "cloudflare:test";
import { parseSchema } from "@floodops/contracts";
import type { PlatformBindings, Snapshot } from "../../apps/api/src/shared/index";
import { scenarioReference } from "../../apps/api/src/index";
const key = () => crypto.randomUUID();
const request = (path: string, init?: RequestInit) => SELF.fetch("https://floodops.test/api/v1" + path, init);
export async function contributor() {
  const created = await request("/sessions", { method: "POST", headers: { "Content-Type": "application/json", "Idempotency-Key": key(), "X-Client-Request-Scope": key(), "CF-Connecting-IP": "192.0.2.40" }, body: JSON.stringify({ scenario_id: scenarioReference.scenario_id, scenario_version: scenarioReference.scenario_version, client_type: "native" }) });
  expect(created.status).toBe(201);
  const owner = parseSchema("SessionCreatedResponse", await created.json()).data;
  const sid = owner.session.session_id;
  const invited = await request("/sessions/" + sid + "/invitations", { method: "POST", headers: { Authorization: "Bearer " + owner.credential.access_token, "Content-Type": "application/json", "Idempotency-Key": key() }, body: JSON.stringify({ role: "contributor", bound_entity_id: "contributor_functional1", expires_in_seconds: 900 }) });
  expect(invited.status).toBe(201);
  const invite = parseSchema("InviteResponse", await invited.json()).data;
  const claimed = await request("/session-claims", { method: "POST", headers: { "Content-Type": "application/json", "Idempotency-Key": key() }, body: JSON.stringify({ session_id: sid, claim_token: invite.claim_token, client_type: "native" }) });
  expect(claimed.status).toBe(201);
  const response = parseSchema("SessionCreatedResponse", await claimed.json());
  return { sid, meta: response.meta, generation: response.data.session.generation, token: response.data.credential.access_token! };
}
/** Controlled canonical durable events only; not proof of a business command implementation. */
export async function appendMixedPage(sid: string) {
  const bindings = env as unknown as PlatformBindings;
  return runInDurableObject(bindings.SESSIONS.get(bindings.SESSIONS.idFromName(sid)), (_instance, state) => {
    const row = state.storage.sql.exec<{ value: string }>("SELECT value FROM documents WHERE collection='runtime' AND id='snapshot'").one();
    const snapshot = JSON.parse(row.value) as Snapshot;
    const initial = snapshot.meta.event_sequence;
    for (const [type, roles] of [["state_changed", ["dispatcher"]], ["state_changed", ["contributor"]]] as const) {
      const event = parseSchema("Event", { event_id: "event_" + crypto.randomUUID(), event_sequence: ++snapshot.meta.event_sequence,
        session_id: sid, generation: snapshot.meta.generation, revision: snapshot.meta.revision, sim_minute: snapshot.meta.sim_minute,
        type, actor: "system", resource_ids: [], reason_code: null, replacement_session_id: null, created_at: new Date().toISOString() });
      state.storage.sql.exec("INSERT INTO events(sequence,value,audience) VALUES(?,?,?)", event.event_sequence, JSON.stringify(event), JSON.stringify({ roles, participants: [] }));
    }
    state.storage.sql.exec("UPDATE documents SET value=? WHERE collection='runtime' AND id='snapshot'", JSON.stringify(snapshot));
    return { hidden: initial + 1, visible: initial + 2 };
  });
}
