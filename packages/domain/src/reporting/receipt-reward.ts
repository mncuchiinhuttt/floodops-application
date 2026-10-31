import { RewardPolicyRefSchema } from "@floodops/contracts";
import type { ReportReward, RewardPolicyRef } from "@floodops/contracts";
import { fail } from "../sources/source-types.ts";
/** Receipt feedback only. Numeric policy evaluation and awards belong to Review. */
export function receiptReward(kind: "driver" | "citizen", raw?: RewardPolicyRef | null): ReportReward {
  if (raw === null || raw === undefined) return { status: "pending_config", policy: null, reason_code: "POLICY_NOT_CONFIGURED", award_id: null };
  const parsed = RewardPolicyRefSchema.safeParse(raw);
  if (!parsed.success) fail("CONFIG_INCOMPLETE");
  return { status: kind === "citizen" ? "pending_review" : "ineligible", policy: structuredClone(parsed.data),
    reason_code: kind === "citizen" ? "AWAITING_REVIEW" : "NOT_ELIGIBLE", award_id: null };
}
