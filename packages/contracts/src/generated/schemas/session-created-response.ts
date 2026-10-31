import { z } from "zod";
import { MetaSchema } from "./meta";
import { SessionCreatedSchema } from "./session-created";

export const SessionCreatedResponseSchema = z.strictObject({
  "success": z.literal(true),
  "data": SessionCreatedSchema,
  "error": z.null(),
  "meta": MetaSchema,
});
export type SessionCreatedResponse = z.infer<typeof SessionCreatedResponseSchema>;
