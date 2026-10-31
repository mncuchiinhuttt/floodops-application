import { z } from "zod";
import { IdSchema } from "../schemas/id";
import { ReportResponseSchema } from "../schemas/report-response";

export const getReport = {
  id: "getReport", method: "GET",
  path: "/sessions/{session_id}/reports/{report_id}", roles: ["dispatcher","driver","contributor"],
  requiresRevision: false, idempotent: false,
  input: z.strictObject({
  "path": z.strictObject({
  "session_id": IdSchema,
  "report_id": IdSchema,
}),
  "query": z.strictObject({

}).optional(),
  "headers": z.strictObject({

}).optional(),
}),
  responses: { 200: ReportResponseSchema },
  statuses: [200], errorStatuses: [400,401,403,404,409,410,412,413,415,422,428,429,503],
  responseKind: "json", mediaTypes: ["application/json"],
} as const;
export type GetReportInput = z.infer<typeof getReport.input>;
export type GetReportOutput = z.infer<typeof getReport.responses[200]>;
