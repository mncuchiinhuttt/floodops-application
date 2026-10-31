import { z } from "zod";
import { isTimestamp } from "../../schema-helpers";
import { IdSchema } from "./id";
import { RoleSchema } from "./role";

export const InviteSchema = z.strictObject({
  "invite_id": IdSchema,
  "claim_token": z.string().refine(v => [...v].length >= 32, "String too short").refine(v => [...v].length <= 512, "String too long"),
  "role": RoleSchema,
  "bound_entity_id": z.union([IdSchema, z.null()]),
  "expires_at": z.string().refine(isTimestamp, "Invalid RFC3339 timestamp"),
});
export type Invite = z.infer<typeof InviteSchema>;
