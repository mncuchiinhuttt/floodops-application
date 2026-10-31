import { assertReceiptRewardPolicyUnchanged, parseSchema } from "@floodops/contracts";
import type { Award, Report } from "@floodops/contracts";

/** Preserve receipt pins; the authenticated reducer alone supplies human identity/time. */
export function humanReview(report: Report, status: "accepted" | "rejected", resultId: string, at: string): Report {
  return parseSchema("Report", { ...report, status, review_result_id: resultId, reviewed_at: at,
    reward: report.reward.policy === null
      ? { status: "pending_config", policy: null, reason_code: "POLICY_NOT_CONFIGURED", award_id: null }
      : { status: "ineligible", policy: report.reward.policy, reason_code: "NOT_ELIGIBLE", award_id: null }, award_id: null });
}
export function attachAward(original: Report, reviewed: Report, award: Award | null): Report {
  const report = parseSchema("Report", award ? { ...reviewed, award_id: award.award_id,
    reward: { status: "committed", policy: award.reward_policy, reason_code: "AWARDED", award_id: award.award_id } } : reviewed);
  assertReceiptRewardPolicyUnchanged(original.reward, report.reward);
  return report;
}
