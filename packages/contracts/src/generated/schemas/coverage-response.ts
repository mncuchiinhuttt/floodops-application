import { z } from "zod";
import { CoverageSchema } from "./coverage";
import { MetaSchema } from "./meta";

export const CoverageResponseSchema = z.strictObject({
  "success": z.literal(true),
  "data": CoverageSchema,
  "error": z.null(),
  "meta": MetaSchema,
});
export type CoverageResponse = z.infer<typeof CoverageResponseSchema>;
