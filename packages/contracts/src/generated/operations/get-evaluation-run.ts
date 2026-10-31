import { z } from "zod";
import { EvaluationRunResponseSchema } from "../schemas/evaluation-run-response";
import { IdSchema } from "../schemas/id";

export const getEvaluationRun = {
  id: "getEvaluationRun", method: "GET",
  path: "/sessions/{session_id}/evaluation-runs/{evaluation_id}", roles: ["dispatcher"],
  requiresRevision: false, idempotent: false,
  input: z.strictObject({
  "path": z.strictObject({
  "session_id": IdSchema,
  "evaluation_id": IdSchema,
}),
  "query": z.strictObject({

}).optional(),
  "headers": z.strictObject({

}).optional(),
}),
  responses: { 200: EvaluationRunResponseSchema },
  statuses: [200], errorStatuses: [400,401,403,404,409,410,412,413,415,422,428,429,503],
  responseKind: "json", mediaTypes: ["application/json"],
} as const;
export type GetEvaluationRunInput = z.infer<typeof getEvaluationRun.input>;
export type GetEvaluationRunOutput = z.infer<typeof getEvaluationRun.responses[200]>;
