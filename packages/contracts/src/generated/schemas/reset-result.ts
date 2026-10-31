import { z } from "zod";
import { IdSchema } from "./id";
import { SessionCreatedSchema } from "./session-created";

export const ResetResultSchema = z.strictObject({
  "old_session_id": IdSchema,
  "replacement": SessionCreatedSchema,
});
export type ResetResult = z.infer<typeof ResetResultSchema>;
