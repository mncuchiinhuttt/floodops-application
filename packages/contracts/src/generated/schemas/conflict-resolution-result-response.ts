import { z } from "zod";
import { ConflictResolutionResultSchema } from "./conflict-resolution-result";
import { MetaSchema } from "./meta";

export const ConflictResolutionResultResponseSchema = z.strictObject({
  "success": z.literal(true),
  "data": ConflictResolutionResultSchema,
  "error": z.null(),
  "meta": MetaSchema,
});
export type ConflictResolutionResultResponse = z.infer<typeof ConflictResolutionResultResponseSchema>;
