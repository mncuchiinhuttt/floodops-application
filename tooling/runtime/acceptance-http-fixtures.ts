import { afterEach, expect } from "vitest";
import { reset, SELF } from "cloudflare:test";
import { formatEtag, parseSchema, type Plan } from "@floodops/contracts";
import { scenarioReference } from "../../apps/api/src/index";
declare const __MVP_PNG__: number[];


afterEach(reset);
const requestKey = () => crypto.randomUUID();
const endpoint = (path: string, init?: RequestInit) => SELF.fetch("https://floodops.test/api/v1" + path, init);
export interface Owner { id: string; token: string; etag: string }
export const auth = (owner: Owner, extra: Record<string, string> = {}) => ({ Authorization: "Bearer " + owner.token, ...extra });

export async function create(): Promise<Owner> {
  const response = await endpoint("/sessions", { method: "POST", headers: { "Content-Type": "application/json",
    "Idempotency-Key": requestKey(), "X-Client-Request-Scope": requestKey(), "CF-Connecting-IP": "192.0.2.74" },
    body: JSON.stringify({ scenario_id: scenarioReference.scenario_id, scenario_version: scenarioReference.scenario_version, client_type: "native" }) });
  expect(response.status).toBe(201);
  const created = parseSchema("SessionCreatedResponse", await response.json()).data!;
  expect(created.session.scenario_version).toBe("2");
  return { id: created.session.session_id, token: created.credential.access_token!, etag: formatEtag(created.session) };
}

export async function read(owner: Owner, suffix: string): Promise<Response> {
  const response = await endpoint(`/sessions/${owner.id}${suffix}`, { headers: auth(owner) });
  const etag = response.headers.get("ETag"); if (etag) owner.etag = etag;
  return response;
}

export async function mutate(owner: Owner, suffix: string, body: unknown, expectedStatus?: number): Promise<Response> {
  const current = await read(owner, ""); expect(current.status).toBe(200);
  const response = await endpoint(`/sessions/${owner.id}${suffix}`, { method: "POST", headers: auth(owner, {
    "Content-Type": "application/json", "Idempotency-Key": requestKey(), "If-Match": owner.etag }), body: JSON.stringify(body) });
  const etag = response.headers.get("ETag"); if (etag) owner.etag = etag;
  if (expectedStatus !== undefined) expect(response.status).toBe(expectedStatus);
  return response;
}

export async function resetOwner(owner: Owner): Promise<Owner> {
  const response = await mutate(owner, "/resets", { client_type: "native", confirm: true }, 201);
  const replacement = parseSchema("ResetResultResponse", await response.json()).data!.replacement;
  const token = replacement.credential.access_token;
  if (!token) throw new Error("Native Reset did not return a bearer credential");
  return { id: replacement.session.session_id, token, etag: formatEtag(replacement.session) };
}

export async function createPlan(owner: Owner, cause: "manual" | "incident" | "accepted_report", ids: string[] = []) {
  const response = await mutate(owner, "/planning-jobs", { cause, cause_entity_ids: ids }, 202);
  const started = parseSchema("PlanningJobResponse", await response.json()).data!;
  for (let i = 0; i < 120; i++) {
    const jobResponse = await read(owner, `/planning-jobs/${started.job_id}`);
    expect(jobResponse.status).toBe(200);
    const job = parseSchema("PlanningJobResponse", await jobResponse.json()).data!;
    if (job.status === "failed" || job.status === "cancelled") throw new Error(`Planning ended as ${job.status}:${job.error_code}`);
    if (job.plan_id) {
      const planResponse = await read(owner, `/plans/${job.plan_id}`);
      expect(planResponse.status).toBe(200);
      return { job, plan: parseSchema("PlanResponse", await planResponse.json()).data! };
    }
    await new Promise(resolve => setTimeout(resolve, 5));
  }
  throw new Error("Deterministic plan was not published within the test deadline");
}

