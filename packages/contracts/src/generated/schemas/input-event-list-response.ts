import { z } from "zod";
import { InputEventListSchema } from "./input-event-list";
import { MetaSchema } from "./meta";

export const InputEventListResponseSchema = z.strictObject({
  "success": z.literal(true),
  "data": InputEventListSchema,
  "error": z.null(),
  "meta": MetaSchema,
});
export type InputEventListResponse = z.infer<typeof InputEventListResponseSchema>;
