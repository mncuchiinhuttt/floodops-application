import { expect, test } from "bun:test";
import { ApiClient } from "../src";
import { ContractValidationError, type ReportReward } from "@floodops/contracts";
import { meta, response, sessionId } from "./fixtures";
const time = "2026-10-31T10:00:00Z";
const policy = { policy_id: "policy_demo0001", version: "demo-config-v1", config_hash: "a".repeat(64) };
const pending: ReportReward = { status: "pending_config", policy: null, reason_code: "POLICY_NOT_CONFIGURED", award_id: null };
const committed: ReportReward = { status: "committed", policy, reason_code: "AWARDED", award_id: "award_demo0001" };
const report = (reward: ReportReward) => ({ report_id: "report_demo0001", participant_id: "participant_demo0001", kind: "citizen",
  segment_id: "segment_demo0001", coordinate: null, captured_at: time, captured_sim_minute: 0, received_at: time,
  vehicle_types: ["motorbike"], description: "Visible water", media_id: "media_demo0001", fixture_photo_id: null,
  status: "accepted", reason_codes: ["ACCEPTED"], observation_ids: [], award_id: reward.award_id, input_revision: 1,
  observation_candidates: [], input_mode: "photo", quick_condition: null, reporter_entity_id: "contributor_demo0001",
  reward, review_result_id: "review_demo0001", reviewed_at: time });
const award = { award_id: "award_demo0001", report_id: "report_demo0001", contributor_id: "contributor_demo0001",
  filled_gap_ids: ["gap_demo0001"], points: 4, event_sequence: 2, awarded_at: time, is_simulated: true,
  reward_policy: policy, review_result_id: "review_demo0001" };
const input = { path: { session_id: sessionId, report_id: "report_demo0001" }, headers: {
  "Idempotency-Key": "key_review_0000001", "If-Match": `"s:${sessionId}:g:2:r:3"` },
  body: { decision: "accept" as const, reason: "Manual review", mapped_segment_id: "segment_demo0001", vehicle_types: ["motorbike" as const], condition: "caution" as const } };
test("ApiClient preserves review envelope while validating pending_config and committed data", async () => {
  for (const reward of [pending, committed]) {
    const client = new ApiClient({ baseUrl: "https://floodops.example/api/v1", credentials: () => ({ kind: "native", accessToken: "synthetic-token-".repeat(3) }),
      fetch: async () => response({ report: report(reward), observations: [], filled_gap_ids: reward === pending ? [] : ["gap_demo0001"], award: reward === pending ? null : award, planning_job_id: null }) });
    const result = await client.request("reviewReport", input);
    expect(result.body.success).toBe(true); expect(result.body.meta).toEqual(meta);
    expect(result.body.data.report.reward.status).toBe(reward.status);
    expect(result.body.data.award?.points ?? null).toBe(reward === pending ? null : 4);
  }
});
test("ApiClient rejects cross-review award identity rather than presenting committed points", async () => {
  const client = new ApiClient({ baseUrl: "https://floodops.example/api/v1", credentials: () => ({ kind: "native", accessToken: "synthetic-token-".repeat(3) }),
    fetch: async () => response({ report: report(committed), observations: [], filled_gap_ids: ["gap_demo0001"], award: { ...award, review_result_id: "review_other001" }, planning_job_id: null }) });
  await expect(client.request("reviewReport", input)).rejects.toBeInstanceOf(ContractValidationError);
});
