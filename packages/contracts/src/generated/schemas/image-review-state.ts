import { z } from "zod";
import { IdSchema } from "./id";
import { ImageReviewJobSchema } from "./image-review-job";

export const ImageReviewStateSchema = z.strictObject({
  "report_id": IdSchema,
  "job": z.union([ImageReviewJobSchema, z.null()]),
});
export type ImageReviewState = z.infer<typeof ImageReviewStateSchema>;
