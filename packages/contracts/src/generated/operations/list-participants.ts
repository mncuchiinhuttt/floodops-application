import { z } from "zod";
import { IdSchema } from "../schemas/id";
import { ParticipantListResponseSchema } from "../schemas/participant-list-response";

export const listParticipants = {
  id: "listParticipants", method: "GET",
  path: "/sessions/{session_id}/participants", roles: ["dispatcher"],
  requiresRevision: false, idempotent: false,
  input: z.strictObject({
  "path": z.strictObject({
  "session_id": IdSchema,
}),
  "query": z.strictObject({
  "cursor": z.string().refine(v => [...v].length <= 2048, "String too long").optional(),
  "limit": z.number().finite().refine(Number.isInteger, "Expected integer").min(1).max(100).optional(),
}).optional(),
  "headers": z.strictObject({

}).optional(),
}),
  responses: { 200: ParticipantListResponseSchema },
  statuses: [200], errorStatuses: [400,401,403,404,409,410,412,413,415,422,428,429,503],
  responseKind: "json", mediaTypes: ["application/json"],
} as const;
export type ListParticipantsInput = z.infer<typeof listParticipants.input>;
export type ListParticipantsOutput = z.infer<typeof listParticipants.responses[200]>;
