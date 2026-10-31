import { expect, test } from "bun:test";
import { parseSchema, parseOperationInput, parseM1ReviewResult, assertReceiptRewardPolicyUnchanged,
  getToolDefinitions, RuntimeCommanderDisabledError, getInternalServiceDefinitions, internalServices,
  parseInternalServiceInput, type ReportReward } from "../src";
const policy = { policy_id: "policy_demo0001", version: "demo-config-v1", config_hash: "a".repeat(64) };
const pending: ReportReward = { status: "pending_config", policy: null, reason_code: "POLICY_NOT_CONFIGURED", award_id: null };
const committed: ReportReward = { status: "committed", policy, reason_code: "AWARDED", award_id: "award_demo0001" };
const time = "2026-10-31T10:00:00Z";
const report = (reward: ReportReward) => ({ report_id: "report_demo0001", participant_id: "participant_demo0001", kind: "citizen",
  segment_id: "segment_demo0001", coordinate: null, captured_at: time, captured_sim_minute: 0, received_at: time,
  vehicle_types: ["motorbike"], description: "Visible water from a safe position", media_id: "media_demo0001", fixture_photo_id: null,
  status: "accepted", reason_codes: ["ACCEPTED"], observation_ids: [], award_id: reward.award_id,
  input_revision: 1, observation_candidates: [], input_mode: "photo", quick_condition: null, reporter_entity_id: "contributor_demo0001",
  reward, review_result_id: "review_demo0001", reviewed_at: time });
const award = { award_id: "award_demo0001", report_id: "report_demo0001", contributor_id: "contributor_demo0001",
  filled_gap_ids: ["gap_demo0001"], points: 4, event_sequence: 2, awarded_at: time, is_simulated: true,
  reward_policy: policy, review_result_id: "review_demo0001" };
