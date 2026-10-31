import { z } from "zod";
import { InputEventSchema } from "./input-event";
import { PageSchema } from "./page";

export const InputEventListSchema = z.strictObject({
  "items": z.array(InputEventSchema).refine(v => v.length <= 100, "Too many items"),
  "page": PageSchema,
});
export type InputEventList = z.infer<typeof InputEventListSchema>;
