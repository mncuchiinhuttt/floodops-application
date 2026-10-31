import { expect, test } from "bun:test";
import { assertReceiptRewardPolicyUnchanged, parseM1ReviewResult } from "@floodops/contracts";
import { proposeReportReward } from "@floodops/domain/rewards";
import type { ReviewOptions } from "../../src/features/reports/review/index";
import { loadDemoRewardPolicy, prepareRewardPolicy, resolvePinnedReward } from "../../src/features/rewards/reward-policy";
import demoRewardPolicyDocument from "../../../../data/policies/demo-reward-policy-v1.json";
import { attachAward, humanReview } from "../../src/features/reports/review/review-result";
import { context, openedLedger, report, rewardInput, source } from "../rewards/fixtures";

const payload = { policy_id: "policy_fixture001", version: "test-v1", basis: "per_report" as const,
  points_per_report: 7, eligible_source_ids: [source.source_id] };
const configured = prepareRewardPolicy(payload);
const options = (resolver?: ReviewOptions["resolveRewardPolicy"]) => ({ resolveRewardPolicy: resolver } as ReviewOptions);
const pending = () => report({ status: "pending_review", review_result_id: null, reviewed_at: null,
  reward: { status: "pending_config", policy: null, reason_code: "POLICY_NOT_CONFIGURED", award_id: null } });

