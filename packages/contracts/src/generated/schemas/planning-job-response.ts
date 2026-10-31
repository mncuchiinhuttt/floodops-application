import { z } from "zod";
import { MetaSchema } from "./meta";
import { PlanningJobSchema } from "./planning-job";

export const PlanningJobResponseSchema = z.strictObject({
  "success": z.literal(true),
  "data": PlanningJobSchema,
  "error": z.null(),
  "meta": MetaSchema,
});
export type PlanningJobResponse = z.infer<typeof PlanningJobResponseSchema>;
