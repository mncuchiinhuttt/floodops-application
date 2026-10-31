import { z } from "zod";
import { DecisionResultSchema } from "./decision-result";
import { MetaSchema } from "./meta";

export const DecisionResultResponseSchema = z.strictObject({
  "success": z.literal(true),
  "data": DecisionResultSchema,
  "error": z.null(),
  "meta": MetaSchema,
});
export type DecisionResultResponse = z.infer<typeof DecisionResultResponseSchema>;
