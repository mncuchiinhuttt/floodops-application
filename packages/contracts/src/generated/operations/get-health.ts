import { z } from "zod";
import { HealthResponseSchema } from "../schemas/health-response";

export const getHealth = {
  id: "getHealth", method: "GET",
  path: "/health", roles: [],
  requiresRevision: false, idempotent: false,
  input: z.strictObject({
  "path": z.strictObject({

}).optional(),
  "query": z.strictObject({

}).optional(),
  "headers": z.strictObject({

}).optional(),
}),
  responses: { 200: HealthResponseSchema },
  statuses: [200], errorStatuses: [400,401,403,404,409,410,412,413,415,422,428,429,503],
  responseKind: "json", mediaTypes: ["application/json"],
} as const;
export type GetHealthInput = z.infer<typeof getHealth.input>;
export type GetHealthOutput = z.infer<typeof getHealth.responses[200]>;
