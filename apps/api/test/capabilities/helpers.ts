/// <reference types="@cloudflare/vitest-plugin/types" />
import { SELF, env, runInDurableObject } from "cloudflare:test";
import { formatEtag, parseSchema, type SessionCreated } from "@floodops/contracts";
import type { PlatformBindings, Call, Reply, Snapshot } from "../../src/shared/platform-types";
export const bindings = env as unknown as PlatformBindings;
export interface Fixture { id: string; token: string; csrf: string | null; cookie: string | null; etag: string; participant: string }
export const requestKey = (): string => crypto.randomUUID();
export async function request(path: string, init: RequestInit = {}): Promise<Response> { return SELF.fetch(`https://floodops.test/api/v1${path}`, init); }
export function headers(f: Fixture, extras: Record<string, string> = {}): Record<string, string> {
  return { ...(f.cookie ? { Cookie: f.cookie, Origin: "https://floodops.test", "X-CSRF-Token": f.csrf! } : { Authorization: `Bearer ${f.token}` }), ...extras };
}
export async function create(clientType: "native" | "web" = "native"): Promise<Fixture> {
  const response = await request("/sessions", { method: "POST", headers: { "Content-Type": "application/json", "Idempotency-Key": requestKey(),
    "X-Client-Request-Scope": requestKey(), ...(clientType === "web" ? { Origin: "https://floodops.test" } : {}) },
    body: JSON.stringify({ scenario_id: "scenario_platform01", scenario_version: "1", client_type: clientType }) });
  if (response.status !== 201) throw new Error(`Create failed ${response.status}`);
  const parsed = parseSchema("SessionCreatedResponse", await response.json());
  return fixture(parsed.data!, response.headers.get("Set-Cookie"));
}
export function fixture(data: SessionCreated, cookie: string | null): Fixture {
  return { id: data.session.session_id, token: data.credential.access_token ?? cookie?.split(";")[0]?.split("=")[1] ?? "",
    csrf: data.credential.csrf_token, cookie: cookie?.split(";")[0] ?? null, etag: formatEtag(data.session), participant: data.participant.participant_id };
}
export async function invite(f: Fixture, role: "dispatcher" | "driver" | "contributor" | "viewer", type: "web" | "native" = "native"): Promise<Fixture> {
  const r = await request(`/sessions/${f.id}/invitations`, { method: "POST", headers: headers(f, { "Content-Type": "application/json", "Idempotency-Key": requestKey() }),
    body: JSON.stringify({ role, bound_entity_id: role === "driver" ? "driver_driver01" : role === "contributor" ? "contributor_person01" : null, expires_in_seconds: 900 }) });
  if (r.status !== 201) throw new Error(`Invite failed ${r.status}`);
  const invitation = parseSchema("InviteResponse", await r.json()).data!;
  const claim = await request("/session-claims", { method: "POST", headers: { "Content-Type": "application/json", "Idempotency-Key": requestKey(), ...(type === "web" ? { Origin: "https://floodops.test" } : {}) },
    body: JSON.stringify({ session_id: f.id, claim_token: invitation.claim_token, client_type: type }) });
  if (claim.status !== 201) throw new Error(`Claim failed ${claim.status}`);
  return fixture(parseSchema("SessionCreatedResponse", await claim.json()).data!, claim.headers.get("Set-Cookie"));
}
export async function command(f: Fixture, amount: number, key = requestKey(), etag: string | null = f.etag, name = "counter"): Promise<Response> {
  return request(`/sessions/${f.id}/test-commands/${name}`, { method: "POST", headers: headers(f, { "Content-Type": "application/json", "Idempotency-Key": key, ...(etag ? { "If-Match": etag } : {}) }), body: JSON.stringify({ amount }) });
}
export async function rpc(f: Fixture, fields: Partial<Call>): Promise<Reply> {
  return JSON.parse(await bindings.SESSIONS.get(bindings.SESSIONS.idFromName(f.id)).dispatch(JSON.stringify({ kind: "identity", sessionId: f.id,
    requestId: requestKey(), auth: { token: f.token, transport: f.cookie ? "cookie" : "bearer", origin: f.cookie ? "https://floodops.test" : null, csrf: f.csrf }, ...fields }))) as Reply;
}
export async function mutateSnapshot(f: Fixture, update: (snapshot: Snapshot) => void): Promise<void> {
  await runInDurableObject(bindings.SESSIONS.get(bindings.SESSIONS.idFromName(f.id)), (_instance, state) => {
    const row = state.storage.sql.exec<{ value: string }>("SELECT value FROM documents WHERE collection='runtime' AND id='snapshot'").one();
    const snapshot = JSON.parse(row.value); update(snapshot);
    state.storage.sql.exec("UPDATE documents SET value=? WHERE collection='runtime' AND id='snapshot'", JSON.stringify(snapshot));
  });
}
