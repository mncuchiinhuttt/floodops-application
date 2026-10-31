import { env, SELF, runInDurableObject } from "cloudflare:test";
import { formatEtag, parseSchema } from "@floodops/contracts";
import type { SessionCreated } from "@floodops/contracts";
import type { Call, PlatformBindings, Reply, Snapshot } from "../../src/shared/index";
import type { AdvanceReservation } from "../../src/features/simulation/index";
import { ADVANCE_START, ADVANCE_CHUNK } from "../../src/features/simulation/index";
import { simulationPersistence } from "../../src/index";

export const bindings = env as unknown as PlatformBindings;
export const key = () => crypto.randomUUID();
export interface Fixture { id: string; token: string; etag: string; created: SessionCreated }
export const request = (path: string, init?: RequestInit) => SELF.fetch("https://floodops.test/api/v1" + path, init);
export const auth = (f: Fixture, extra: Record<string, string> = {}) => ({ Authorization: "Bearer " + f.token, ...extra });
export async function create(): Promise<Fixture> {
  const response = await request("/sessions", { method: "POST", headers: { "Content-Type": "application/json",
    "Idempotency-Key": key(), "X-Client-Request-Scope": key() },
    body: JSON.stringify({ scenario_id: "scn_functional1", scenario_version: "1", client_type: "native" }) });
  if (response.status !== 201) throw new Error(`Create failed: ${response.status}`);
  return fixture(parseSchema("SessionCreatedResponse", await response.json()).data!);
}
export function fixture(created: SessionCreated): Fixture {
  return { id: created.session.session_id, token: created.credential.access_token!, etag: formatEtag(created.session), created };
}
export async function rpc(f: Fixture, fields: Partial<Call> = {}): Promise<Reply> {
  return JSON.parse(await stub(f).dispatch(JSON.stringify({ kind: "identity", sessionId: f.id, requestId: key(),
    auth: { token: f.token, transport: "bearer", origin: null, csrf: null }, ...fields }))) as Reply;
}
export const stub = (f: Fixture) => bindings.SESSIONS.get(bindings.SESSIONS.idFromName(f.id));
export async function snapshot(f: Fixture): Promise<Snapshot> {
  return runInDurableObject(stub(f), (_instance, state) => JSON.parse(state.storage.sql.exec<{ value: string }>(
    "SELECT value FROM documents WHERE collection='runtime' AND id='snapshot'").one().value) as Snapshot);
}
export async function mutate(f: Fixture, change: (snapshot: Snapshot) => void): Promise<void> {
  await runInDurableObject(stub(f), (_instance, state) => {
    const value = JSON.parse(state.storage.sql.exec<{ value: string }>("SELECT value FROM documents WHERE collection='runtime' AND id='snapshot'").one().value) as Snapshot;
    change(value); state.storage.sql.exec("UPDATE documents SET value=? WHERE collection='runtime' AND id='snapshot'", JSON.stringify(value));
  });
}
export async function start(f: Fixture, target = 20, idempotencyKey = key(), etag = f.etag): Promise<Reply> {
  return rpc(f, { kind: "command", name: ADVANCE_START, key: idempotencyKey, ifMatch: etag,
    path: `/sessions/${f.id}/simulation/advances`, payload: { target_sim_minute: target } });
}
export async function chunk(f: Fixture, reservation: AdvanceReservation, etag: string, index: number): Promise<Reply> {
  const { jobId, leaseId, nonce } = reservation.execution;
  return rpc(f, { kind: "command", name: ADVANCE_CHUNK, key: `${jobId}_test_${index}`, ifMatch: etag,
    payload: { job_id: jobId, lease_id: leaseId, nonce }, fence: { lease_id: leaseId, nonce }, expectedPointers: { active_advance_job_id: jobId } });
}
export const etagOf = (reply: Reply) => formatEtag(reply.body.meta as { session_id: string; generation: number; revision: number });
export async function finish(f: Fixture, reserved: Reply): Promise<Reply> {
  const reservation = reserved.body.data as AdvanceReservation;
  let reply = reserved;
  for (let index = 0; index < 100; index++) {
    reply = await chunk(f, reservation, etagOf(reply), index);
    if (reply.status !== 200 || parseSchema("AdvanceJob", reply.body.data).status === "completed") return reply;
  }
  throw new Error("Fixture boundary budget exhausted");
}
export const persistedRun = async (f: Fixture) => simulationPersistence.read((await snapshot(f)).values);
export async function invite(f: Fixture, role: "driver" | "contributor" | "viewer"): Promise<Fixture> {
  const response = await request(`/sessions/${f.id}/invitations`, { method: "POST", headers: auth(f, { "Content-Type": "application/json", "Idempotency-Key": key() }),
    body: JSON.stringify({ role, bound_entity_id: role === "driver" ? "drv_moto01" : role === "contributor" ? "contributor_functional1" : null, expires_in_seconds: 900 }) });
  const claim = parseSchema("InviteResponse", await response.json()).data!;
  const joined = await request("/session-claims", { method: "POST", headers: { "Content-Type": "application/json", "Idempotency-Key": key() },
    body: JSON.stringify({ session_id: f.id, claim_token: claim.claim_token, client_type: "native" }) });
  return fixture(parseSchema("SessionCreatedResponse", await joined.json()).data!);
}
