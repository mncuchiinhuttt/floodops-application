import { z } from "zod";
import { IdSchema } from "./id";

export const CapabilityRevocationSchema = z.strictObject({
  "participant_id": IdSchema,
  "revoked": z.literal(true),
});
export type CapabilityRevocation = z.infer<typeof CapabilityRevocationSchema>;
