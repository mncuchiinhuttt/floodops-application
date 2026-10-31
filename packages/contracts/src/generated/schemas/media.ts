import { z } from "zod";
import { isTimestamp } from "../../schema-helpers";
import { IdSchema } from "./id";

export const MediaSchema = z.strictObject({
  "media_id": IdSchema,
  "status": z.literal(["ready"]),
  "content_type": z.literal(["image/jpeg","image/png"]),
  "byte_length": z.number().finite().refine(Number.isInteger, "Expected integer").min(1).max(5242880),
  "width": z.number().finite().refine(Number.isInteger, "Expected integer").min(1).max(4096),
  "height": z.number().finite().refine(Number.isInteger, "Expected integer").min(1).max(4096),
  "sha256": z.string().regex(new RegExp("^[a-f0-9]{64}$")),
  "created_at": z.string().refine(isTimestamp, "Invalid RFC3339 timestamp"),
});
export type Media = z.infer<typeof MediaSchema>;
