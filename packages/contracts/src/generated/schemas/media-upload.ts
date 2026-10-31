import { z } from "zod";
import { isTimestamp } from "../../schema-helpers";
import { IdSchema } from "./id";

export const MediaUploadSchema = z.strictObject({
  "upload_id": IdSchema,
  "status": z.literal(["reserved","uploaded","processing","ready","failed"]),
  "expires_at": z.string().refine(isTimestamp, "Invalid RFC3339 timestamp"),
  "maximum_bytes": z.number().finite().refine(Number.isInteger, "Expected integer").min(1),
  "content_path": z.string().refine(v => [...v].length <= 300, "String too long"),
});
export type MediaUpload = z.infer<typeof MediaUploadSchema>;
