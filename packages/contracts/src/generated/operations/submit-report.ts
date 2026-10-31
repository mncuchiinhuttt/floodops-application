import { z } from "zod";
import { IdSchema } from "../schemas/id";
import { ReportResponseSchema } from "../schemas/report-response";
import { SubmitReportInputSchema } from "../schemas/submit-report-input";

export const submitReport = {
  id: "submitReport", method: "POST",
  path: "/sessions/{session_id}/reports", roles: ["dispatcher","driver","contributor"],
  requiresRevision: true, idempotent: true,
  input: z.strictObject({
  "path": z.strictObject({
  "session_id": IdSchema,
}),
  "query": z.strictObject({

}).optional(),
  "headers": z.strictObject({
  "If-Match": z.string().regex(new RegExp("^\"s:[A-Za-z0-9_-]+:g:[0-9]+:r:[0-9]+\"$")),
  "Idempotency-Key": z.string().refine(v => [...v].length >= 16, "String too short").refine(v => [...v].length <= 128, "String too long"),
  "X-CSRF-Token": z.string().refine(v => [...v].length >= 32, "String too short").refine(v => [...v].length <= 512, "String too long").optional(),
}),
  "body": SubmitReportInputSchema,
}),
  responses: { 201: ReportResponseSchema },
  statuses: [201], errorStatuses: [400,401,403,404,409,410,412,413,415,422,428,429,503],
  responseKind: "json", mediaTypes: ["application/json"],
} as const;
export type SubmitReportInput = z.infer<typeof submitReport.input>;
export type SubmitReportOutput = z.infer<typeof submitReport.responses[201]>;
