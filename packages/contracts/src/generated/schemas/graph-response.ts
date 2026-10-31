import { z } from "zod";
import { GraphSchema } from "./graph";
import { MetaSchema } from "./meta";

export const GraphResponseSchema = z.strictObject({
  "success": z.literal(true),
  "data": GraphSchema,
  "error": z.null(),
  "meta": MetaSchema,
});
export type GraphResponse = z.infer<typeof GraphResponseSchema>;
