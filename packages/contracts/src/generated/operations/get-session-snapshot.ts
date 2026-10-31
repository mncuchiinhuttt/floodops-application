import { z } from "zod";
import { IdSchema } from "../schemas/id";
import { SessionSnapshotResponseSchema } from "../schemas/session-snapshot-response";

export const getSessionSnapshot = {
  id: "getSessionSnapshot", method: "GET",
  path: "/sessions/{session_id}/snapshot", roles: ["dispatcher"],
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
  responses: { 200: SessionSnapshotResponseSchema },
  statuses: [200], errorStatuses: [400,401,403,404,409,410,412,413,415,422,428,429,503],
  responseKind: "json", mediaTypes: ["application/json"],
} as const;
export type GetSessionSnapshotInput = z.infer<typeof getSessionSnapshot.input>;
export type GetSessionSnapshotOutput = z.infer<typeof getSessionSnapshot.responses[200]>;
