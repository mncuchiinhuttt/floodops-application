import { z } from "zod";
import { GapListSchema } from "./gap-list";
import { MetaSchema } from "./meta";

export const GapListResponseSchema = z.strictObject({
  "success": z.literal(true),
  "data": GapListSchema,
  "error": z.null(),
  "meta": MetaSchema,
});
export type GapListResponse = z.infer<typeof GapListResponseSchema>;
