import { z } from "zod";
import { PageSchema } from "./page";
import { SourceSchema } from "./source";

export const SourceListSchema = z.strictObject({
  "items": z.array(SourceSchema).refine(v => v.length <= 100, "Too many items"),
  "page": PageSchema,
});
export type SourceList = z.infer<typeof SourceListSchema>;
