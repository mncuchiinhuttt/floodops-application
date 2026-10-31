import { z } from "zod";
import { MetaSchema } from "./meta";
import { PlanSchema } from "./plan";

export const PlanResponseSchema = z.strictObject({
  "success": z.literal(true),
  "data": PlanSchema,
  "error": z.null(),
  "meta": MetaSchema,
});
export type PlanResponse = z.infer<typeof PlanResponseSchema>;
