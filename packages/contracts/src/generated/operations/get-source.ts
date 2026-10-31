import { z } from "zod";
import { IdSchema } from "../schemas/id";
import { SourceResponseSchema } from "../schemas/source-response";

export const getSource = {
  id: "getSource", method: "GET",
  path: "/sessions/{session_id}/sources/{source_id}", roles: ["dispatcher","driver","contributor","viewer"],
  requiresRevision: false, idempotent: false,
  input: z.strictObject({
  "path": z.strictObject({
  "session_id": IdSchema,
  "source_id": IdSchema,
}),
  "query": z.strictObject({

}).optional(),
  "headers": z.strictObject({

}).optional(),
}),
  responses: { 200: SourceResponseSchema },
  statuses: [200], errorStatuses: [400,401,403,404,409,410,412,413,415,422,428,429,503],
  responseKind: "json", mediaTypes: ["application/json"],
} as const;
export type GetSourceInput = z.infer<typeof getSource.input>;
export type GetSourceOutput = z.infer<typeof getSource.responses[200]>;
