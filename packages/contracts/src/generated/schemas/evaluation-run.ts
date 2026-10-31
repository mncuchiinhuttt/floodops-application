import { z } from "zod";
import { EvaluationTrialSchema } from "./evaluation-trial";
import { IdSchema } from "./id";

export const EvaluationRunSchema = z.strictObject({
  "evaluation_id": IdSchema,
  "status": z.literal(["queued","running","completed","failed"]),
  "kind": z.literal(["model_quality","latency_rehearsal"]),
  "trials": z.array(EvaluationTrialSchema).refine(v => v.length <= 10, "Too many items"),
  "valid_first_proposals": z.number().finite().refine(Number.isInteger, "Expected integer").min(0).max(10),
  "p95_ms": z.union([z.number().finite().min(0), z.null()]),
  "is_real_model": z.boolean(),
});
export type EvaluationRun = z.infer<typeof EvaluationRunSchema>;
