import { z } from "zod";
import { IdSchema } from "../schemas/id";
import { ImageReviewStateResponseSchema } from "../schemas/image-review-state-response";

export const getReportImageReview = {
  id: "getReportImageReview", method: "GET",
  path: "/sessions/{session_id}/reports/{report_id}/image-review", roles: ["dispatcher"],
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
  responses: { 200: ImageReviewStateResponseSchema },
  statuses: [200], errorStatuses: [400,401,403,404,410,429,503],
  responseKind: "json", mediaTypes: ["application/json"],
} as const;
export type GetReportImageReviewInput = z.infer<typeof getReportImageReview.input>;
export type GetReportImageReviewOutput = z.infer<typeof getReportImageReview.responses[200]>;
