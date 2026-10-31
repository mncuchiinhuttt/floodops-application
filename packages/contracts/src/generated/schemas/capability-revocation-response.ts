import { z } from "zod";
import { CapabilityRevocationSchema } from "./capability-revocation";
import { MetaSchema } from "./meta";

export const CapabilityRevocationResponseSchema = z.strictObject({
  "success": z.literal(true),
  "data": CapabilityRevocationSchema,
  "error": z.null(),
  "meta": MetaSchema,
});
export type CapabilityRevocationResponse = z.infer<typeof CapabilityRevocationResponseSchema>;
