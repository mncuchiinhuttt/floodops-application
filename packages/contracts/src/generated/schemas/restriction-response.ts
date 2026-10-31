import { z } from "zod";
import { MetaSchema } from "./meta";
import { RestrictionSchema } from "./restriction";

export const RestrictionResponseSchema = z.strictObject({
  "success": z.literal(true),
  "data": RestrictionSchema,
  "error": z.null(),
  "meta": MetaSchema,
});
export type RestrictionResponse = z.infer<typeof RestrictionResponseSchema>;
