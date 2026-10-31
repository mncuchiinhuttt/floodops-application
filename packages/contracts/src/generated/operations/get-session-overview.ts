import { z } from "zod";
import { IdSchema } from "../schemas/id";
import { ViewerOverviewResponseSchema } from "../schemas/viewer-overview-response";

export const getSessionOverview = {
  id: "getSessionOverview", method: "GET",
  path: "/sessions/{session_id}/overview", roles: ["dispatcher","viewer"],
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
  responses: { 200: ViewerOverviewResponseSchema },
  statuses: [200], errorStatuses: [400,401,403,404,409,410,412,413,415,422,428,429,503],
  responseKind: "json", mediaTypes: ["application/json"],
} as const;
export type GetSessionOverviewInput = z.infer<typeof getSessionOverview.input>;
export type GetSessionOverviewOutput = z.infer<typeof getSessionOverview.responses[200]>;
