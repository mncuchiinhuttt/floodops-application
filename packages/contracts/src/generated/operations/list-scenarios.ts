import { z } from "zod";
import { ScenarioSummaryListResponseSchema } from "../schemas/scenario-summary-list-response";

export const listScenarios = {
  id: "listScenarios", method: "GET",
  path: "/scenarios", roles: [],
  requiresRevision: false, idempotent: false,
  input: z.strictObject({
  "path": z.strictObject({

}).optional(),
  "query": z.strictObject({
  "cursor": z.string().refine(v => [...v].length <= 2048, "String too long").optional(),
  "limit": z.number().finite().refine(Number.isInteger, "Expected integer").min(1).max(100).optional(),
}).optional(),
  "headers": z.strictObject({

}).optional(),
}),
  responses: { 200: ScenarioSummaryListResponseSchema },
  statuses: [200], errorStatuses: [400,401,403,404,409,410,412,413,415,422,428,429,503],
  responseKind: "json", mediaTypes: ["application/json"],
} as const;
export type ListScenariosInput = z.infer<typeof listScenarios.input>;
export type ListScenariosOutput = z.infer<typeof listScenarios.responses[200]>;
