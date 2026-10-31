import { z } from "zod";
import { MetaSchema } from "./meta";
import { ResetResultSchema } from "./reset-result";

export const ResetResultResponseSchema = z.strictObject({
  "success": z.literal(true),
  "data": ResetResultSchema,
  "error": z.null(),
  "meta": MetaSchema,
});
export type ResetResultResponse = z.infer<typeof ResetResultResponseSchema>;
