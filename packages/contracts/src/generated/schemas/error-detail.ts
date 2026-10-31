import { z } from "zod";
import { IdSchema } from "./id";
import { RuleIdSchema } from "./rule-id";

export const ErrorDetailSchema = z.strictObject({
  "path": z.union([z.string().refine(v => [...v].length <= 2000, "String too long"), z.null()]),
  "reason": z.string().refine(v => [...v].length <= 2000, "String too long"),
  "rule_id": z.union([RuleIdSchema, z.null()]),
  "entity_ids": z.array(IdSchema).refine(v => v.length <= 100, "Too many items"),
});
export type ErrorDetail = z.infer<typeof ErrorDetailSchema>;
