import { z } from "zod";
import { InviteSchema } from "./invite";
import { MetaSchema } from "./meta";

export const InviteResponseSchema = z.strictObject({
  "success": z.literal(true),
  "data": InviteSchema,
  "error": z.null(),
  "meta": MetaSchema,
});
export type InviteResponse = z.infer<typeof InviteResponseSchema>;
