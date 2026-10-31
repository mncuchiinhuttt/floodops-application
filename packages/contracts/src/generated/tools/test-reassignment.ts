import { z } from "zod";
import { DryRunResultSchema } from "../schemas/dry-run-result";
import { PlanActionSchema } from "../schemas/plan-action";

export const testReassignment = {
  name: "test_reassignment",
  input: z.strictObject({
  "actions": z.array(PlanActionSchema).refine(v => v.length <= 100, "Too many items"),
}),
  output: DryRunResultSchema,
  sideEffect: "dry_run_only",
} as const;
