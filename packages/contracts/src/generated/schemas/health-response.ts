import { z } from "zod";
import { HealthSchema } from "./health";
import { MetaSchema } from "./meta";

export const HealthResponseSchema = z.strictObject({
  "success": z.literal(true),
  "data": HealthSchema,
  "error": z.null(),
  "meta": MetaSchema,
});
export type HealthResponse = z.infer<typeof HealthResponseSchema>;
