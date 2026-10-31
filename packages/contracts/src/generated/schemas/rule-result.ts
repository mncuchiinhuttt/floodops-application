import { z } from "zod";
import { IdSchema } from "./id";
import { RuleIdSchema } from "./rule-id";

export const RuleResultSchema = z.strictObject({
  "rule_id": RuleIdSchema,
  "outcome": z.literal(["pass","pending","blocked","needs_replan"]),
  "reason": z.string().refine(v => [...v].length <= 2000, "String too long"),
  "entity_ids": z.array(IdSchema),
});
export type RuleResult = z.infer<typeof RuleResultSchema>;
