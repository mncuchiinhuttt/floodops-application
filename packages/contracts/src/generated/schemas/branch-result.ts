import { z } from "zod";
import { BranchIdSchema } from "./branch-id";
import { MetricsSchema } from "./metrics";

export const BranchResultSchema = z.strictObject({
  "branch_id": BranchIdSchema,
  "metrics": MetricsSchema,
  "completed_at_horizon": z.boolean(),
});
export type BranchResult = z.infer<typeof BranchResultSchema>;
