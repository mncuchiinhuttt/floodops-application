import { z } from "zod";
import { MetaSchema } from "./meta";
import { SessionSnapshotSchema } from "./session-snapshot";

export const SessionSnapshotResponseSchema = z.strictObject({
  "success": z.literal(true),
  "data": SessionSnapshotSchema,
  "error": z.null(),
  "meta": MetaSchema,
});
export type SessionSnapshotResponse = z.infer<typeof SessionSnapshotResponseSchema>;
