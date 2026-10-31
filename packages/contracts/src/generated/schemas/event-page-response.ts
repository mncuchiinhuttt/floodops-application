import { z } from "zod";
import { EventPageSchema } from "./event-page";
import { MetaSchema } from "./meta";

export const EventPageResponseSchema = z.strictObject({
  "success": z.literal(true),
  "data": EventPageSchema,
  "error": z.null(),
  "meta": MetaSchema,
});
export type EventPageResponse = z.infer<typeof EventPageResponseSchema>;
