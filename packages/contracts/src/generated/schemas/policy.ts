import { z } from "zod";
import { RuleIdSchema } from "./rule-id";

export const PolicySchema = z.strictObject({
  "rule_id": RuleIdSchema,
  "summary": z.string().refine(v => [...v].length <= 2000, "String too long"),
  "hard_rule": z.boolean(),
  "enabled": z.boolean(),
  "config_parameter_keys": z.array(z.string().refine(v => [...v].length <= 100, "String too long")),
});
export type Policy = z.infer<typeof PolicySchema>;
