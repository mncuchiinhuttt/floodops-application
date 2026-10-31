import { runInDurableObject } from "cloudflare:test";
import { parseSchema } from "@floodops/contracts";
import type { Condition, Report, SubmitReportInput } from "@floodops/contracts";
import { sourceState } from "@floodops/domain/reporting";
import { createSessionRuntimeClient } from "../../src/shared/index";
import type { SessionRequestContext, Snapshot, TransitionContext } from "../../src/shared/index";
import type { ReviewStore } from "../../src/features/reports/review/index";
import { bindings, call, headers, key } from "./helpers";
import type { Member } from "./helpers";
export { bindings, call, headers, join, key, ready } from "./helpers";
export async function createV2(): Promise<Member> {
  const response = await call("/sessions", { method: "POST", headers: { "Content-Type": "application/json", "Idempotency-Key": key(),
    "X-Client-Request-Scope": key(), "CF-Connecting-IP": "192.0.2.29" },
    body: JSON.stringify({ scenario_id: "scn_functional1", scenario_version: "2", client_type: "native" }) });
  if (response.status !== 201) throw new Error(`Version2 create failed ${response.status}`);
  const data = parseSchema("SessionCreatedResponse", await response.json()).data!;
  return { id: data.session.session_id, participant: data.participant.participant_id, token: data.credential.access_token!,
    cookie: null, csrf: null, etag: response.headers.get("ETag")! };
}
export async function current(member: Member): Promise<Member> {
  const response = await call(`/sessions/${member.id}/identity`, { headers: headers(member) });
  if (response.status !== 200) throw new Error(`Identity failed ${response.status}`);
  return { ...member, etag: response.headers.get("ETag")! };
}
export function sessionContext(member: Member): SessionRequestContext {
  return { sessionId: member.id, requestId: `request_${key()}`, auth: { token: member.token,
    transport: member.cookie ? "cookie" : "bearer", origin: member.cookie ? "https://floodops.test" : null, csrf: member.csrf } };
}
export async function snapshot(member: Member): Promise<Snapshot> {
  return runInDurableObject(bindings.SESSIONS.get(bindings.SESSIONS.idFromName(member.id)), (_instance, state) =>
    JSON.parse(state.storage.sql.exec<{ value: string }>("SELECT value FROM documents WHERE collection='runtime' AND id='snapshot'").one().value) as Snapshot);
}
export const sources = (value: Snapshot) => sourceState(value.values);
export const rewards = (value: Snapshot) => value.values.reviewRewards as ReviewStore | undefined;
export async function transitionContext(member: Member, value: Snapshot): Promise<TransitionContext> {
  const identity = parseSchema("IdentityResponse", await (await call(`/sessions/${member.id}/identity`, { headers: headers(member) })).json()).data!;
  return { snapshot: value, actor: { participant: identity.participant }, now: Date.now() };
}
export async function submit(member: Member, input: SubmitReportInput): Promise<Report> {
  const fresh = await current(member);
  const response = await call(`/sessions/${member.id}/reports`, { method: "POST", headers: headers(member, {
    "Content-Type": "application/json", "Idempotency-Key": key(), "If-Match": fresh.etag }), body: JSON.stringify(input) });
  if (response.status !== 201) throw new Error(`Actual report submit failed ${response.status}: ${await response.text()}`);
  return parseSchema("ReportResponse", await response.json()).data!;
}
export function citizen(mediaId: string): SubmitReportInput {
  return { kind: "citizen", media_id: mediaId, fixture_photo_id: null, segment_id: "seg_edge27", coordinate: [106.701, 10.7705],
    captured_at: "2026-10-31T00:00:00Z", captured_sim_minute: 0, vehicle_types: ["motorbike"], description: "Original synthetic image report" };
}
export async function accept(member: Member, reportId: string, condition: Condition = "normal", requestKey = key(), etag?: string): Promise<Response> {
  const expected = etag ?? (await current(member)).etag;
  return call(`/sessions/${member.id}/reports/${reportId}/reviews`, { method: "POST", headers: headers(member, {
    "Content-Type": "application/json", "Idempotency-Key": requestKey, "If-Match": expected }), body: JSON.stringify({ decision: "accept",
    reason: "Dispatcher checked the synthetic evidence", mapped_segment_id: null, vehicle_types: [], condition }) });
}
export async function clock(member: Member, minute: number): Promise<Response> {
  return call(`/sessions/${member.id}/test-review-clock`, { method: "POST", headers: headers(member, {
    "Content-Type": "application/json", "Idempotency-Key": key(), "If-Match": (await current(member)).etag }), body: JSON.stringify({ to_minute: minute }) });
}
export async function resetSession(member: Member) {
  return call(`/sessions/${member.id}/resets`, { method: "POST", headers: headers(member, {
    "Content-Type": "application/json", "Idempotency-Key": key(), "If-Match": (await current(member)).etag }),
    body: JSON.stringify({ confirm: true, client_type: "native" }) });
}
export const client = () => createSessionRuntimeClient(bindings);