const review = (reward: ReportReward, value: unknown = null) => ({ report: report(reward), observations: [], filled_gap_ids: value ? ["gap_demo0001"] : [], award: value, planning_job_id: null });
test("successful manual review/knowledge feedback can remain pending_config without award", () => {
  const result = parseM1ReviewResult(review(pending));
  expect(result.report.status).toBe("accepted"); expect(result.report.reward.policy).toBeNull(); expect(result.award).toBeNull();
  expect(() => parseM1ReviewResult({ ...review(pending), award: { ...award, points: 0 } })).toThrow();
  expect(() => parseM1ReviewResult(review(pending, award))).toThrow();
  expect(() => parseSchema("ReportReward", { ...pending, points: 0 })).toThrow();
});
test("receipt policy cannot be backfilled or replaced, and no default amount exists", () => {
  expect(() => assertReceiptRewardPolicyUnchanged(pending, pending)).not.toThrow();
  expect(() => assertReceiptRewardPolicyUnchanged(pending, committed)).toThrow();
  const awaiting: ReportReward = { status: "pending_review", policy, reason_code: "AWAITING_REVIEW", award_id: null };
  expect(() => assertReceiptRewardPolicyUnchanged(awaiting, committed)).not.toThrow();
  expect(() => assertReceiptRewardPolicyUnchanged(awaiting, { ...committed, policy: { ...policy, version: "replacement-v2" } })).toThrow();
  expect(() => parseSchema("Award", { ...award, points: 0 })).toThrow();
  expect(() => parseSchema("Award", { ...award, points: undefined })).toThrow();
});
test("committed awards bind exact report/review/policy/award identity", () => {
  expect(parseM1ReviewResult(review(committed, award)).award?.points).toBe(4); // Synthetic explicit test config, not a default.
  for (const change of [{ report_id: "report_other001" }, { review_result_id: "review_other001" },
    { reward_policy: { ...policy, config_hash: "b".repeat(64) } }, { award_id: "award_other001" }, { contributor_id: "contributor_other001" }, { filled_gap_ids: ["gap_other001"] }]) {
    expect(() => parseM1ReviewResult(review(committed, { ...award, ...change }))).toThrow();
  }
  expect(() => parseM1ReviewResult({ ...review(committed, award), filled_gap_ids: [] })).toThrow();
  expect(() => parseM1ReviewResult({ ...review(committed, award), report: { ...report(committed), award_id: "award_other001" } })).toThrow();
});
test("report review identity is absent before review and required after review", () => {
  expect(() => parseSchema("Report", { ...report(pending), status: "pending_review", review_result_id: null, reviewed_at: null })).not.toThrow();
  expect(() => parseSchema("Report", { ...report(pending), reviewed_at: null })).toThrow();
  expect(() => parseSchema("Report", { ...report(pending), reward: undefined })).toThrow();
  expect(() => parseSchema("Report", { ...report(committed), status: "rejected" })).toThrow();
  expect(() => parseSchema("Report", { ...report(pending), reward: { status: "pending_review", policy, reason_code: "AWAITING_REVIEW", award_id: null } })).toThrow();
});
test("free-report input has no mission prerequisite and rejects caller reward authority", () => {
  const input = { kind: "citizen", media_id: "media_demo0001", fixture_photo_id: null, segment_id: "segment_demo0001", coordinate: null,
    captured_at: time, captured_sim_minute: 0, vehicle_types: ["motorbike"], description: "Observed from a safe location" };
  expect(() => parseSchema("SubmitReportInput", input)).not.toThrow();
  for (const extra of [{ reward: pending }, { reward_policy: policy }, { points: 4 }, { mission_id: "mission_m2only001" }]) {
    expect(() => parseSchema("SubmitReportInput", { ...input, ...extra })).toThrow();
  }
});
test("deterministic planner requires explicit budget/config, no model selection or false completion", () => {
  const planner = { kind: "deterministic", algorithm_version: "bounded-search-v1", config_hash: "b".repeat(64), search_limit: 20 };
  const job = { job_id: "job_demo0001", session_id: "session_demo0001", generation: 0, input_revision: 0, status: "failed", plan_id: null,
    error_code: "NO_FEASIBLE_PLAN", planner, created_at: time, completed_at: time };
  expect(() => parseSchema("PlanningJob", job)).not.toThrow();
  for (const change of [{ model: "legacy-commander" }, { status: "completed" }, { plan_id: "plan_demo0001" }, { error_code: "MODEL_TIMEOUT" }]) {
    expect(() => parseSchema("PlanningJob", { ...job, ...change })).toThrow();
  }
  for (const search_limit of [0, -1, 0.5, Infinity, Number.MAX_SAFE_INTEGER + 1]) {
    expect(() => parseSchema("DeterministicPlannerMetadata", { ...planner, search_limit })).toThrow();
  }
  expect(() => parseSchema("EvaluationInput", { kind: "model_quality", runs: 10, scenario_id: "scenario_demo001", scenario_version: "v1" })).toThrow();
});
test("internal services retain typed compatibility but cannot produce model tool registrations", () => {
  expect(() => getToolDefinitions()).toThrow(RuntimeCommanderDisabledError);
  const definitions = getInternalServiceDefinitions(); expect(definitions).toHaveLength(8);
  expect(definitions.filter(d => d.milestone === "M1")).toHaveLength(7);
  expect(definitions.every(d => d.model_callable === false && !("type" in d))).toBe(true);
  expect(internalServices.propose_order_deferral.milestone).toBe("M2");
  expect(() => parseInternalServiceInput("get_incident_state", {})).not.toThrow();
  expect(() => parseOperationInput("createPlanningJob", { path: { session_id: "session_demo0001" },
    headers: { "Idempotency-Key": "key_demo_000000001", "If-Match": '"s:session_demo0001:g:0:r:0"' }, body: { cause: "manual", cause_entity_ids: [], model: "forbidden" } })).toThrow();
});
