import { z } from "zod";
import { IdSchema } from "../schemas/id";
import { PlanResponseSchema } from "../schemas/plan-response";

export const getPlan = {
  id: "getPlan", method: "GET",
  path: "/sessions/{session_id}/plans/{plan_id}", roles: ["dispatcher"],
  requiresRevision: false, idempotent: false,
  input: z.strictObject({
  "path": z.strictObject({
  "session_id": IdSchema,
  "plan_id": IdSchema,
}),
  "query": z.strictObject({

}).optional(),
  "headers": z.strictObject({

}).optional(),
}),
  responses: { 200: PlanResponseSchema },
  statuses: [200], errorStatuses: [400,401,403,404,409,410,412,413,415,422,428,429,503],
  responseKind: "json", mediaTypes: ["application/json"],
} as const;
export type GetPlanInput = z.infer<typeof getPlan.input>;
export type GetPlanOutput = z.infer<typeof getPlan.responses[200]>;
