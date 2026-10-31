import { z } from "zod";
import { IdSchema } from "./id";
import { RoleSchema } from "./role";

export const InviteInputSchema = z.strictObject({
  "role": RoleSchema,
  "bound_entity_id": z.union([IdSchema, z.null()]),
  "expires_in_seconds": z.number().finite().refine(Number.isInteger, "Expected integer").min(60).max(900),
}).describe("Only the owner capability with manage_dispatchers permission may invite another dispatcher; a claimed invitation has server-frozen role and cannot self-elevate. Nonowner dispatcher cannot re-delegate owner rights.");
export type InviteInput = z.infer<typeof InviteInputSchema>;
