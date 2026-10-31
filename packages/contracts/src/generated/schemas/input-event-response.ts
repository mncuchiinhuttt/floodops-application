import { z } from "zod";
import { InputEventSchema } from "./input-event";
import { MetaSchema } from "./meta";

export const InputEventResponseSchema = z.strictObject({
  "success": z.literal(true),
  "data": InputEventSchema,
  "error": z.null(),
  "meta": MetaSchema,
});
export type InputEventResponse = z.infer<typeof InputEventResponseSchema>;
