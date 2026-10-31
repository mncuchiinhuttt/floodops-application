import { z } from "zod";
import { IdSchema } from "../schemas/id";
import { OperationsResponseSchema } from "../schemas/operations-response";

export const getOperations = {
  id: "getOperations", method: "GET",
  path: "/sessions/{session_id}/operations", roles: ["dispatcher"],
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
  responses: { 200: OperationsResponseSchema },
  statuses: [200], errorStatuses: [400,401,403,404,409,410,412,413,415,422,428,429,503],
  responseKind: "json", mediaTypes: ["application/json"],
} as const;
export type GetOperationsInput = z.infer<typeof getOperations.input>;
export type GetOperationsOutput = z.infer<typeof getOperations.responses[200]>;
