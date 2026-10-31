import { z } from "zod";
import { DeleteResultSchema } from "./delete-result";
import { MetaSchema } from "./meta";

export const DeleteResultResponseSchema = z.strictObject({
  "success": z.literal(true),
  "data": DeleteResultSchema,
  "error": z.null(),
  "meta": MetaSchema,
});
export type DeleteResultResponse = z.infer<typeof DeleteResultResponseSchema>;
