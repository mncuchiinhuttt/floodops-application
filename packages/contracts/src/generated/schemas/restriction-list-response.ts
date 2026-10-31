import { z } from "zod";
import { MetaSchema } from "./meta";
import { RestrictionListSchema } from "./restriction-list";

export const RestrictionListResponseSchema = z.strictObject({
  "success": z.literal(true),
  "data": RestrictionListSchema,
  "error": z.null(),
  "meta": MetaSchema,
});
export type RestrictionListResponse = z.infer<typeof RestrictionListResponseSchema>;
