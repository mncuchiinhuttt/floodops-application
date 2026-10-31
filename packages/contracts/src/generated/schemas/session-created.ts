import { z } from "zod";
import { CredentialDeliverySchema } from "./credential-delivery";
import { ParticipantSchema } from "./participant";
import { SessionMetaSchema } from "./session-meta";

export const SessionCreatedSchema = z.strictObject({
  "session": SessionMetaSchema,
  "participant": ParticipantSchema,
  "credential": CredentialDeliverySchema,
});
export type SessionCreated = z.infer<typeof SessionCreatedSchema>;
