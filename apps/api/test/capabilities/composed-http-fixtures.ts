import { createExecutionContext, runInDurableObject, waitOnExecutionContext } from "cloudflare:test";
import { parseSchema } from "@floodops/contracts";
import composedApp, { scenarioReference } from "../../src/index";
import type { createApp } from "../../src/app";
import { bindings, requestKey, type Fixture } from "./helpers";
const streamContexts = new WeakMap<Response, ReturnType<typeof createExecutionContext>>();
export const webOrigin = "https://floodops.test";
export async function composed(path: string, init: RequestInit = {}, app: ReturnType<typeof createApp> = composedApp): Promise<Response> {
  const context = createExecutionContext();
  const response = await app.fetch(new Request(`${webOrigin}/api/v1${path}`, init), bindings, context);
  if (response.headers.get("Content-Type") !== "text/event-stream") await waitOnExecutionContext(context);
  else streamContexts.set(response, context);
  return response;
}
export function memberHeaders(f: Fixture, extras: Record<string, string> = {}): Record<string, string> {
  return { ...(f.cookie ? { Cookie: f.cookie, Origin: webOrigin, "X-CSRF-Token": f.csrf! } : { Authorization: `Bearer ${f.token}` }), ...extras };
}
export async function createComposed(clientType: "web" | "native" = "native", ip = "192.0.2.2"): Promise<Fixture> {
  const response = await composed("/sessions", { method: "POST", headers: { "Content-Type": "application/json", "Idempotency-Key": requestKey(),
    "X-Client-Request-Scope": requestKey(), "CF-Connecting-IP": ip, ...(clientType === "web" ? { Origin: webOrigin } : {}) },
    body: JSON.stringify({ scenario_id: scenarioReference.scenario_id, scenario_version: scenarioReference.scenario_version, client_type: clientType }) });
  if (response.status !== 201) throw new Error(`Composed create failed ${response.status}`);
  const data = parseSchema("SessionCreatedResponse", await response.json()).data!;
  const cookie = response.headers.get("Set-Cookie")?.split(";")[0] ?? null;
  return { id: data.session.session_id, participant: data.participant.participant_id,
    token: data.credential.access_token ?? cookie?.split("=")[1] ?? "", csrf: data.credential.csrf_token, cookie, etag: response.headers.get("ETag")! };
}
export async function emitComposedEvent(owner: Fixture): Promise<void> {
  const invite = await composed(`/sessions/${owner.id}/invitations`, { method: "POST", headers: memberHeaders(owner, { "Content-Type": "application/json", "Idempotency-Key": requestKey() }),
    body: JSON.stringify({ role: "viewer", bound_entity_id: null, expires_in_seconds: 900 }) });
  if (invite.status !== 201) throw new Error(`Composed invite failed ${invite.status}`);
  const invitation = parseSchema("InviteResponse", await invite.json()).data!;
  const claim = await composed("/session-claims", { method: "POST", headers: { "Content-Type": "application/json", "Idempotency-Key": requestKey() },
    body: JSON.stringify({ session_id: owner.id, claim_token: invitation.claim_token, client_type: "native" }) });
  if (claim.status !== 201) throw new Error(`Composed claim failed ${claim.status}`);
  const participant = parseSchema("SessionCreatedResponse", await claim.json()).data!.participant;
  const revoked = await composed(`/sessions/${owner.id}/participants/${participant.participant_id}`, { method: "DELETE", headers: memberHeaders(owner, { "Idempotency-Key": requestKey() }) });
  if (revoked.status !== 200) throw new Error(`Composed revoke failed ${revoked.status}`);
}

export async function finishStream(response: Response): Promise<void> {
  const context = streamContexts.get(response);
  if (context) { await waitOnExecutionContext(context); streamContexts.delete(response); }
}

export async function activeStreamCount(owner: Fixture): Promise<number> {
  return runInDurableObject(bindings.SESSIONS.get(bindings.SESSIONS.idFromName(owner.id)), (_instance, state) =>
    state.storage.sql.exec<{ count: number }>("SELECT COUNT(*) AS count FROM documents WHERE collection='streams'").one().count);
}
