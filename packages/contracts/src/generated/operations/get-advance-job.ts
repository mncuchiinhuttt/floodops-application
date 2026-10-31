import { z } from "zod";
import { AdvanceJobResponseSchema } from "../schemas/advance-job-response";
import { IdSchema } from "../schemas/id";

export const getAdvanceJob = {
  id: "getAdvanceJob", method: "GET",
  path: "/sessions/{session_id}/simulation/advances/{advance_job_id}", roles: ["dispatcher"],
  requiresRevision: false, idempotent: false,
  input: z.strictObject({
  "path": z.strictObject({
  "session_id": IdSchema,
  "advance_job_id": IdSchema,
}),
  "query": z.strictObject({

}).optional(),
  "headers": z.strictObject({

}).optional(),
}),
  responses: { 200: AdvanceJobResponseSchema },
  statuses: [200], errorStatuses: [400,401,403,404,409,410,412,413,415,422,428,429,503],
  responseKind: "json", mediaTypes: ["application/json"],
} as const;
export type GetAdvanceJobInput = z.infer<typeof getAdvanceJob.input>;
export type GetAdvanceJobOutput = z.infer<typeof getAdvanceJob.responses[200]>;
