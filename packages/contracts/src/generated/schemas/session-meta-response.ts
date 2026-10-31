import { z } from "zod";
import { MetaSchema } from "./meta";
import { SessionMetaSchema } from "./session-meta";

export const SessionMetaResponseSchema = z.strictObject({
  "success": z.literal(true),
  "data": SessionMetaSchema,
  "error": z.null(),
  "meta": MetaSchema,
});
export type SessionMetaResponse = z.infer<typeof SessionMetaResponseSchema>;
