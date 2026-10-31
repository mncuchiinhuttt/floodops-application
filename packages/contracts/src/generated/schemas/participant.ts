import { z } from "zod";
import { hasUniqueItems, isTimestamp } from "../../schema-helpers";
import { IdSchema } from "./id";
import { PermissionSchema } from "./permission";
import { RoleSchema } from "./role";

export const ParticipantSchema = z.strictObject({
  "participant_id": IdSchema,
  "role": RoleSchema,
  "bound_entity_id": z.union([IdSchema, z.null()]),
  "expires_at": z.string().refine(isTimestamp, "Invalid RFC3339 timestamp"),
  "permissions": z.array(PermissionSchema).refine(hasUniqueItems, "Duplicate items"),
  "is_owner": z.boolean(),
});
export type Participant = z.infer<typeof ParticipantSchema>;
