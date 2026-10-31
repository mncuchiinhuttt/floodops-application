import { z } from "zod";
import { ImageReviewJobSchema } from "./image-review-job";
import { MetaSchema } from "./meta";

export const ImageReviewJobResponseSchema = z.strictObject({
  "success": z.literal(true),
  "data": ImageReviewJobSchema,
  "error": z.null(),
  "meta": MetaSchema,
});
export type ImageReviewJobResponse = z.infer<typeof ImageReviewJobResponseSchema>;
