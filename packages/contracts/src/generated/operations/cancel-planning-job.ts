import { z } from "zod";
import { IdSchema } from "../schemas/id";
import { PlanningJobResponseSchema } from "../schemas/planning-job-response";

export const cancelPlanningJob = {
  id: "cancelPlanningJob", method: "POST",
  path: "/sessions/{session_id}/planning-jobs/{job_id}/cancellations", roles: ["dispatcher"],
  requiresRevision: false, idempotent: true,
  input: z.strictObject({
  "path": z.strictObject({
  "session_id": IdSchema,
  "job_id": IdSchema,
}),
  "query": z.strictObject({

}).optional(),
  "headers": z.strictObject({
  "Idempotency-Key": z.string().refine(v => [...v].length >= 16, "String too short").refine(v => [...v].length <= 128, "String too long"),
  "X-CSRF-Token": z.string().refine(v => [...v].length >= 32, "String too short").refine(v => [...v].length <= 512, "String too long").optional(),
}),
}),
  responses: { 200: PlanningJobResponseSchema },
  statuses: [200], errorStatuses: [400,401,403,404,409,410,412,413,415,422,428,429,503],
  responseKind: "json", mediaTypes: ["application/json"],
} as const;
export type CancelPlanningJobInput = z.infer<typeof cancelPlanningJob.input>;
export type CancelPlanningJobOutput = z.infer<typeof cancelPlanningJob.responses[200]>;
