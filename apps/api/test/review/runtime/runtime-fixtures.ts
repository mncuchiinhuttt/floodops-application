import { env, SELF, runInDurableObject } from "cloudflare:test";
import { formatEtag, parseSchema } from "@floodops/contracts";
import type { Condition, SessionCreated } from "@floodops/contracts";
import type { Call, PlatformBindings, Reply, Snapshot } from "../../../src/shared/index";
import type { ReviewStore } from "../../../src/features/reports/review/index";
import { prepareSourceReviewImage } from "../../../src/features/reports/index";
import { imageContextKey, prepareImageReviewBinding } from "../../../src/features/reports/review/index";
import { contributorA, contributorB, fixtureSource, imageConfig, reportA, reportB } from "./source-fixture";

export const bindings = env as unknown as PlatformBindings;
export const key = () => crypto.randomUUID();
export interface Fixture { id: string; token: string; etag: string; created: SessionCreated }
export const request = (path: string, init?: RequestInit) => SELF.fetch("https://floodops.test/api/v1" + path, init);
export const auth = (f: Fixture, extra: Record<string, string> = {}) => ({ Authorization: "Bearer " + f.token, ...extra });
export function fixture(created: SessionCreated): Fixture {
  return { id: created.session.session_id, token: created.credential.access_token!, etag: formatEtag(created.session), created };
}
export async function create(): Promise<Fixture> {
  const response = await request("/sessions", { method: "POST", headers: { "Content-Type": "application/json",
    "Idempotency-Key": key(), "X-Client-Request-Scope": key() },
    body: JSON.stringify({ scenario_id: "scn_functional1", scenario_version: "2", client_type: "native" }) });
  if (response.status !== 201) throw new Error(`Create failed: ${response.status} ${await response.text()}`);
  const owner = fixture(parseSchema("SessionCreatedResponse", await response.json()).data!);
  for (const reportId of [reportA, reportB]) await prepareSourceReviewImage(bindings,
    { config: imageConfig, prepare: prepareImageReviewBinding, contextKey: imageContextKey },
    { sessionId: owner.id, requestId: key(), auth: { token: owner.token, transport: "bearer", origin: null, csrf: null } }, reportId);
  return owner;
}
export const stub = (f: Fixture) => bindings.SESSIONS.get(bindings.SESSIONS.idFromName(f.id));
export async function rpc(f: Fixture, fields: Partial<Call> = {}): Promise<Reply> {
  return JSON.parse(await stub(f).dispatch(JSON.stringify({ kind: "identity", sessionId: f.id, requestId: key(),
    auth: { token: f.token, transport: "bearer", origin: null, csrf: null }, ...fields }))) as Reply;
}
export async function snapshot(f: Fixture): Promise<Snapshot> {
  return runInDurableObject(stub(f), (_instance, state) => JSON.parse(state.storage.sql.exec<{ value: string }>(
    "SELECT value FROM documents WHERE collection='runtime' AND id='snapshot'").one().value) as Snapshot);
}
export function domain(snapshot: Snapshot) {
  const source = fixtureSource(snapshot);
  return { source, rewards: snapshot.values.reviewRewards as ReviewStore | undefined };
}
export async function review(f: Fixture, reportId = reportA, options: { key?: string; etag?: string; decision?: "accept" | "reject"; condition?: Condition | null } = {}) {
  const response = await request(`/sessions/${f.id}/reports/${reportId}/reviews`, { method: "POST", headers: auth(f,
    { "Content-Type": "application/json", "Idempotency-Key": options.key ?? key(), "If-Match": options.etag ?? f.etag }),
    body: JSON.stringify({ decision: options.decision ?? "accept", reason: "Manual synthetic fixture confirmation", mapped_segment_id: null,
      vehicle_types: [], condition: options.condition !== undefined ? options.condition : options.decision === "reject" ? null : "normal" }) });
  return { response, body: await response.json() };
}
export async function invite(owner: Fixture, role: "driver" | "contributor" | "viewer", entity = contributorA): Promise<Fixture> {
  const response = await request(`/sessions/${owner.id}/invitations`, { method: "POST", headers: auth(owner,
    { "Content-Type": "application/json", "Idempotency-Key": key() }), body: JSON.stringify({ role,
      bound_entity_id: role === "contributor" ? entity : role === "driver" ? "drv_moto01" : null, expires_in_seconds: 900 }) });
  const invitation = parseSchema("InviteResponse", await response.json()).data!;
  const claimed = await request("/session-claims", { method: "POST", headers: { "Content-Type": "application/json", "Idempotency-Key": key() },
    body: JSON.stringify({ session_id: owner.id, claim_token: invitation.claim_token, client_type: "native" }) });
  return fixture(parseSchema("SessionCreatedResponse", await claimed.json()).data!);
}
export async function clock(f: Fixture, minute: number, etag = f.etag) {
  return request(`/sessions/${f.id}/test-clock`, { method: "POST", headers: auth(f,
    { "Content-Type": "application/json", "Idempotency-Key": key(), "If-Match": etag }), body: JSON.stringify({ to_minute: minute }) });
}
export const etagOf = (reply: Reply) => formatEtag(reply.body.meta as { session_id: string; generation: number; revision: number });
export const responseEtag = (value: { body: unknown }) => formatEtag((value.body as Reply["body"]).meta as { session_id: string; generation: number; revision: number });
export async function reserve(f: Fixture, id = reportA, requestKey = key()) {
  const current = domain(await snapshot(f)).source.reports.find(item => item.report_id === id);
  if (current?.status === "pending_review" && !domain(await snapshot(f)).source.images[id]?.prepared && f.created.participant.role === "dispatcher") {
    await prepareSourceReviewImage(bindings, { config: imageConfig, prepare: prepareImageReviewBinding, contextKey: imageContextKey },
      { sessionId: f.id, requestId: key(), auth: { token: f.token, transport: "bearer", origin: null, csrf: null } }, id);
  }
  return rpc(f, { kind: "image-reserve", name: id, key: requestKey,
    path: `/api/v1/sessions/${f.id}/reports/${id}/image-review-jobs`, payload: {} });
}
export async function begin(f: Fixture) {
  const reserved = await reserve(f);
  if (reserved.status !== 202 || !reserved.effect) throw new Error(`Image reserve failed: ${reserved.status}`);
  const job = parseSchema("ImageReviewJob", reserved.body.data), payload = { job_id: job.job_id, lease: reserved.effect.lease };
  const started = await rpc(f, { kind: "image-start", name: reportA, payload });
  if (started.status !== 200) throw new Error(`Image start failed: ${started.status}`);
  return { reserved, job, payload };
}
export async function expireImageDeadline(f: Fixture) {
  await runInDurableObject(stub(f), (_instance, state) => {
    const row = state.storage.sql.exec<{ id: string; value: string }>("SELECT id,value FROM documents WHERE collection='image_jobs'").one();
    const record = JSON.parse(row.value); record.leaseExpires = Date.now() - 1;
    state.storage.sql.exec("UPDATE documents SET value=? WHERE collection='image_jobs' AND id=?", JSON.stringify(record), row.id);
  });
}
export { contributorA, contributorB };
