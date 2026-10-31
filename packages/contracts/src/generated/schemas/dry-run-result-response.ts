import { z } from "zod";
import { DryRunResultSchema } from "./dry-run-result";
import { MetaSchema } from "./meta";

export const DryRunResultResponseSchema = z.strictObject({
  "success": z.literal(true),
  "data": DryRunResultSchema,
  "error": z.null(),
  "meta": MetaSchema,
});
export type DryRunResultResponse = z.infer<typeof DryRunResultResponseSchema>;
