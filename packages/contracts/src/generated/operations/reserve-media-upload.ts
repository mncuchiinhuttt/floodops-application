import { z } from "zod";
import { IdSchema } from "../schemas/id";
import { MediaUploadInputSchema } from "../schemas/media-upload-input";
import { MediaUploadResponseSchema } from "../schemas/media-upload-response";

export const reserveMediaUpload = {
  id: "reserveMediaUpload", method: "POST",
  path: "/sessions/{session_id}/media-uploads", roles: ["dispatcher","driver","contributor"],
  requiresRevision: false, idempotent: true,
  input: z.strictObject({
  "path": z.strictObject({
  "session_id": IdSchema,
}),
  "query": z.strictObject({

}).optional(),
  "headers": z.strictObject({
  "Idempotency-Key": z.string().refine(v => [...v].length >= 16, "String too short").refine(v => [...v].length <= 128, "String too long"),
  "X-CSRF-Token": z.string().refine(v => [...v].length >= 32, "String too short").refine(v => [...v].length <= 512, "String too long").optional(),
}),
  "body": MediaUploadInputSchema,
}),
  responses: { 201: MediaUploadResponseSchema },
  statuses: [201], errorStatuses: [400,401,403,404,409,410,412,413,415,422,428,429,503],
  responseKind: "json", mediaTypes: ["application/json"],
} as const;
export type ReserveMediaUploadInput = z.infer<typeof reserveMediaUpload.input>;
export type ReserveMediaUploadOutput = z.infer<typeof reserveMediaUpload.responses[201]>;
