import { z } from "zod";
import { ConflictListSchema } from "./conflict-list";
import { MetaSchema } from "./meta";

export const ConflictListResponseSchema = z.strictObject({
  "success": z.literal(true),
  "data": ConflictListSchema,
  "error": z.null(),
  "meta": MetaSchema,
});
export type ConflictListResponse = z.infer<typeof ConflictListResponseSchema>;
