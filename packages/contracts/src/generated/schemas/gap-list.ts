import { z } from "zod";
import { GapSchema } from "./gap";
import { PageSchema } from "./page";

export const GapListSchema = z.strictObject({
  "items": z.array(GapSchema).refine(v => v.length <= 100, "Too many items"),
  "page": PageSchema,
});
export type GapList = z.infer<typeof GapListSchema>;
