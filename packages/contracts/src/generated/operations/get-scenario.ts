import { z } from "zod";
import { IdSchema } from "../schemas/id";
import { ScenarioConfigResponseSchema } from "../schemas/scenario-config-response";

export const getScenario = {
  id: "getScenario", method: "GET",
  path: "/scenarios/{scenario_id}", roles: [],
  requiresRevision: false, idempotent: false,
  input: z.strictObject({
  "path": z.strictObject({
  "scenario_id": IdSchema,
}),
  "query": z.strictObject({
  "version": z.string().refine(v => [...v].length <= 80, "String too long"),
}),
  "headers": z.strictObject({

}).optional(),
}),
  responses: { 200: ScenarioConfigResponseSchema },
  statuses: [200], errorStatuses: [400,401,403,404,409,410,412,413,415,422,428,429,503],
  responseKind: "json", mediaTypes: ["application/json"],
} as const;
export type GetScenarioInput = z.infer<typeof getScenario.input>;
export type GetScenarioOutput = z.infer<typeof getScenario.responses[200]>;
