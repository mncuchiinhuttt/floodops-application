import { z } from "zod";
import { MediaUploadSchema } from "./media-upload";
import { MetaSchema } from "./meta";

export const MediaUploadResponseSchema = z.strictObject({
  "success": z.literal(true),
  "data": MediaUploadSchema,
  "error": z.null(),
  "meta": MetaSchema,
});
export type MediaUploadResponse = z.infer<typeof MediaUploadResponseSchema>;
