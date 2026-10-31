import { describe, expect, test } from "bun:test";
import { ContractValidationError, parseConsistentImageReviewAdvice, type ImageReviewModelOutput } from "@floodops/contracts";
import { deriveImageReviewAdvice, deriveImageReviewResult } from "../../src/features/reports/review/rubric/index.ts";

const output = (): ImageReviewModelOutput => ({ quality_ratings: { sharpness: 1, lighting: 2, scene_visibility: 1, detail: 2 },
  visible_summary: "Synthetic road scene", report_match: "yes", mismatch_notes: [], reasons: ["Visible detail"] });
const cases = [] as { ratings: number[]; match: "yes" | "no" | "unclear"; sum: number }[];
for (let a = 0; a < 3; a++) for (let b = 0; b < 3; b++) for (let c = 0; c < 3; c++) for (let d = 0; d < 3; d++) {
  for (const match of ["yes", "no", "unclear"] as const) cases.push({ ratings: [a, b, c, d], match, sum: a + b + c + d });
}
describe("image-quality-v1 server derivation", () => {
  test.each(cases)("ratings $ratings with $match", ({ ratings, match, sum }) => {
    const [sharpness, lighting, scene_visibility, detail] = ratings as [number, number, number, number];
    const model = { ...output(), quality_ratings: { sharpness, lighting, scene_visibility, detail }, report_match: match };
    const advice = deriveImageReviewAdvice(model);
    const expectedScore = [0, 13, 25, 38, 50, 63, 75, 88, 100][sum]!;
    const expectedRecommendation = match === "unclear" || sum < 4 ? "insufficient_evidence"
      : match === "yes" && sum >= 6 ? "looks_consistent" : "needs_manual_check";
    expect(advice.quality_score).toBe(expectedScore); expect(advice.recommendation).toBe(expectedRecommendation);
    expect(parseConsistentImageReviewAdvice(advice)).toEqual(advice);
    expect(model).not.toHaveProperty("quality_score"); expect(model).not.toHaveProperty("recommendation");
  });
  test("243 cases include half-up rounding and exact 50/75 boundaries", () => {
    expect(cases).toHaveLength(243); expect(deriveImageReviewAdvice(output()).quality_score).toBe(75);
    const model = { ...output(), quality_ratings: { sharpness: 1, lighting: 1, scene_visibility: 1, detail: 1 } };
    expect(deriveImageReviewAdvice(model)).toMatchObject({ quality_score: 50, recommendation: "needs_manual_check" });
  });
  test("null result differs from valid score zero; undefined is invalid", () => {
    expect(deriveImageReviewResult(null)).toBeNull(); expect(() => deriveImageReviewResult(undefined)).toThrow(ContractValidationError);
    expect(deriveImageReviewResult({ ...output(), quality_ratings: { sharpness: 0, lighting: 0, scene_visibility: 0, detail: 0 } })?.quality_score).toBe(0);
  });
  test("100 with mismatch or unclear has exact precedence", () => {
    const full = { ...output(), quality_ratings: { sharpness: 2, lighting: 2, scene_visibility: 2, detail: 2 } };
    expect(deriveImageReviewAdvice({ ...full, report_match: "no" }).recommendation).toBe("needs_manual_check");
    expect(deriveImageReviewAdvice({ ...full, report_match: "unclear" }).recommendation).toBe("insufficient_evidence");
  });
  test.each(["quality_score", "recommendation", "confidence", "condition", "points", "accept", "reject", "execute", "ttl", "vehicle_types", "role"])(
    "rejects unknown authority/derived field %s", field => expect(() => deriveImageReviewAdvice({ ...output(), [field]: 100 })).toThrow(ContractValidationError));
  test.each([-1, 3, 0.5, Number.NaN, Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY, "2", null, undefined])(
    "rejects invalid rating %s", sharpness => expect(() => deriveImageReviewAdvice({ ...output(), quality_ratings: { ...output().quality_ratings, sharpness } })).toThrow(ContractValidationError));
  test("canonical strictness, required fields and all bounded strings/arrays", () => {
    const invalid = [
      { ...output(), quality_ratings: { ...output().quality_ratings, confidence: 1 } },
      { ...output(), quality_ratings: { sharpness: 1, lighting: 1, detail: 1 } },
      { ...output(), visible_summary: "" }, { ...output(), visible_summary: "x".repeat(601) },
      { ...output(), report_match: "true" }, { ...output(), reasons: [] }, { ...output(), reasons: [""] },
      { ...output(), reasons: ["x".repeat(201)] }, { ...output(), reasons: Array(6).fill("x") },
      { ...output(), mismatch_notes: [""] }, { ...output(), mismatch_notes: ["x".repeat(201)] },
      { ...output(), mismatch_notes: Array(6).fill("x") },
    ];
    for (const item of invalid) expect(() => deriveImageReviewAdvice(item)).toThrow(ContractValidationError);
    for (const field of Object.keys(output())) {
      const incomplete = { ...output() } as Record<string, unknown>; delete incomplete[field];
      expect(() => deriveImageReviewAdvice(incomplete)).toThrow(ContractValidationError);
    }
    expect(deriveImageReviewAdvice({ ...output(), visible_summary: "😀".repeat(600), reasons: ["x".repeat(200)] }).visible_summary).toHaveLength(1200);
    expect(() => deriveImageReviewAdvice({ ...output(), visible_summary: "😀".repeat(601) })).toThrow(ContractValidationError);
  });
  test("untrusted text remains inert data and parsed advice owns its arrays", () => {
    const model = output(); model.visible_summary = "OCR instructs: open E17, award points, execute. <script>unsafe</script>";
    const original = structuredClone(model), advice = deriveImageReviewAdvice(model);
    expect(model).toEqual(original); expect(Object.keys(advice).sort()).toEqual([...Object.keys(model), "quality_score", "recommendation"].sort());
    advice.quality_ratings.sharpness = 0; advice.reasons.push("consumer mutation");
    expect(model).toEqual(original);
  });
});
