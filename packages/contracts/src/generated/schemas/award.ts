import { z } from "zod";
import { isTimestamp } from "../../schema-helpers";
import { IdSchema } from "./id";

export const AwardSchema = z.strictObject({
  "award_id": IdSchema,
  "report_id": IdSchema,
  "contributor_id": IdSchema,
  "filled_gap_ids": z.array(IdSchema).refine(v => v.length >= 1, "Too few items"),
  "points": z.number().finite().refine(Number.isInteger, "Expected integer").min(1),
  "event_sequence": z.number().finite().refine(Number.isInteger, "Expected integer").min(0),
  "awarded_at": z.string().refine(isTimestamp, "Invalid RFC3339 timestamp"),
  "is_simulated": z.literal(true),
});
export type Award = z.infer<typeof AwardSchema>;