test("null receipt commits useful coverage and photo claim without award or a resolver call", () => {
  const original = pending(), reviewed = humanReview(original, "accepted", "review_manual001", context.awarded_at);
  let calls = 0;
  const config = resolvePinnedReward(options(() => { calls++; return configured; }), original.reward.policy);
  const input = rewardInput({ report: reviewed, config }), proposal = proposeReportReward(openedLedger(), input);
  const result = parseM1ReviewResult({ report: attachAward(original, reviewed, proposal.new_award),
    observations: [], filled_gap_ids: proposal.filled_gap_ids, award: proposal.new_award, planning_job_id: null });
  expect(calls).toBe(0); expect(proposal.filled_gap_ids).toEqual(["gap_bike001"]);
  expect(proposal.ledger.photos).toHaveLength(1); expect(proposal.ledger.awards).toEqual([]);
  expect(result.report.reward).toEqual(original.reward); expect(result.award).toBeNull();
  expect(result.report.review_result_id).toBe("review_manual001"); expect(result.report.reviewed_at).toBe(context.awarded_at);
});
test("later policy publication cannot upgrade null receipt or retro-award a filled gap", () => {
  const original = pending(), reviewed = humanReview(original, "accepted", "review_manual001", context.awarded_at);
  const input = rewardInput({ report: reviewed, config: null }), first = proposeReportReward(openedLedger(), input);
  const again = proposeReportReward(first.ledger, { ...input, config: resolvePinnedReward(options(() => configured), original.reward.policy),
    context: { ...input.context, event_sequence: 3 } });
  expect(again.new_award).toBeNull(); expect(again.ledger.awards).toEqual([]); expect(again.filled_gap_ids).toEqual([]);
  expect(() => assertReceiptRewardPolicyUnchanged(original.reward, { status: "ineligible", policy: configured.policy,
    reason_code: "NOT_ELIGIBLE", award_id: null })).toThrow();
});
test("manual Reject has canonical identity/time and preserves immutable null policy", () => {
  const original = pending(), rejected = humanReview(original, "rejected", "review_reject001", context.awarded_at);
  const result = parseM1ReviewResult({ report: attachAward(original, rejected, null), observations: [], filled_gap_ids: [], award: null, planning_job_id: null });
  expect(result.report.status).toBe("rejected"); expect(result.report.reward).toEqual(original.reward);
  expect(result.report.review_result_id).toBe("review_reject001");
});
test("configured award binds exact payload pin and current human result/time", () => {
  const original = report({ status: "pending_review", review_result_id: null, reviewed_at: null,
    reward: { status: "pending_review", policy: configured.policy, reason_code: "AWAITING_REVIEW", award_id: null } });
  const reviewed = humanReview(original, "accepted", "review_bound001", context.awarded_at);
  const proposal = proposeReportReward(openedLedger(), rewardInput({ report: reviewed, config: resolvePinnedReward(options(() => configured), configured.policy) }));
  const result = parseM1ReviewResult({ report: attachAward(original, reviewed, proposal.new_award),
    observations: [], filled_gap_ids: proposal.filled_gap_ids, award: proposal.new_award, planning_job_id: null });
  expect(result.award?.points).toBe(7); expect(result.award?.reward_policy).toEqual(configured.policy);
  expect(result.award?.review_result_id).toBe(result.report.review_result_id!); expect(result.award?.awarded_at).toBe(result.report.reviewed_at!);
  expect(result.report.reward.status).toBe("committed");
  expect(() => proposeReportReward(openedLedger(), rewardInput({ report: reviewed, config: configured,
    context: { ...context, awarded_at: "2026-10-31T00:04:00Z" } }))).toThrow();
});
test("resolver verifies payload hash and complete reference without latest fallback", () => {
  for (const changed of [{ ...configured, points_per_report: 999 }, { ...configured, eligible_source_ids: [] },
    { ...configured, policy: { ...configured.policy, version: "newer" } },
    { ...configured, policy: { ...configured.policy, config_hash: "f".repeat(64) } }]) {
    expect(resolvePinnedReward(options(() => changed), configured.policy)).toBeNull();
  }
  const received: string[] = [];
  const found = resolvePinnedReward(options(ref => { received.push(JSON.stringify(ref)); return configured; }), configured.policy);
  expect(received).toEqual([JSON.stringify(configured.policy)]); expect(found).toEqual(configured);
  expect(Object.isFrozen(found?.policy)).toBe(true); expect(Object.isFrozen(found?.eligible_source_ids)).toBe(true);
  expect(resolvePinnedReward(options(() => { throw new Error("archive unavailable"); }), configured.policy)).toBeNull();
});
test("explicit policy payload validates positive per-report amount and deterministic source ordering", () => {
  expect(() => prepareRewardPolicy({ ...payload, points_per_report: 0 })).toThrow();
  expect(() => prepareRewardPolicy({ ...payload, eligible_source_ids: [source.source_id, source.source_id] })).toThrow();
  const first = prepareRewardPolicy({ ...payload, eligible_source_ids: [source.source_id, "src_fixture002"] });
  const second = prepareRewardPolicy({ ...payload, eligible_source_ids: ["src_fixture002", source.source_id] });
  expect(first.policy).toEqual(second.policy);
  expect(prepareRewardPolicy({ ...payload, version: "test-v2" }).policy.config_hash).not.toBe(configured.policy.config_hash);
});
test("demo policy document loads strictly and disabled or malformed config stays absent", () => {
  const loaded = loadDemoRewardPolicy(demoRewardPolicyDocument);
  expect(loaded?.policy.policy_id).toBe("policy_demo_m1_v1");
  expect(loaded?.points_per_report).toBe(3);
  expect(loaded?.eligible_source_ids).toEqual(["src_citizen1"]);
  expect(loaded?.policy.config_hash).toMatch(/^[0-9a-f]{64}$/);
  expect(loadDemoRewardPolicy(demoRewardPolicyDocument, false)).toBeNull();
  expect(loadDemoRewardPolicy({ ...demoRewardPolicyDocument, extra: true })).toBeNull();
  expect(loadDemoRewardPolicy({ ...demoRewardPolicyDocument, provenance: "unsupported" })).toBeNull();
  expect(loadDemoRewardPolicy({ ...demoRewardPolicyDocument,
    reward: { ...demoRewardPolicyDocument.reward, points_per_report: 0 } })).toBeNull();
});
