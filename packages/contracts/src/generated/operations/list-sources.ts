import { z } from "zod";
import { IdSchema } from "../schemas/id";
import { SourceListResponseSchema } from "../schemas/source-list-response";

export const listSources = {
  id: "listSources", method: "GET",
  path: "/sessions/{session_id}/sources", roles: ["dispatcher","driver","contributor","viewer"],
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
  responses: { 200: SourceListResponseSchema },
  statuses: [200], errorStatuses: [400,401,403,404,409,410,412,413,415,422,428,429,503],
  responseKind: "json", mediaTypes: ["application/json"],
} as const;
export type ListSourcesInput = z.infer<typeof listSources.input>;
export type ListSourcesOutput = z.infer<typeof listSources.responses[200]>;
