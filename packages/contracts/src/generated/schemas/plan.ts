import { z } from "zod";
import { DependencyGroupSchema } from "./dependency-group";
import { IdSchema } from "./id";
import { ObjectiveSchema } from "./objective";
import { PlanActionSchema } from "./plan-action";
import { PlanDiffEntrySchema } from "./plan-diff-entry";

export const PlanSchema = z.strictObject({
  "plan_id": IdSchema,
  "session_id": IdSchema,
  "generation": z.number().finite().refine(Number.isInteger, "Expected integer").min(0),
  "input_revision": z.number().finite().refine(Number.isInteger, "Expected integer").min(0),
  "planning_job_id": IdSchema,
  "status": z.literal(["proposed","pending_approval","ready","blocked","rejected","executed","needs_replan"]),
  "actions": z.array(PlanActionSchema),
  "groups": z.array(DependencyGroupSchema),
  "route_ids": z.array(IdSchema),
  "objective_before": ObjectiveSchema,
  "objective_after": ObjectiveSchema,
  "diff": z.array(PlanDiffEntrySchema),
  "is_projected": z.literal(true),
});
export type Plan = z.infer<typeof PlanSchema>;
