import { z } from "zod";
import { MetaSchema } from "./meta";
import { PlanListSchema } from "./plan-list";

export const PlanListResponseSchema = z.strictObject({
  "success": z.literal(true),
  "data": PlanListSchema,
  "error": z.null(),
  "meta": MetaSchema,
});
export type PlanListResponse = z.infer<typeof PlanListResponseSchema>;
