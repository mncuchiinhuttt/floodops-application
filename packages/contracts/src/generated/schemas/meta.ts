import { z } from "zod";
import { IdSchema } from "./id";

export const MetaSchema = z.strictObject({
  "request_id": z.string().refine(v => [...v].length <= 128, "String too long"),
  "session_id": IdSchema.optional(),
  "generation": z.number().finite().refine(Number.isInteger, "Expected integer").min(0).optional(),
  "revision": z.number().finite().refine(Number.isInteger, "Expected integer").min(0).optional(),
  "event_sequence": z.number().finite().refine(Number.isInteger, "Expected integer").min(0).optional(),
});
export type Meta = z.infer<typeof MetaSchema>;
