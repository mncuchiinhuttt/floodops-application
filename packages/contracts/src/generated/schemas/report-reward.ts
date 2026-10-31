import { z } from "zod";
import { IdSchema } from "./id";
import { RewardPolicyRefSchema } from "./reward-policy-ref";

export const ReportRewardSchema = z.strictObject({
  "status": z.literal(["pending_review","pending_config","ineligible","committed"]),
  "policy": z.union([RewardPolicyRefSchema, z.null()]),
  "reason_code": z.literal(["AWAITING_REVIEW","POLICY_NOT_CONFIGURED","NOT_ELIGIBLE","AWARDED"]),
  "award_id": z.union([IdSchema, z.null()]),
}).refine(v => z.unknown().refine(v => !z.object({"status": z.literal("pending_review").optional()}).safeParse(v).success || z.object({"policy": RewardPolicyRefSchema.optional(), "reason_code": z.literal("AWAITING_REVIEW").optional(), "award_id": z.null().optional()}).safeParse(v).success, "Conditional constraint").safeParse(v).success, "Conditional constraint").refine(v => z.unknown().refine(v => !z.object({"status": z.literal("pending_config").optional()}).safeParse(v).success || z.object({"policy": z.null().optional(), "reason_code": z.literal("POLICY_NOT_CONFIGURED").optional(), "award_id": z.null().optional()}).safeParse(v).success, "Conditional constraint").safeParse(v).success, "Conditional constraint").refine(v => z.unknown().refine(v => !z.object({"status": z.literal("ineligible").optional()}).safeParse(v).success || z.object({"policy": RewardPolicyRefSchema.optional(), "reason_code": z.literal("NOT_ELIGIBLE").optional(), "award_id": z.null().optional()}).safeParse(v).success, "Conditional constraint").safeParse(v).success, "Conditional constraint").refine(v => z.unknown().refine(v => !z.object({"status": z.literal("committed").optional()}).safeParse(v).success || z.object({"policy": RewardPolicyRefSchema.optional(), "reason_code": z.literal("AWARDED").optional(), "award_id": IdSchema.optional()}).safeParse(v).success, "Conditional constraint").safeParse(v).success, "Conditional constraint").describe("M1 free-report feedback. Missing receipt policy is pending_config, not an error, award, or zero points. Manual review/knowledge may commit independently. Only committed awards appear in the points ledger.");
export type ReportReward = z.infer<typeof ReportRewardSchema>;
