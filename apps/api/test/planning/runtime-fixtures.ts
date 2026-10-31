import { env, SELF, runInDurableObject } from "cloudflare:test";
import { formatEtag, parseSchema } from "@floodops/contracts";
import type { Plan, SessionCreated } from "@floodops/contracts";
import type { Call, PlatformBindings, Reply, Snapshot } from "../../src/shared/index";
import { simulationPersistence } from "../../src/index";
export interface Fixture { id: string; token: string; etag: string; missing: boolean }
export const key = () => crypto.randomUUID();
export const request = (path: string, init?: RequestInit, missing = false) => SELF.fetch("https://floodops.test" + (missing ? "/missing" : "") + "/api/v1" + path, init);
export const auth = (f: Fixture, extra: Record<string, string> = {}) => ({ Authorization: "Bearer " + f.token, ...extra });
export async function create(missing = false): Promise<Fixture> {
  const response = await request("/sessions", { method: "POST", headers: { "Content-Type": "application/json",
    "Idempotency-Key": key(), "X-Client-Request-Scope": key() },
    body: JSON.stringify({ scenario_id: "scn_functional1", scenario_version: "2", client_type: "native" }) }, missing);
  if (response.status !== 201) throw new Error("Create failed:" + response.status);
  const result = parseSchema("SessionCreatedResponse", await response.json()).data!;
  if (result.session.scenario_version !== "2") throw new Error("Expected frozen functional-v2.");
  return { id: result.session.session_id, token: result.credential.access_token!, etag: formatEtag(result.session), missing };
}
export async function post(f: Fixture, suffix: string, body: unknown, id = key(), etag: string | null = f.etag) {
  return request("/sessions/" + f.id + suffix, { method: "POST", headers: auth(f, { "Content-Type": "application/json",
    "Idempotency-Key": id, ...(etag ? { "If-Match": etag } : {}) }), body: JSON.stringify(body) }, f.missing);
}
export async function get(f: Fixture, suffix: string) {
  return request("/sessions/" + f.id + suffix, { headers: auth(f) }, f.missing);
}
export async function plan(f: Fixture): Promise<Plan> {
  const response = await post(f, "/planning-jobs", { cause: "manual", cause_entity_ids: [] });
  if (response.status !== 202) throw new Error("Planning start failed:" + response.status + " " + await response.text());
  const job = parseSchema("PlanningJobResponse", await response.json()).data!;
  for (let i = 0; i < 60; i++) {
    const result = parseSchema("PlanningJobResponse", await (await get(f, "/planning-jobs/" + job.job_id)).json()).data!;
    if (result.status === "failed") throw new Error("Job failed:" + result.error_code);
    if (result.plan_id) return parseSchema("PlanResponse", await (await get(f, "/plans/" + result.plan_id)).json()).data!;
  }
  throw new Error("Planning did not complete");
}
export function stub(f: Fixture) {
  const bindings = env as unknown as PlatformBindings & { MISSING_SESSIONS: PlatformBindings["SESSIONS"] };
  const namespace = f.missing ? bindings.MISSING_SESSIONS : bindings.SESSIONS;
  return namespace.get(namespace.idFromName(f.id));
}
export async function rpc(f: Fixture, fields: Partial<Call>): Promise<Reply> {
  return JSON.parse(await stub(f).dispatch(JSON.stringify({ kind: "identity", sessionId: f.id, requestId: key(),
    auth: { token: f.token, transport: "bearer", origin: null, csrf: null }, ...fields }))) as Reply;
}
export async function snapshot(f: Fixture): Promise<Snapshot> {
  return runInDurableObject(stub(f), (_instance, state) => JSON.parse(state.storage.sql.exec<{ value: string }>(
    "SELECT value FROM documents WHERE collection='runtime' AND id='snapshot'").one().value) as Snapshot);
}
export async function mutate(f: Fixture, change: (value: Snapshot) => void): Promise<void> {
  await runInDurableObject(stub(f), (_instance, state) => {
    const value = JSON.parse(state.storage.sql.exec<{ value: string }>("SELECT value FROM documents WHERE collection='runtime' AND id='snapshot'").one().value) as Snapshot;
    change(value); state.storage.sql.exec("UPDATE documents SET value=? WHERE collection='runtime' AND id='snapshot'", JSON.stringify(value));
  });
}
export const run = async (f: Fixture) => simulationPersistence.read((await snapshot(f)).values);
export async function invite(f: Fixture, role: "driver" | "contributor"): Promise<Fixture> {
  const response = await post(f, "/invitations", { role, bound_entity_id: role === "driver" ? "drv_moto01" : "contributor_functional1", expires_in_seconds: 900 });
  const invitation = parseSchema("InviteResponse", await response.json()).data!;
  const joined = await request("/session-claims", { method: "POST", headers: { "Content-Type": "application/json", "Idempotency-Key": key() },
    body: JSON.stringify({ session_id: f.id, claim_token: invitation.claim_token, client_type: "native" }) });
  const result: SessionCreated = parseSchema("SessionCreatedResponse", await joined.json()).data!;
  return { id: f.id, token: result.credential.access_token!, etag: formatEtag(result.session), missing: false };
}
