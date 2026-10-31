import { z } from "zod";
import { IdentitySchema } from "./identity";
import { MetaSchema } from "./meta";

export const IdentityResponseSchema = z.strictObject({
  "success": z.literal(true),
  "data": IdentitySchema,
  "error": z.null(),
  "meta": MetaSchema,
});
export type IdentityResponse = z.infer<typeof IdentityResponseSchema>;
