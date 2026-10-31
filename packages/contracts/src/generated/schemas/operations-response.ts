import { z } from "zod";
import { MetaSchema } from "./meta";
import { OperationsSchema } from "./operations";

export const OperationsResponseSchema = z.strictObject({
  "success": z.literal(true),
  "data": OperationsSchema,
  "error": z.null(),
  "meta": MetaSchema,
});
export type OperationsResponse = z.infer<typeof OperationsResponseSchema>;
