import { z } from "zod";
import { hasUniqueItems, isTimestamp } from "../../schema-helpers";
import { IdSchema } from "./id";
import { RewardPolicyRefSchema } from "./reward-policy-ref";

export const AwardSchema = z.strictObject({
  "award_id": IdSchema,
  "report_id": IdSchema,
  "contributor_id": IdSchema,
  "filled_gap_ids": z.array(IdSchema).refine(v => v.length >= 1, "Too few items").refine(hasUniqueItems, "Duplicate items"),
  "points": z.number().finite().refine(Number.isInteger, "Expected integer").min(1),
  "event_sequence": z.number().finite().refine(Number.isInteger, "Expected integer").min(0),
  "awarded_at": z.string().refine(isTimestamp, "Invalid RFC3339 timestamp"),
  "is_simulated": z.literal(true),
  "reward_policy": RewardPolicyRefSchema,
  "review_result_id": IdSchema,
}).describe("Committed positive simulated points only, bound to report, canonical review result, and immutable receipt policy. Amount and per-report/per-gap rule come from the pinned config; no default, pending row, retroactive policy assignment or campaign migration.");
export type Award = z.infer<typeof AwardSchema>;
