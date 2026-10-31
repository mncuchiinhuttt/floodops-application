import { z } from "zod";
import { ApiErrorSchema } from "./api-error";
import { MetaSchema } from "./meta";

export const ErrorResponseSchema = z.strictObject({
  "success": z.literal(false),
  "data": z.null(),
  "error": ApiErrorSchema,
  "meta": MetaSchema,
});
export type ErrorResponse = z.infer<typeof ErrorResponseSchema>;
