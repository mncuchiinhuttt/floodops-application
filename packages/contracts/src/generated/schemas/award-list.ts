import { z } from "zod";
import { AwardSchema } from "./award";
import { PageSchema } from "./page";

export const AwardListSchema = z.strictObject({
  "items": z.array(AwardSchema).refine(v => v.length <= 100, "Too many items"),
  "page": PageSchema,
});
export type AwardList = z.infer<typeof AwardListSchema>;
