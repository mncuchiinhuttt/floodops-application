import { z } from "zod";
import { IdSchema } from "../schemas/id";
import { ImpactResponseSchema } from "../schemas/impact-response";

export const getImpact = {
  id: "getImpact", method: "GET",
  path: "/sessions/{session_id}/impact", roles: ["dispatcher"],
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
  responses: { 200: ImpactResponseSchema },
  statuses: [200], errorStatuses: [400,401,403,404,409,410,412,413,415,422,428,429,503],
  responseKind: "json", mediaTypes: ["application/json"],
} as const;
export type GetImpactInput = z.infer<typeof getImpact.input>;
export type GetImpactOutput = z.infer<typeof getImpact.responses[200]>;
