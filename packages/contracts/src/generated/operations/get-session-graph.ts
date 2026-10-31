import { z } from "zod";
import { GraphResponseSchema } from "../schemas/graph-response";
import { IdSchema } from "../schemas/id";

export const getSessionGraph = {
  id: "getSessionGraph", method: "GET",
  path: "/sessions/{session_id}/graph", roles: ["dispatcher","driver","contributor","viewer"],
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
  responses: { 200: GraphResponseSchema },
  statuses: [200], errorStatuses: [400,401,403,404,409,410,412,413,415,422,428,429,503],
  responseKind: "json", mediaTypes: ["application/json"],
} as const;
export type GetSessionGraphInput = z.infer<typeof getSessionGraph.input>;
export type GetSessionGraphOutput = z.infer<typeof getSessionGraph.responses[200]>;
