import { z } from "zod";
import { CapabilityRevocationResponseSchema } from "../schemas/capability-revocation-response";
import { IdSchema } from "../schemas/id";

export const revokeParticipant = {
  id: "revokeParticipant", method: "DELETE",
  path: "/sessions/{session_id}/participants/{participant_id}", roles: ["dispatcher"],
  requiresRevision: false, idempotent: true,
  input: z.strictObject({
  "path": z.strictObject({
  "session_id": IdSchema,
  "participant_id": IdSchema,
}),
  "query": z.strictObject({

}).optional(),
  "headers": z.strictObject({
  "Idempotency-Key": z.string().refine(v => [...v].length >= 16, "String too short").refine(v => [...v].length <= 128, "String too long"),
  "X-CSRF-Token": z.string().refine(v => [...v].length >= 32, "String too short").refine(v => [...v].length <= 512, "String too long").optional(),
}),
}),
  responses: { 200: CapabilityRevocationResponseSchema },
  statuses: [200], errorStatuses: [400,401,403,404,409,410,412,413,415,422,428,429,503],
  responseKind: "json", mediaTypes: ["application/json"],
} as const;
export type RevokeParticipantInput = z.infer<typeof revokeParticipant.input>;
export type RevokeParticipantOutput = z.infer<typeof revokeParticipant.responses[200]>;
