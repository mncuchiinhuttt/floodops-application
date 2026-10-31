import { z } from "zod";
import { IdSchema } from "./id";
import { ObjectiveSchema } from "./objective";
import { OperationalBranchSchema } from "./operational-branch";
import { RuleResultSchema } from "./rule-result";

export const DryRunResultSchema = z.strictObject({
  "plan_id": IdSchema,
  "feasible": z.boolean(),
  "eligible_group_ids": z.array(IdSchema),
  "excluded_group_ids": z.array(IdSchema),
  "rules": z.array(RuleResultSchema),
  "objective_before": ObjectiveSchema,
  "objective_after": ObjectiveSchema,
  "projected_branches": z.array(OperationalBranchSchema),
});
export type DryRunResult = z.infer<typeof DryRunResultSchema>;
