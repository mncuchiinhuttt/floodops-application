import { z } from "zod";
import { EvaluationInputSchema } from "../schemas/evaluation-input";
import { EvaluationRunResponseSchema } from "../schemas/evaluation-run-response";
import { IdSchema } from "../schemas/id";

export const createEvaluationRun = {
  id: "createEvaluationRun", method: "POST",
  path: "/sessions/{session_id}/evaluation-runs", roles: ["dispatcher"],
  requiresRevision: false, idempotent: true,
  input: z.strictObject({
  "path": z.strictObject({
  "session_id": IdSchema,
}),
  "query": z.strictObject({

}).optional(),
  "headers": z.strictObject({
  "Idempotency-Key": z.string().refine(v => [...v].length >= 16, "String too short").refine(v => [...v].length <= 128, "String too long"),
  "X-CSRF-Token": z.string().refine(v => [...v].length >= 32, "String too short").refine(v => [...v].length <= 512, "String too long").optional(),
}),
  "body": EvaluationInputSchema,
}),
  responses: { 202: EvaluationRunResponseSchema },
  statuses: [202], errorStatuses: [400,401,403,404,409,410,412,413,415,422,428,429,503],
  responseKind: "json", mediaTypes: ["application/json"],
} as const;
export type CreateEvaluationRunInput = z.infer<typeof createEvaluationRun.input>;
export type CreateEvaluationRunOutput = z.infer<typeof createEvaluationRun.responses[202]>;
