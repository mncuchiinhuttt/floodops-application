import { z } from "zod";
import { IdSchema } from "../schemas/id";
import { ResultsResponseSchema } from "../schemas/results-response";

export const getResults = {
  id: "getResults", method: "GET",
  path: "/sessions/{session_id}/results", roles: ["dispatcher","viewer"],
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
  responses: { 200: ResultsResponseSchema },
  statuses: [200], errorStatuses: [400,401,403,404,409,410,412,413,415,422,428,429,503],
  responseKind: "json", mediaTypes: ["application/json"],
} as const;
export type GetResultsInput = z.infer<typeof getResults.input>;
export type GetResultsOutput = z.infer<typeof getResults.responses[200]>;
