import { z } from "zod";
import { IdSchema } from "../schemas/id";
import { ResetInputSchema } from "../schemas/reset-input";
import { ResetResultResponseSchema } from "../schemas/reset-result-response";

export const resetSession = {
  id: "resetSession", method: "POST",
  path: "/sessions/{session_id}/resets", roles: ["dispatcher"],
  requiresRevision: true, idempotent: true,
  input: z.strictObject({
  "path": z.strictObject({
  "session_id": IdSchema,
}),
  "query": z.strictObject({

}).optional(),
  "headers": z.strictObject({
  "If-Match": z.string().regex(new RegExp("^\"s:[A-Za-z0-9_-]+:g:[0-9]+:r:[0-9]+\"$")),
  "Idempotency-Key": z.string().refine(v => [...v].length >= 16, "String too short").refine(v => [...v].length <= 128, "String too long"),
  "X-CSRF-Token": z.string().refine(v => [...v].length >= 32, "String too short").refine(v => [...v].length <= 512, "String too long").optional(),
}),
  "body": ResetInputSchema,
}),
  responses: { 201: ResetResultResponseSchema },
  statuses: [201], errorStatuses: [400,401,403,404,409,410,412,413,415,422,428,429,503],
  responseKind: "json", mediaTypes: ["application/json"],
} as const;
export type ResetSessionInput = z.infer<typeof resetSession.input>;
export type ResetSessionOutput = z.infer<typeof resetSession.responses[201]>;
