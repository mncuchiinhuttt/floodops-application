import { z } from "zod";
import { IdSchema } from "../schemas/id";

export const streamEvents = {
  id: "streamEvents", method: "GET",
  path: "/sessions/{session_id}/events/stream", roles: ["dispatcher","driver","contributor","viewer"],
  requiresRevision: false, idempotent: false,
  input: z.strictObject({
  "path": z.strictObject({
  "session_id": IdSchema,
}),
  "query": z.strictObject({
  "after": z.number().finite().refine(Number.isInteger, "Expected integer").min(0),
}),
  "headers": z.strictObject({

}).optional(),
}),
  responses: {  },
  statuses: [200], errorStatuses: [400,401,403,404,409,410,412,413,415,422,428,429,503],
  responseKind: "stream", mediaTypes: ["text/event-stream"],
} as const;
export type StreamEventsInput = z.infer<typeof streamEvents.input>;
export type StreamEventsOutput = ReadableStream<Uint8Array>;
