import { z } from "zod";
import { IdSchema } from "../schemas/id";
import { InviteInputSchema } from "../schemas/invite-input";
import { InviteResponseSchema } from "../schemas/invite-response";

export const createInvitation = {
  id: "createInvitation", method: "POST",
  path: "/sessions/{session_id}/invitations", roles: ["dispatcher"],
  requiresRevision: false, idempotent: true,
  input: z.strictObject({
  "path": z.strictObject({
  "session_id": IdSchema,
}),
  "query": z.strictObject({

}).optional(),
  "headers": z.strictObject({
  "Idempotency-Key": z.string().refine(v => [...v].length >= 16, "String too short").refine(v => [...v].length <= 128, "String too long"),
  "X-CSRF-Token": z.string().refine(v => [...v].length >= 32, "String too short").refine(v => [...v].length <= 512, "String too long").optional(),
}),
  "body": InviteInputSchema,
}),
  responses: { 201: InviteResponseSchema },
  statuses: [201], errorStatuses: [400,401,403,404,409,410,412,413,415,422,428,429,503],
  responseKind: "json", mediaTypes: ["application/json"],
} as const;
export type CreateInvitationInput = z.infer<typeof createInvitation.input>;
export type CreateInvitationOutput = z.infer<typeof createInvitation.responses[201]>;
