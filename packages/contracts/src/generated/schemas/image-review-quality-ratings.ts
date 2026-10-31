import { z } from "zod";

export const ImageReviewQualityRatingsSchema = z.strictObject({
  "sharpness": z.number().finite().refine(Number.isInteger, "Expected integer").min(0).max(2).describe("0: no readable detail; 1: blurred but partly visible; 2: relatively clear detail."),
  "lighting": z.number().finite().refine(Number.isInteger, "Expected integer").min(0).max(2).describe("0: insufficient light; 1: uneven light with some visibility; 2: enough light for visible content."),
  "scene_visibility": z.number().finite().refine(Number.isInteger, "Expected integer").min(0).max(2).describe("0: relevant road scene absent or obscured; 1: only part visible; 2: relevant scene relatively clear."),
  "detail": z.number().finite().refine(Number.isInteger, "Expected integer").min(0).max(2).describe("0: insufficient detail to assess; 1: few relevant details; 2: details support the visible-content description."),
}).describe("Ordinal image-quality ratings under image-quality-v1. They describe visible image quality only, not authenticity, observation confidence, passability, or safety probability.");
export type ImageReviewQualityRatings = z.infer<typeof ImageReviewQualityRatingsSchema>;
