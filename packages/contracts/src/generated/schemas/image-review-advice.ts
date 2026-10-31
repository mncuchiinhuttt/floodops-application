import { z } from "zod";
import { ImageReviewQualityRatingsSchema } from "./image-review-quality-ratings";

export const ImageReviewAdviceSchema = z.strictObject({
  "quality_ratings": ImageReviewQualityRatingsSchema,
  "visible_summary": z.string().refine(v => [...v].length >= 1, "String too short").refine(v => [...v].length <= 600, "String too long"),
  "report_match": z.literal(["yes","no","unclear"]),
  "mismatch_notes": z.array(z.string().refine(v => [...v].length >= 1, "String too short").refine(v => [...v].length <= 200, "String too long")).refine(v => v.length >= 0, "Too few items").refine(v => v.length <= 5, "Too many items"),
  "reasons": z.array(z.string().refine(v => [...v].length >= 1, "String too short").refine(v => [...v].length <= 200, "String too long")).refine(v => v.length >= 1, "Too few items").refine(v => v.length <= 5, "Too many items"),
  "quality_score": z.number().finite().refine(Number.isInteger, "Expected integer").min(0).max(100).describe("Server-derived ordinal image-quality score, not a calibrated probability or safety percentage."),
  "recommendation": z.literal(["looks_consistent","needs_manual_check","insufficient_evidence"]),
}).describe("Flat strict server advice schema. quality_score is derived as floor(100 * sum(quality_ratings) / 8 + 0.5); recommendation is server-derived by image-quality-v1: score<50 or match=unclear => insufficient_evidence; otherwise match=no => needs_manual_check; otherwise score>=75 => looks_consistent; otherwise needs_manual_check. Score is an ordinal image-quality rubric score, not probability, observation confidence, authenticity, or safe-road percentage. JSON shape alone does not establish score/recommendation consistency; the server must recompute both.");
export type ImageReviewAdvice = z.infer<typeof ImageReviewAdviceSchema>;
