import { z } from "zod";
import { IdSchema } from "../schemas/id";
import { ScenarioConfigResponseSchema } from "../schemas/scenario-config-response";

export const getSessionConfiguration = {
  id: "getSessionConfiguration", method: "GET",
  path: "/sessions/{session_id}/configuration", roles: ["dispatcher","driver","contributor","viewer"],
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
  responses: { 200: ScenarioConfigResponseSchema },
  statuses: [200], errorStatuses: [400,401,403,404,409,410,412,413,415,422,428,429,503],
  responseKind: "json", mediaTypes: ["application/json"],
} as const;
export type GetSessionConfigurationInput = z.infer<typeof getSessionConfiguration.input>;
export type GetSessionConfigurationOutput = z.infer<typeof getSessionConfiguration.responses[200]>;
