import { z } from "zod";
import { PageSchema } from "./page";
import { RestrictionSchema } from "./restriction";

export const RestrictionListSchema = z.strictObject({
  "items": z.array(RestrictionSchema).refine(v => v.length <= 100, "Too many items"),
  "page": PageSchema,
});
export type RestrictionList = z.infer<typeof RestrictionListSchema>;
