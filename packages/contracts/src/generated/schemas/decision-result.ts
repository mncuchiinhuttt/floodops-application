import { z } from "zod";
import { ApprovalSchema } from "./approval";
import { IdSchema } from "./id";
import { PlanActionSchema } from "./plan-action";

export const DecisionResultSchema = z.strictObject({
  "plan_id": IdSchema,
  "approvals": z.array(ApprovalSchema),
  "action_states": z.array(PlanActionSchema),
});
export type DecisionResult = z.infer<typeof DecisionResultSchema>;
