import { z } from "zod";
import { ImageReviewQualityRatingsSchema } from "./image-review-quality-ratings";

export const ImageReviewModelOutputSchema = z.strictObject({
  "quality_ratings": ImageReviewQualityRatingsSchema,
  "visible_summary": z.string().refine(v => [...v].length >= 1, "String too short").refine(v => [...v].length <= 600, "String too long"),
  "report_match": z.literal(["yes","no","unclear"]),
  "mismatch_notes": z.array(z.string().refine(v => [...v].length >= 1, "String too short").refine(v => [...v].length <= 200, "String too long")).refine(v => v.length >= 0, "Too few items").refine(v => v.length <= 5, "Too many items"),
  "reasons": z.array(z.string().refine(v => [...v].length >= 1, "String too short").refine(v => [...v].length <= 200, "String too long")).refine(v => v.length >= 1, "Too few items").refine(v => v.length <= 5, "Too many items"),
}).describe("Strict model-only output. quality_score, recommendation, confidence, condition, points, accept/reject, and execute fields are forbidden; unknown fields are rejected.");
export type ImageReviewModelOutput = z.infer<typeof ImageReviewModelOutputSchema>;
