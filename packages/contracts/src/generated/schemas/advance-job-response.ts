import { z } from "zod";
import { AdvanceJobSchema } from "./advance-job";
import { MetaSchema } from "./meta";

export const AdvanceJobResponseSchema = z.strictObject({
  "success": z.literal(true),
  "data": AdvanceJobSchema,
  "error": z.null(),
  "meta": MetaSchema,
});
export type AdvanceJobResponse = z.infer<typeof AdvanceJobResponseSchema>;
