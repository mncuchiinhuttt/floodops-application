import { z } from "zod";
import { ConflictResolutionInputSchema } from "../schemas/conflict-resolution-input";
import { ConflictResolutionResultResponseSchema } from "../schemas/conflict-resolution-result-response";
import { IdSchema } from "../schemas/id";

export const resolveConflict = {
  id: "resolveConflict", method: "POST",
  path: "/sessions/{session_id}/conflicts/{conflict_id}/resolutions", roles: ["dispatcher"],
  requiresRevision: true, idempotent: true,
  input: z.strictObject({
  "path": z.strictObject({
  "session_id": IdSchema,
  "conflict_id": IdSchema,
}),
  "query": z.strictObject({

}).optional(),
  "headers": z.strictObject({
  "If-Match": z.string().regex(new RegExp("^\"s:[A-Za-z0-9_-]+:g:[0-9]+:r:[0-9]+\"$")),
  "Idempotency-Key": z.string().refine(v => [...v].length >= 16, "String too short").refine(v => [...v].length <= 128, "String too long"),
  "X-CSRF-Token": z.string().refine(v => [...v].length >= 32, "String too short").refine(v => [...v].length <= 512, "String too long").optional(),
}),
  "body": ConflictResolutionInputSchema,
}),
  responses: { 200: ConflictResolutionResultResponseSchema },
  statuses: [200], errorStatuses: [400,401,403,404,409,410,412,413,415,422,428,429,503],
  responseKind: "json", mediaTypes: ["application/json"],
} as const;
export type ResolveConflictInput = z.infer<typeof resolveConflict.input>;
export type ResolveConflictOutput = z.infer<typeof resolveConflict.responses[200]>;
