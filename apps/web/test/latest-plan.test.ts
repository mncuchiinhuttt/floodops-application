import { expect, test } from "vitest";
import { PlanningJobSchema } from "@floodops/contracts";
import { latestPlanningJob } from "../src/app/latest-job";
import { latestPlanReason } from "../src/app/latest-plan";
import { plan } from "./plan-fixture";
import { session } from "./fixtures";
const job = PlanningJobSchema.parse({ job_id: plan.planning_job_id, session_id: session.session_id, generation: 1, input_revision: 4,
  status: "completed", plan_id: plan.plan_id, error_code: null, created_at: session.created_at, completed_at: "2026-10-31T00:00:01Z",
  planner: { kind: "deterministic", algorithm_version: "synthetic-test-v1", config_hash: "a".repeat(64), search_limit: 7 } });
const meta = { request_id: "latest-test", session_id: session.session_id, generation: 1, revision: 4, event_sequence: 8 };
const cached = { plan, latest: plan, activeJob: job, planMeta: meta, snapshotMeta: meta, snapshotSession: session, current: session, fetching: false, snapshotReady: true };
test("completed latest job permits commands; failed refetch and same-revision supersession block", () => {
  expect(latestPlanReason(cached)).toBeUndefined();
  expect(latestPlanReason({ ...cached, snapshotReady: false })).toBeDefined();
  expect(latestPlanReason({ ...cached, fetching: true })).toBeDefined();
  expect(latestPlanReason({ ...cached, activeJob: null })).toBeDefined();
  for (const status of ["queued", "running", "failed", "cancelled", "superseded"] as const)
    expect(latestPlanReason({ ...cached, activeJob: { ...job, status } })).toBeDefined();
  expect(latestPlanReason({ ...cached, activeJob: { ...job, job_id: "job_newer001" } })).toBeDefined();
  expect(latestPlanReason({ ...cached, latest: { ...plan, planning_job_id: "job_superseded001" } })).toBeDefined();
  expect(latestPlanReason({ ...cached, latest: { ...plan, actions: [] } })).toBeDefined();
});
test("current metadata and epoch are mandatory; newer unrelated sequence is allowed", () => {
  expect(latestPlanReason({ ...cached, planMeta: undefined })).toBeDefined();
  expect(latestPlanReason({ ...cached, planMeta: { ...meta, generation: 2 } })).toBeDefined();
  expect(latestPlanReason({ ...cached, snapshotMeta: { ...meta, revision: 3 } })).toBeDefined();
  expect(latestPlanReason({ ...cached, snapshotSession: { ...session, session_id: "session_other001" } })).toBeDefined();
  expect(latestPlanReason({ ...cached, planMeta: { ...meta, event_sequence: 9 }, snapshotMeta: { ...meta, event_sequence: 10 } })).toBeUndefined();
});

test("a created job cannot mask a newer authoritative snapshot job at the same revision", () => {
  const created = { job, meta };
  const newer = { ...job, job_id: "job_newer001" };
  expect(latestPlanningJob(session, { ...meta, event_sequence: 9 }, newer, created)).toBe(newer);
  expect(latestPlanningJob(session, { ...meta, event_sequence: 9 }, newer, { job, meta: { ...meta, event_sequence: undefined } })).toBe(newer);
  expect(latestPlanningJob(session, { ...meta, event_sequence: 7 }, newer, created)).toBe(job);
  expect(latestPlanningJob(session, { ...meta, event_sequence: 9 }, null, created)).toBeNull();
});
