import { z } from "zod";

export const HealthSchema = z.strictObject({
  "status": z.literal(["ok"]),
  "version": z.string().refine(v => [...v].length <= 80, "String too long"),
  "environment": z.literal(["development","preview","production"]),
});
export type Health = z.infer<typeof HealthSchema>;
