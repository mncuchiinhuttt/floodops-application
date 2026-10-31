import { z } from "zod";
import { ParticipantSchema } from "./participant";
import { SessionMetaSchema } from "./session-meta";

export const IdentitySchema = z.strictObject({
  "participant": ParticipantSchema,
  "session": SessionMetaSchema,
  "csrf_token": z.union([z.string().refine(v => [...v].length <= 512, "String too long"), z.null()]),
});
export type Identity = z.infer<typeof IdentitySchema>;
