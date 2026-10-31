import { z } from "zod";
import { CandidateInputSchema } from "../schemas/candidate-input";
import { DryRunResultResponseSchema } from "../schemas/dry-run-result-response";
import { IdSchema } from "../schemas/id";

export const dryRunPlan = {
  id: "dryRunPlan", method: "POST",
  path: "/sessions/{session_id}/plans/{plan_id}/dry-runs", roles: ["dispatcher"],
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
  responses: { 200: DryRunResultResponseSchema },
  statuses: [200], errorStatuses: [400,401,403,404,409,410,412,413,415,422,428,429,503],
  responseKind: "json", mediaTypes: ["application/json"],
} as const;
export type DryRunPlanInput = z.infer<typeof dryRunPlan.input>;
export type DryRunPlanOutput = z.infer<typeof dryRunPlan.responses[200]>;
