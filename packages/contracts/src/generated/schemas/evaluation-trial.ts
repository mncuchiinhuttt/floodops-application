import { z } from "zod";
import { ErrorCodeSchema } from "./error-code";
import { IdSchema } from "./id";

export const EvaluationTrialSchema = z.strictObject({
  "trial": z.number().finite().refine(Number.isInteger, "Expected integer").min(1).max(10),
  "first_proposal_valid": z.boolean(),
  "latency_ms": z.union([z.number().finite().min(0), z.null()]),
  "failed": z.boolean(),
  "error_code": z.union([ErrorCodeSchema, z.null()]),
  "plan_id": z.union([IdSchema, z.null()]),
  "model_config_hash": z.string().refine(v => [...v].length <= 128, "String too long"),
});
export type EvaluationTrial = z.infer<typeof EvaluationTrialSchema>;
