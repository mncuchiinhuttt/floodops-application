import { z } from "zod";
import { PageSchema } from "./page";
import { ParticipantSchema } from "./participant";

export const ParticipantListSchema = z.strictObject({
  "items": z.array(ParticipantSchema).refine(v => v.length <= 100, "Too many items"),
  "page": PageSchema,
});
export type ParticipantList = z.infer<typeof ParticipantListSchema>;
