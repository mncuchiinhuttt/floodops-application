import assert from "node:assert/strict";
import { ApiClient } from "@floodops/api-client";
import { CONTRACT_VERSION, CONTRACT_SOURCE_SHA256, schemas, operations, getInternalServiceDefinitions,
  getToolDefinitions, RuntimeCommanderDisabledError, parseSchema } from "../src";
const time = "2026-10-31T10:00:00Z", session = "session_smoke0001";
const reward = { status: "pending_config", policy: null, reason_code: "POLICY_NOT_CONFIGURED", award_id: null };
const report = { report_id: "report_smoke0001", participant_id: "participant_smoke0001", kind: "citizen",
  segment_id: "segment_smoke0001", coordinate: null, captured_at: time, captured_sim_minute: 0, received_at: time,
  vehicle_types: ["motorbike"], description: "Synthetic visible water", media_id: "media_smoke0001", fixture_photo_id: null,
  status: "accepted", reason_codes: ["ACCEPTED"], observation_ids: [], award_id: null, input_revision: 1,
  observation_candidates: [], input_mode: "photo", quick_condition: null, reporter_entity_id: "contributor_smoke0001",
  reward, review_result_id: "review_smoke0001", reviewed_at: time };
let calls = 0;
const client = new ApiClient({ baseUrl: "https://floodops.example/api/v1", credentials: () => ({ kind: "native", accessToken: "synthetic-smoke-token-".repeat(2) }),
  fetch: async (_url, init) => { calls++; assert.equal(init.method, "POST"); return Response.json({ success: true,
    data: { report, observations: [], filled_gap_ids: [], award: null, planning_job_id: null }, error: null,
    meta: { request_id: "request_smoke01", session_id: session, generation: 1, revision: 2 } }); } });
const result = await client.request("reviewReport", { path: { session_id: session, report_id: report.report_id },
  headers: { "If-Match": `"s:${session}:g:1:r:1"`, "Idempotency-Key": "key_smoke_000000001" },
  body: { decision: "accept", reason: "Synthetic manual review", mapped_segment_id: report.segment_id, vehicle_types: ["motorbike"], condition: "caution" } });
assert.equal(result.body.data.report.status, "accepted"); assert.equal(result.body.data.report.reward.status, "pending_config");
assert.equal(result.body.data.award, null); assert.throws(() => getToolDefinitions(), RuntimeCommanderDisabledError);
const planner = parseSchema("PlanningJob", { job_id: "job_smoke0001", session_id: session, generation: 1, input_revision: 2,
  status: "failed", plan_id: null, error_code: "NO_FEASIBLE_PLAN", planner: { kind: "deterministic", algorithm_version: "bounded-search-v1", config_hash: "a".repeat(64), search_limit: 20 }, created_at: time, completed_at: time });
console.log(JSON.stringify({ smoke: "M1-in-process-contract-client", contract_version: CONTRACT_VERSION,
  operations: Object.keys(operations).length, schemas: Object.keys(schemas).length, internal_services: getInternalServiceDefinitions().length,
  model_callable_tools: 0, review_calls: calls, report_status: result.body.data.report.status,
  reward_status: result.body.data.report.reward.status, award: null, planner_outcome: planner.error_code, source_sha256: CONTRACT_SOURCE_SHA256 }));
