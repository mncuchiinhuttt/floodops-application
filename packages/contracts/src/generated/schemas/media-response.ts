import { z } from "zod";
import { MediaSchema } from "./media";
import { MetaSchema } from "./meta";

export const MediaResponseSchema = z.strictObject({
  "success": z.literal(true),
  "data": MediaSchema,
  "error": z.null(),
  "meta": MetaSchema,
});
export type MediaResponse = z.infer<typeof MediaResponseSchema>;
