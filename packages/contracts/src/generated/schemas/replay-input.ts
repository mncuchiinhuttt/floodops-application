import { z } from "zod";
import { IdSchema } from "./id";

export const ReplayInputSchema = z.strictObject({
  "fixture_event_id": IdSchema,
});
export type ReplayInput = z.infer<typeof ReplayInputSchema>;
