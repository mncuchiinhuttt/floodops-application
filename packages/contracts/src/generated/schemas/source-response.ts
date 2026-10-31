import { z } from "zod";
import { MetaSchema } from "./meta";
import { SourceSchema } from "./source";

export const SourceResponseSchema = z.strictObject({
  "success": z.literal(true),
  "data": SourceSchema,
  "error": z.null(),
  "meta": MetaSchema,
});
export type SourceResponse = z.infer<typeof SourceResponseSchema>;
