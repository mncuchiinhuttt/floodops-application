import { z } from "zod";
import { IdSchema } from "./id";
import { RuleResultSchema } from "./rule-result";

export const ExecutionSchema = z.strictObject({
  "execution_id": IdSchema,
  "plan_id": IdSchema,
  "before_revision": z.number().finite().refine(Number.isInteger, "Expected integer").min(0),
  "after_revision": z.number().finite().refine(Number.isInteger, "Expected integer").min(0),
  "committed_group_ids": z.array(IdSchema),
  "excluded_group_ids": z.array(IdSchema),
  "rules": z.array(RuleResultSchema),
  "sim_minute": z.number().finite().min(0).describe("Finite simulation minutes from scenario T0; fractional minutes allowed. Reject NaN/Infinity."),
  "notification_ids": z.array(IdSchema),
});
export type Execution = z.infer<typeof ExecutionSchema>;
