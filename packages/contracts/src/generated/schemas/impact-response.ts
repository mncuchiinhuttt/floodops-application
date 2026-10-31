import { z } from "zod";
import { ImpactSchema } from "./impact";
import { MetaSchema } from "./meta";

export const ImpactResponseSchema = z.strictObject({
  "success": z.literal(true),
  "data": ImpactSchema,
  "error": z.null(),
  "meta": MetaSchema,
});
export type ImpactResponse = z.infer<typeof ImpactResponseSchema>;
