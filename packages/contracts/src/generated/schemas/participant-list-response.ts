import { z } from "zod";
import { MetaSchema } from "./meta";
import { ParticipantListSchema } from "./participant-list";

export const ParticipantListResponseSchema = z.strictObject({
  "success": z.literal(true),
  "data": ParticipantListSchema,
  "error": z.null(),
  "meta": MetaSchema,
});
export type ParticipantListResponse = z.infer<typeof ParticipantListResponseSchema>;
