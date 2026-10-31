import { z } from "zod";
import { CoverageResponseSchema } from "../schemas/coverage-response";
import { IdSchema } from "../schemas/id";

export const getCoverage = {
  id: "getCoverage", method: "GET",
  path: "/sessions/{session_id}/coverage", roles: ["dispatcher","driver","contributor","viewer"],
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
  responses: { 200: CoverageResponseSchema },
  statuses: [200], errorStatuses: [400,401,403,404,409,410,412,413,415,422,428,429,503],
  responseKind: "json", mediaTypes: ["application/json"],
} as const;
export type GetCoverageInput = z.infer<typeof getCoverage.input>;
export type GetCoverageOutput = z.infer<typeof getCoverage.responses[200]>;
