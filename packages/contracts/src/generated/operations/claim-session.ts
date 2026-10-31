import { z } from "zod";
import { ClaimInputSchema } from "../schemas/claim-input";
import { SessionCreatedResponseSchema } from "../schemas/session-created-response";

export const claimSession = {
  id: "claimSession", method: "POST",
  path: "/session-claims", roles: [],
  requiresRevision: false, idempotent: true,
  input: z.strictObject({
  "path": z.strictObject({

}).optional(),
  "query": z.strictObject({

}).optional(),
  "headers": z.strictObject({
  "Idempotency-Key": z.string().refine(v => [...v].length >= 16, "String too short").refine(v => [...v].length <= 128, "String too long"),
  "X-CSRF-Token": z.string().refine(v => [...v].length >= 32, "String too short").refine(v => [...v].length <= 512, "String too long").optional(),
}),
  "body": ClaimInputSchema,
}),
  responses: { 201: SessionCreatedResponseSchema },
  statuses: [201], errorStatuses: [400,401,403,404,409,410,412,413,415,422,428,429,503],
  responseKind: "json", mediaTypes: ["application/json"],
} as const;
export type ClaimSessionInput = z.infer<typeof claimSession.input>;
export type ClaimSessionOutput = z.infer<typeof claimSession.responses[201]>;
