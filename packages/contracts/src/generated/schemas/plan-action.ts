import { z } from "zod";
import { hasUniqueItems } from "../../schema-helpers";
import { ActionChangeSchema } from "./action-change";
import { IdSchema } from "./id";
import { RuleResultSchema } from "./rule-result";

export const PlanActionSchema = z.strictObject({
  "action_id": IdSchema,
  "kind": z.literal(["reroute","reassign","defer","change_hub","eta_preview"]),
  "targets": ActionChangeSchema,
  "dependency_group_id": IdSchema,
  "depends_on_action_ids": z.array(IdSchema).refine(hasUniqueItems, "Duplicate items"),
  "reason": z.string().refine(v => [...v].length <= 2000, "String too long"),
  "evidence_ids": z.array(IdSchema),
  "rule_results": z.array(RuleResultSchema),
  "status": z.literal(["proposed","pending_approval","ready","blocked","rejected","executed","needs_replan"]),
});
export type PlanAction = z.infer<typeof PlanActionSchema>;
