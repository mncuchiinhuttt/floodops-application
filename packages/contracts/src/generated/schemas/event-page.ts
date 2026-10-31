import { z } from "zod";
import { EventSchema } from "./event";

export const EventPageSchema = z.strictObject({
  "events": z.array(EventSchema).refine(v => v.length <= 500, "Too many items"),
  "next_sequence": z.number().finite().refine(Number.isInteger, "Expected integer").min(0),
  "has_more": z.boolean(),
});
export type EventPage = z.infer<typeof EventPageSchema>;
