import { z } from "zod";
import { ImageReviewStateSchema } from "./image-review-state";
import { MetaSchema } from "./meta";

export const ImageReviewStateResponseSchema = z.strictObject({
  "success": z.literal(true),
  "data": ImageReviewStateSchema,
  "error": z.null(),
  "meta": MetaSchema,
});
export type ImageReviewStateResponse = z.infer<typeof ImageReviewStateResponseSchema>;
