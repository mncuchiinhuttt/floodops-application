import { z } from "zod";
import { ObservationSchema } from "./observation";
import { PageSchema } from "./page";

export const ObservationListSchema = z.strictObject({
  "items": z.array(ObservationSchema).refine(v => v.length <= 100, "Too many items"),
  "page": PageSchema,
});
export type ObservationList = z.infer<typeof ObservationListSchema>;
