import { z } from "zod";
import { PageSchema } from "./page";
import { PlanSchema } from "./plan";

export const PlanListSchema = z.strictObject({
  "items": z.array(PlanSchema).refine(v => v.length <= 100, "Too many items"),
  "page": PageSchema,
});
export type PlanList = z.infer<typeof PlanListSchema>;
