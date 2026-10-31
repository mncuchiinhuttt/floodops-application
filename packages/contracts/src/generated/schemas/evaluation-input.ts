import { z } from "zod";
import { IdSchema } from "./id";

export const EvaluationInputSchema = z.strictObject({
  "kind": z.literal(["model_quality","latency_rehearsal"]),
  "runs": z.literal(10),
  "scenario_id": IdSchema,
  "scenario_version": z.string().refine(v => [...v].length <= 80, "String too long"),
});
export type EvaluationInput = z.infer<typeof EvaluationInputSchema>;
