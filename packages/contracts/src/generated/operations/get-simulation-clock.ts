import { z } from "zod";
import { IdSchema } from "../schemas/id";
import { SimulationClockResponseSchema } from "../schemas/simulation-clock-response";

export const getSimulationClock = {
  id: "getSimulationClock", method: "GET",
  path: "/sessions/{session_id}/simulation", roles: ["dispatcher","driver","contributor","viewer"],
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
  responses: { 200: SimulationClockResponseSchema },
  statuses: [200], errorStatuses: [400,401,403,404,409,410,412,413,415,422,428,429,503],
  responseKind: "json", mediaTypes: ["application/json"],
} as const;
export type GetSimulationClockInput = z.infer<typeof getSimulationClock.input>;
export type GetSimulationClockOutput = z.infer<typeof getSimulationClock.responses[200]>;
