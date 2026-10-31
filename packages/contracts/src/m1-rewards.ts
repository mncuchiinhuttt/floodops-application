import { ReportReviewResultSchema, type ReportReviewResult } from "./generated/schemas/report-review-result";
import { ReportRewardSchema, type ReportReward } from "./generated/schemas/report-reward";
import { ContractValidationError, validate } from "./validation";
function invalid(code: string): never {
  throw new ContractValidationError("M1Reward", [{ path: "reward", code }]);
}
const samePolicy = (a: ReportReward["policy"], b: ReportReward["policy"]) =>
  a === null || b === null ? a === b : a.policy_id === b.policy_id && a.version === b.version && a.config_hash === b.config_hash;
/** Enforces receipt immutability, including a missing policy. Does not evaluate or grant points. */
export function assertReceiptRewardPolicyUnchanged(before: ReportReward, after: ReportReward): void {
  const oldReward = validate(ReportRewardSchema, before, "M1Reward.before");
  const newReward = validate(ReportRewardSchema, after, "M1Reward.after");
  if (!samePolicy(oldReward.policy, newReward.policy)) invalid("receipt_policy_changed");
}
/** Cross-resource identity checks in addition to strict shape/state validation. */
export function parseM1ReviewResult(value: unknown): ReportReviewResult {
  const result = validate(ReportReviewResultSchema, value, "M1ReviewResult");
  const { report, award } = result;
  if (report.award_id !== report.reward.award_id) invalid("report_award_mismatch");
  if (award && (report.kind !== "citizen" || award.contributor_id !== report.reporter_entity_id ||
    award.filled_gap_ids.length !== result.filled_gap_ids.length ||
    award.filled_gap_ids.some(id => !result.filled_gap_ids.includes(id)) || award.award_id !== report.award_id || award.report_id !== report.report_id ||
    award.review_result_id !== report.review_result_id || !samePolicy(award.reward_policy, report.reward.policy))) {
    invalid("award_receipt_review_mismatch");
  }
  return result;
}
