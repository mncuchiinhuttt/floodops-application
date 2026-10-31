import { z } from "zod";
import { MetaSchema } from "./meta";
import { SourceListSchema } from "./source-list";

export const SourceListResponseSchema = z.strictObject({
  "success": z.literal(true),
  "data": SourceListSchema,
  "error": z.null(),
  "meta": MetaSchema,
});
export type SourceListResponse = z.infer<typeof SourceListResponseSchema>;
