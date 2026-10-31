import { z } from "zod";
import { CandidateInputSchema } from "../schemas/candidate-input";
import { ExecutionResponseSchema } from "../schemas/execution-response";
import { IdSchema } from "../schemas/id";

export const executePlan = {
  id: "executePlan", method: "POST",
  path: "/sessions/{session_id}/plans/{plan_id}/executions", roles: ["dispatcher"],
  requiresRevision: true, idempotent: true,
  input: z.strictObject({
  "path": z.strictObject({
  "session_id": IdSchema,
  "plan_id": IdSchema,
}),
  "query": z.strictObject({

}).optional(),
  "headers": z.strictObject({
  "If-Match": z.string().regex(new RegExp("^\"s:[A-Za-z0-9_-]+:g:[0-9]+:r:[0-9]+\"$")),
  "Idempotency-Key": z.string().refine(v => [...v].length >= 16, "String too short").refine(v => [...v].length <= 128, "String too long"),
  "X-CSRF-Token": z.string().refine(v => [...v].length >= 32, "String too short").refine(v => [...v].length <= 512, "String too long").optional(),
}),
  "body": CandidateInputSchema,
}),
  responses: { 201: ExecutionResponseSchema },
  statuses: [201], errorStatuses: [400,401,403,404,409,410,412,413,415,422,428,429,503],
  responseKind: "json", mediaTypes: ["application/json"],
} as const;
export type ExecutePlanInput = z.infer<typeof executePlan.input>;
export type ExecutePlanOutput = z.infer<typeof executePlan.responses[201]>;
