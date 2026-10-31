import { z } from "zod";
import { IdSchema } from "./id";

export const PlanningJobInputSchema = z.strictObject({
  "cause": z.literal(["incident","accepted_report","conflict_resolved","manual"]),
  "cause_entity_ids": z.array(IdSchema),
});
export type PlanningJobInput = z.infer<typeof PlanningJobInputSchema>;
