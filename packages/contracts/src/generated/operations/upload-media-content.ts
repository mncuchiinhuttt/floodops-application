import { z } from "zod";
import { IdSchema } from "../schemas/id";
import { MediaUploadResponseSchema } from "../schemas/media-upload-response";

export const uploadMediaContent = {
  id: "uploadMediaContent", method: "PUT",
  path: "/sessions/{session_id}/media-uploads/{upload_id}/content", roles: ["dispatcher","driver","contributor"],
  requiresRevision: false, idempotent: true,
  input: z.strictObject({
  "path": z.strictObject({
  "session_id": IdSchema,
  "upload_id": IdSchema,
}),
  "query": z.strictObject({

}).optional(),
  "headers": z.strictObject({
  "Idempotency-Key": z.string().refine(v => [...v].length >= 16, "String too short").refine(v => [...v].length <= 128, "String too long"),
  "X-CSRF-Token": z.string().refine(v => [...v].length >= 32, "String too short").refine(v => [...v].length <= 512, "String too long").optional(),
}),
  body: z.instanceof(Uint8Array).refine(v => v.byteLength > 0 && v.byteLength <= 5242880, "Invalid upload byte length"),
}),
  responses: { 200: MediaUploadResponseSchema },
  statuses: [200], errorStatuses: [400,401,403,404,409,410,412,413,415,422,428,429,503],
  responseKind: "json", mediaTypes: ["application/json"],
} as const;
export type UploadMediaContentInput = z.infer<typeof uploadMediaContent.input>;
export type UploadMediaContentOutput = z.infer<typeof uploadMediaContent.responses[200]>;
