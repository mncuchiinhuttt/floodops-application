import { z } from "zod";
import { DriverDashboardResponseSchema } from "../schemas/driver-dashboard-response";
import { IdSchema } from "../schemas/id";

export const getOwnDriverDashboard = {
  id: "getOwnDriverDashboard", method: "GET",
  path: "/sessions/{session_id}/drivers/me", roles: ["driver"],
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
  responses: { 200: DriverDashboardResponseSchema },
  statuses: [200], errorStatuses: [400,401,403,404,409,410,412,413,415,422,428,429,503],
  responseKind: "json", mediaTypes: ["application/json"],
} as const;
export type GetOwnDriverDashboardInput = z.infer<typeof getOwnDriverDashboard.input>;
export type GetOwnDriverDashboardOutput = z.infer<typeof getOwnDriverDashboard.responses[200]>;
