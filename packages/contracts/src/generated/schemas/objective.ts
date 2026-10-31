import { z } from "zod";

export const ObjectiveSchema = z.strictObject({
  "critical_unreachable": z.number().finite().refine(Number.isInteger, "Expected integer").min(0),
  "critical_late": z.number().finite().refine(Number.isInteger, "Expected integer").min(0),
  "critical_delay_minute": z.number().finite().min(0),
  "food_late": z.number().finite().refine(Number.isInteger, "Expected integer").min(0),
  "total_late": z.number().finite().refine(Number.isInteger, "Expected integer").min(0),
  "total_delay_minute": z.number().finite().min(0),
  "total_unreachable": z.number().finite().refine(Number.isInteger, "Expected integer").min(0),
});
export type Objective = z.infer<typeof ObjectiveSchema>;
