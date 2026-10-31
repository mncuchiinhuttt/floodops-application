import { z } from "zod";
import { ExecutionResponseSchema } from "../schemas/execution-response";
import { IdSchema } from "../schemas/id";

export const getExecution = {
  id: "getExecution", method: "GET",
  path: "/sessions/{session_id}/executions/{execution_id}", roles: ["dispatcher"],
  requiresRevision: false, idempotent: false,
  input: z.strictObject({
  "path": z.strictObject({
  "session_id": IdSchema,
  "execution_id": IdSchema,
}),
  "query": z.strictObject({

}).optional(),
  "headers": z.strictObject({

}).optional(),
}),
  responses: { 200: ExecutionResponseSchema },
  statuses: [200], errorStatuses: [400,401,403,404,409,410,412,413,415,422,428,429,503],
  responseKind: "json", mediaTypes: ["application/json"],
} as const;
export type GetExecutionInput = z.infer<typeof getExecution.input>;
export type GetExecutionOutput = z.infer<typeof getExecution.responses[200]>;
