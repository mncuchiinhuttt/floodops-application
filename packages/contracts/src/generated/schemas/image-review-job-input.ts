import { z } from "zod";

export const ImageReviewJobInputSchema = z.strictObject({

}).refine(v => Object.keys(v).length <= 0, "Too many properties").describe("Explicit request body must be exactly {}. Image, model, report identity, ratings, score, status, role, and threshold are server-controlled and not accepted from clients.");
export type ImageReviewJobInput = z.infer<typeof ImageReviewJobInputSchema>;
