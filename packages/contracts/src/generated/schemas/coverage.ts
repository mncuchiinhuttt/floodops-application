import { z } from "zod";

export const CoverageSchema = z.strictObject({
  "covered_pairs": z.number().finite().refine(Number.isInteger, "Expected integer").min(0),
  "relevant_pairs": z.number().finite().refine(Number.isInteger, "Expected integer").min(0),
  "ratio": z.union([z.number().finite().min(0).max(1), z.null()]),
});
export type Coverage = z.infer<typeof CoverageSchema>;
