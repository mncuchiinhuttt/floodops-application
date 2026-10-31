import { z } from "zod";
import { MetaSchema } from "./meta";
import { ReportReviewResultSchema } from "./report-review-result";

export const ReportReviewResultResponseSchema = z.strictObject({
  "success": z.literal(true),
  "data": ReportReviewResultSchema,
  "error": z.null(),
  "meta": MetaSchema,
});
export type ReportReviewResultResponse = z.infer<typeof ReportReviewResultResponseSchema>;
