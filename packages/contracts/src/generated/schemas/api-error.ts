import { z } from "zod";
import { ErrorCodeSchema } from "./error-code";
import { ErrorDetailSchema } from "./error-detail";
import { IdSchema } from "./id";

export const ApiErrorSchema = z.strictObject({
  "code": ErrorCodeSchema,
  "message": z.string().refine(v => [...v].length <= 2000, "String too long"),
  "details": z.array(ErrorDetailSchema).refine(v => v.length <= 100, "Too many items"),
  "retryable": z.boolean(),
  "current_revision": z.union([z.number().finite().refine(Number.isInteger, "Expected integer").min(0), z.null()]),
  "replacement_session_id": z.union([IdSchema, z.null()]),
});
export type ApiError = z.infer<typeof ApiErrorSchema>;
