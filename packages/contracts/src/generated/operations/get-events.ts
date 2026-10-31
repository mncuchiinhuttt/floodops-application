import { z } from "zod";
import { EventPageResponseSchema } from "../schemas/event-page-response";
import { IdSchema } from "../schemas/id";

export const getEvents = {
  id: "getEvents", method: "GET",
  path: "/sessions/{session_id}/events", roles: ["dispatcher","driver","contributor","viewer"],
  requiresRevision: false, idempotent: false,
  input: z.strictObject({
  "path": z.strictObject({
  "session_id": IdSchema,
}),
  "query": z.strictObject({
  "after": z.number().finite().refine(Number.isInteger, "Expected integer").min(0),
  "limit": z.number().finite().refine(Number.isInteger, "Expected integer").min(1).max(500).optional(),
}),
  "headers": z.strictObject({

}).optional(),
}),
  responses: { 200: EventPageResponseSchema },
  statuses: [200], errorStatuses: [400,401,403,404,409,410,412,413,415,422,428,429,503],
  responseKind: "json", mediaTypes: ["application/json"],
} as const;
export type GetEventsInput = z.infer<typeof getEvents.input>;
export type GetEventsOutput = z.infer<typeof getEvents.responses[200]>;
