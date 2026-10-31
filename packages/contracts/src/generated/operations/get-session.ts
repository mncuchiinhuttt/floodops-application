import { z } from "zod";
import { IdSchema } from "../schemas/id";
import { SessionMetaResponseSchema } from "../schemas/session-meta-response";

export const getSession = {
  id: "getSession", method: "GET",
  path: "/sessions/{session_id}", roles: ["dispatcher","driver","contributor","viewer"],
  requiresRevision: false, idempotent: false,
  input: z.strictObject({
  "path": z.strictObject({
  "session_id": IdSchema,
}),
  "query": z.strictObject({

}).optional(),
  "headers": z.strictObject({

}).optional(),
}),
  responses: { 200: SessionMetaResponseSchema },
  statuses: [200], errorStatuses: [400,401,403,404,409,410,412,413,415,422,428,429,503],
  responseKind: "json", mediaTypes: ["application/json"],
} as const;
export type GetSessionInput = z.infer<typeof getSession.input>;
export type GetSessionOutput = z.infer<typeof getSession.responses[200]>;
