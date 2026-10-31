import { z } from "zod";
import { IdSchema } from "../schemas/id";
import { ImageReviewJobInputSchema } from "../schemas/image-review-job-input";
import { ImageReviewJobResponseSchema } from "../schemas/image-review-job-response";

export const createReportImageReview = {
  id: "createReportImageReview", method: "POST",
  path: "/sessions/{session_id}/reports/{report_id}/image-review-jobs", roles: ["dispatcher"],
  requiresRevision: false, idempotent: true,
  input: z.strictObject({
  "path": z.strictObject({
  "session_id": IdSchema,
  "report_id": IdSchema,
}),
  "query": z.strictObject({

}).optional(),
  "headers": z.strictObject({
  "Idempotency-Key": z.string().refine(v => [...v].length >= 16, "String too short").refine(v => [...v].length <= 128, "String too long"),
  "X-CSRF-Token": z.string().refine(v => [...v].length >= 32, "String too short").refine(v => [...v].length <= 512, "String too long").optional(),
}),
  "body": ImageReviewJobInputSchema,
}),
  responses: { 202: ImageReviewJobResponseSchema },
  statuses: [202], errorStatuses: [400,401,403,404,409,410,422,429,503],
  responseKind: "json", mediaTypes: ["application/json"],
} as const;
export type CreateReportImageReviewInput = z.infer<typeof createReportImageReview.input>;
export type CreateReportImageReviewOutput = z.infer<typeof createReportImageReview.responses[202]>;
