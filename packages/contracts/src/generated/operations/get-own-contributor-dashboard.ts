import { z } from "zod";
import { ContributorDashboardResponseSchema } from "../schemas/contributor-dashboard-response";
import { IdSchema } from "../schemas/id";

export const getOwnContributorDashboard = {
  id: "getOwnContributorDashboard", method: "GET",
  path: "/sessions/{session_id}/contributors/me", roles: ["contributor"],
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
  responses: { 200: ContributorDashboardResponseSchema },
  statuses: [200], errorStatuses: [400,401,403,404,409,410,412,413,415,422,428,429,503],
  responseKind: "json", mediaTypes: ["application/json"],
} as const;
export type GetOwnContributorDashboardInput = z.infer<typeof getOwnContributorDashboard.input>;
export type GetOwnContributorDashboardOutput = z.infer<typeof getOwnContributorDashboard.responses[200]>;
