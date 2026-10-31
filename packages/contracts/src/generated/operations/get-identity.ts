import { z } from "zod";
import { IdSchema } from "../schemas/id";
import { IdentityResponseSchema } from "../schemas/identity-response";

export const getIdentity = {
  id: "getIdentity", method: "GET",
  path: "/sessions/{session_id}/identity", roles: ["dispatcher","driver","contributor","viewer"],
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
  responses: { 200: IdentityResponseSchema },
  statuses: [200], errorStatuses: [400,401,403,404,409,410,412,413,415,422,428,429,503],
  responseKind: "json", mediaTypes: ["application/json"],
} as const;
export type GetIdentityInput = z.infer<typeof getIdentity.input>;
export type GetIdentityOutput = z.infer<typeof getIdentity.responses[200]>;
