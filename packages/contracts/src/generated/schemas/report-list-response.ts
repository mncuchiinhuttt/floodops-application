import { z } from "zod";
import { MetaSchema } from "./meta";
import { ReportListSchema } from "./report-list";

export const ReportListResponseSchema = z.strictObject({
  "success": z.literal(true),
  "data": ReportListSchema,
  "error": z.null(),
  "meta": MetaSchema,
});
export type ReportListResponse = z.infer<typeof ReportListResponseSchema>;
