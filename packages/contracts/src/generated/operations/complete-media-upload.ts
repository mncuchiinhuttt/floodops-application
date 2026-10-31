import { z } from "zod";
import { IdSchema } from "../schemas/id";
import { MediaResponseSchema } from "../schemas/media-response";
import { UploadCompletionInputSchema } from "../schemas/upload-completion-input";

export const completeMediaUpload = {
  id: "completeMediaUpload", method: "POST",
  path: "/sessions/{session_id}/media-uploads/{upload_id}/completion", roles: ["dispatcher","driver","contributor"],
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
  "body": UploadCompletionInputSchema,
}),
  responses: { 201: MediaResponseSchema },
  statuses: [201], errorStatuses: [400,401,403,404,409,410,412,413,415,422,428,429,503],
  responseKind: "json", mediaTypes: ["application/json"],
} as const;
export type CompleteMediaUploadInput = z.infer<typeof completeMediaUpload.input>;
export type CompleteMediaUploadOutput = z.infer<typeof completeMediaUpload.responses[201]>;
