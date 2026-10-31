import { expect, test } from "bun:test";
import { ImageReviewJobSchema, ImageReviewModelOutputSchema, parseConsistentImageReviewAdvice } from "../src";
const model = { quality_ratings: { sharpness: 1, lighting: 2, scene_visibility: 1, detail: 2 },
  visible_summary: "Visible road surface", report_match: "yes", mismatch_notes: [], reasons: ["Scene visible"] } as const;
const advice = { ...model, quality_score: 75, recommendation: "looks_consistent" };
const time = "2026-10-31T10:00:00Z";
const job = { job_id: "job_review0001", session_id: "session_test0001", generation: 0,
  report_id: "report_test0001", input_digest: "a".repeat(64), model: "configured-model",
  model_config_hash: "b".repeat(64), rubric_version: "image-quality-v1", status: "queued",
  result: null, error_code: null, created_at: time, deadline_at: time, completed_at: null };
test("job lifecycle enforces all result/error/completed-at combinations", () => {
  for (const status of ["queued", "running", "completed", "failed", "superseded"]) {
    for (const result of [null, advice]) for (const error_code of [null, "MODEL_TIMEOUT"]) for (const completed_at of [null, time]) {
      const valid = status === "completed" ? result !== null && error_code === null && completed_at !== null
        : status === "failed" ? result === null && error_code !== null && completed_at !== null
        : status === "superseded" ? result === null && error_code === null && completed_at !== null
        : result === null && error_code === null && completed_at === null;
      expect(ImageReviewJobSchema.safeParse({ ...job, status, result, error_code, completed_at }).success).toBe(valid);
    }
  }
  expect(ImageReviewJobSchema.safeParse({ ...job, points: 1 }).success).toBe(false);
  expect(ImageReviewJobSchema.safeParse({ ...job, input_digest: "A".repeat(64) }).success).toBe(false);
});
test("model-only output rejects authority, derived fields and invalid nested ratings", () => {
  expect(ImageReviewModelOutputSchema.safeParse(model).success).toBe(true);
  for (const key of ["quality_score", "recommendation", "confidence", "condition", "points", "accept", "reject", "execute"]) {
    expect(ImageReviewModelOutputSchema.safeParse({ ...model, [key]: 1 }).success).toBe(false);
  }
  for (const sharpness of [-1, 3, 0.5, NaN, Infinity, null]) {
    expect(ImageReviewModelOutputSchema.safeParse({ ...model, quality_ratings: { ...model.quality_ratings, sharpness } }).success).toBe(false);
  }
  expect(ImageReviewModelOutputSchema.safeParse({ ...model, quality_ratings: { ...model.quality_ratings, safe: true } }).success).toBe(false);
  expect(ImageReviewModelOutputSchema.safeParse({ ...model, visible_summary: "🌧".repeat(600) }).success).toBe(true);
  expect(ImageReviewModelOutputSchema.safeParse({ ...model, visible_summary: "🌧".repeat(601) }).success).toBe(false);
  expect(ImageReviewModelOutputSchema.safeParse({ ...model, reasons: [] }).success).toBe(false);
});
test("all 243 rubric/match combinations agree with independent rounding table", () => {
  const expectedScores = [0, 13, 25, 38, 50, 63, 75, 88, 100];
  for (let a = 0; a <= 2; a++) for (let b = 0; b <= 2; b++) for (let c = 0; c <= 2; c++) for (let d = 0; d <= 2; d++) {
    for (const match of ["yes", "no", "unclear"]) {
      const quality_score = expectedScores[a + b + c + d]!;
      const recommendation = match === "unclear" || a + b + c + d < 4 ? "insufficient_evidence"
        : match === "yes" && a + b + c + d >= 6 ? "looks_consistent" : "needs_manual_check";
      const value = { ...model, quality_ratings: { sharpness: a, lighting: b, scene_visibility: c, detail: d }, report_match: match, quality_score, recommendation };
      expect(parseConsistentImageReviewAdvice(value).quality_score).toBe(quality_score);
      expect(() => parseConsistentImageReviewAdvice({ ...value, quality_score: quality_score === 100 ? 99 : quality_score + 1 })).toThrow();
      expect(() => parseConsistentImageReviewAdvice({ ...value, recommendation: recommendation === "looks_consistent" ? "needs_manual_check" : "looks_consistent" })).toThrow();
    }
  }
});
