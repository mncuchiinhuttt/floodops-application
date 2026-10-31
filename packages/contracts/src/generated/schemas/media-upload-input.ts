import { z } from "zod";

export const MediaUploadInputSchema = z.strictObject({
  "content_type": z.literal(["image/jpeg","image/png"]),
  "byte_length": z.number().finite().refine(Number.isInteger, "Expected integer").min(1).max(5242880),
  "original_filename": z.string().refine(v => [...v].length >= 1, "String too short").refine(v => [...v].length <= 128, "String too long"),
});
export type MediaUploadInput = z.infer<typeof MediaUploadInputSchema>;
