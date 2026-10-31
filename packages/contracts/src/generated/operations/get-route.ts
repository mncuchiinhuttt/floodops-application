import { z } from "zod";
import { IdSchema } from "../schemas/id";
import { RouteResponseSchema } from "../schemas/route-response";

export const getRoute = {
  id: "getRoute", method: "GET",
  path: "/sessions/{session_id}/routes/{route_id}", roles: ["dispatcher","driver"],
  requiresRevision: false, idempotent: false,
  input: z.strictObject({
  "path": z.strictObject({
  "session_id": IdSchema,
  "route_id": IdSchema,
}),
  "query": z.strictObject({

}).optional(),
  "headers": z.strictObject({

}).optional(),
}),
  responses: { 200: RouteResponseSchema },
  statuses: [200], errorStatuses: [400,401,403,404,409,410,412,413,415,422,428,429,503],
  responseKind: "json", mediaTypes: ["application/json"],
} as const;
export type GetRouteInput = z.infer<typeof getRoute.input>;
export type GetRouteOutput = z.infer<typeof getRoute.responses[200]>;
