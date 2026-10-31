import { z } from "zod";
import { ExecutionSchema } from "./execution";
import { MetaSchema } from "./meta";

export const ExecutionResponseSchema = z.strictObject({
  "success": z.literal(true),
  "data": ExecutionSchema,
  "error": z.null(),
  "meta": MetaSchema,
});
export type ExecutionResponse = z.infer<typeof ExecutionResponseSchema>;
