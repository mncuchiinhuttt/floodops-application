import { z } from "zod";
import { IdSchema } from "../schemas/id";
import { IncidentListResponseSchema } from "../schemas/incident-list-response";

export const listIncidents = {
  id: "listIncidents", method: "GET",
  path: "/sessions/{session_id}/incidents", roles: ["dispatcher","viewer"],
  requiresRevision: false, idempotent: false,
  input: z.strictObject({
  "path": z.strictObject({
  "session_id": IdSchema,
}),
  "query": z.strictObject({
  "cursor": z.string().refine(v => [...v].length <= 2048, "String too long").optional(),
  "limit": z.number().finite().refine(Number.isInteger, "Expected integer").min(1).max(100).optional(),
}).optional(),
  "headers": z.strictObject({

}).optional(),
}),
  responses: { 200: IncidentListResponseSchema },
  statuses: [200], errorStatuses: [400,401,403,404,409,410,412,413,415,422,428,429,503],
  responseKind: "json", mediaTypes: ["application/json"],
} as const;
export type ListIncidentsInput = z.infer<typeof listIncidents.input>;
export type ListIncidentsOutput = z.infer<typeof listIncidents.responses[200]>;
