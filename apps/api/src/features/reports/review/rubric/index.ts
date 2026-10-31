import { ImageReviewModelOutputSchema, validate } from "@floodops/contracts";
import type { ImageReviewAdvice } from "@floodops/contracts";

/** Pure server derivation. This advisory output has no review or reward authority. */
export function deriveImageReviewAdvice(value: unknown): ImageReviewAdvice {
  const output = validate(ImageReviewModelOutputSchema, value, "ImageReviewModelOutput");
  const ratings = output.quality_ratings;
  const sum = ratings.sharpness + ratings.lighting + ratings.scene_visibility + ratings.detail;
  const quality_score = Math.floor(100 * sum / 8 + 0.5);
  const recommendation = quality_score < 50 || output.report_match === "unclear" ? "insufficient_evidence"
    : output.report_match === "no" ? "needs_manual_check"
    : quality_score >= 75 ? "looks_consistent" : "needs_manual_check";
  return { ...output, quality_score, recommendation };
}

/** Absence is distinct from a valid all-zero quality rubric. */
export function deriveImageReviewResult(value: unknown): ImageReviewAdvice | null {
  return value === null ? null : deriveImageReviewAdvice(value);
}
