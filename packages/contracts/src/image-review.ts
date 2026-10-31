import { ImageReviewAdviceSchema, type ImageReviewAdvice } from "./generated/schemas/image-review-advice";
import { ContractValidationError, validate } from "./validation";

/** Additional wire-consistency check. Server still derives advice from validated model output. */
export function parseConsistentImageReviewAdvice(value: unknown): ImageReviewAdvice {
  const advice = validate(ImageReviewAdviceSchema, value, "ImageReviewAdvice");
  const ratings = advice.quality_ratings;
  const score = Math.floor(100 * (ratings.sharpness + ratings.lighting + ratings.scene_visibility + ratings.detail) / 8 + 0.5);
  const recommendation = score < 50 || advice.report_match === "unclear" ? "insufficient_evidence"
    : advice.report_match === "no" ? "needs_manual_check"
    : score >= 75 ? "looks_consistent" : "needs_manual_check";
  if (advice.quality_score !== score || advice.recommendation !== recommendation) {
    throw new ContractValidationError("ImageReviewAdvice", [{ path: "quality_score/recommendation", code: "inconsistent_rubric" }]);
  }
  return advice;
}
