import { z } from "zod";
import { EvaluationRunSchema } from "./evaluation-run";
import { MetaSchema } from "./meta";

export const EvaluationRunResponseSchema = z.strictObject({
  "success": z.literal(true),
  "data": EvaluationRunSchema,
  "error": z.null(),
  "meta": MetaSchema,
});
export type EvaluationRunResponse = z.infer<typeof EvaluationRunResponseSchema>;
