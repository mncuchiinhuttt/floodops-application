import { z } from "zod";
import { hasUniqueItems } from "../../schema-helpers";
import { IdSchema } from "./id";

export const PlanDecisionInputSchema = z.strictObject({
  "action_ids": z.array(IdSchema).refine(v => v.length >= 1, "Too few items").refine(hasUniqueItems, "Duplicate items"),
  "decision": z.literal(["approve","reject"]),
  "reason": z.string().refine(v => [...v].length <= 2000, "String too long"),
});
export type PlanDecisionInput = z.infer<typeof PlanDecisionInputSchema>;