export async function approvePending(owner: Owner, plan: Plan) {
  const pending = plan.actions.filter(action => action.status === "pending_approval");
  if (pending.length) await mutate(owner, `/plans/${plan.plan_id}/decisions`, {
    action_ids: pending.map(action => action.action_id), decision: "approve", reason: "Explicit dispatcher acceptance in integrated test" }, 200);
  const response = await read(owner, `/plans/${plan.plan_id}`);
  expect(response.status).toBe(200);
  return parseSchema("PlanResponse", await response.json()).data!;
}

export function readyGroups(plan: { actions: { action_id: string; status: string }[]; groups: { group_id: string; action_ids: string[] }[] }): string[] {
  return plan.groups.filter(group => group.action_ids.every(id => plan.actions.some(action => action.action_id === id && action.status === "ready")))
    .map(group => group.group_id);
}

export async function submitAndAccept(owner: Owner, capturedMinute = 0) {
  const configResponse = await read(owner, "/configuration"); expect(configResponse.status).toBe(200);
  const config = parseSchema("ScenarioConfigResponse", await configResponse.json()).data!;
  const capturedAt = new Date(Date.parse(config.t0) + capturedMinute * 60_000).toISOString();
  const reservedResponse = await mutate(owner, "/media-uploads", { content_type: "image/png", byte_length: __MVP_PNG__.length,
    original_filename: "functional-v2-synthetic-report.png" }, 201);
  const upload = parseSchema("MediaUploadResponse", await reservedResponse.json()).data!;
  const content = await endpoint(`/sessions/${owner.id}/media-uploads/${upload.upload_id}/content`, { method: "PUT",
    headers: auth(owner, { "Content-Type": "application/octet-stream", "Idempotency-Key": requestKey() }), body: new Uint8Array(__MVP_PNG__) });
  expect(content.status).toBe(200);
  const completedResponse = await mutate(owner, `/media-uploads/${upload.upload_id}/completion`, { confirm_uploaded: true }, 201);
  const media = parseSchema("MediaResponse", await completedResponse.json()).data!;
  const submittedResponse = await mutate(owner, "/reports", { kind: "citizen", reporter_entity_id: "contributor_functional1",
    media_id: media.media_id, fixture_photo_id: null, segment_id: "seg_edge27", coordinate: [106.701, 10.7705],
    captured_at: capturedAt, captured_sim_minute: capturedMinute, vehicle_types: ["motorbike"], description: "Synthetic M1 acceptance-flow evidence" }, 201);
  const submitted = parseSchema("ReportResponse", await submittedResponse.json()).data!;
  expect(submitted.status).toBe("pending_review"); expect(submitted.observation_ids).toEqual([]);
  const reviewedResponse = await mutate(owner, `/reports/${submitted.report_id}/reviews`, { decision: "accept",
    reason: "Manual acceptance of the synthetic fixture report", mapped_segment_id: "seg_edge27", vehicle_types: ["motorbike"], condition: "normal" }, 200);
  const reviewed = parseSchema("ReportReviewResultResponse", await reviewedResponse.json()).data!;
  expect(reviewed.report.status).toBe("accepted"); expect(reviewed.observations.length).toBeGreaterThan(0);
  return { report: reviewed.report, observations: reviewed.observations };
}

export async function advanceTo(owner: Owner, target: number) {
  const startedResponse = await mutate(owner, "/simulation/advances", { target_sim_minute: target }, 202);
  const started = parseSchema("AdvanceJobResponse", await startedResponse.json()).data!;
  for (let i = 0; i < 300; i++) {
    const jobResponse = await read(owner, `/simulation/advances/${started.advance_job_id}`);
    expect(jobResponse.status).toBe(200);
    const job = parseSchema("AdvanceJobResponse", await jobResponse.json()).data!;
    if (job.status === "failed") throw new Error(`Simulation advance failed:${job.error_code}`);
    if (job.status === "completed") {
      expect(job.reached_sim_minute).toBe(target);
      const clockResponse = await read(owner, "/simulation"); expect(clockResponse.status).toBe(200);
      return parseSchema("SimulationClockResponse", await clockResponse.json()).data!;
    }
    await new Promise(resolve => setTimeout(resolve, 5));
  }
  throw new Error("Simulation advance did not reach its requested time");
}
