import { z } from "zod";
import { IncidentSchema } from "./incident";
import { PageSchema } from "./page";

export const IncidentListSchema = z.strictObject({
  "items": z.array(IncidentSchema).refine(v => v.length <= 100, "Too many items"),
  "page": PageSchema,
});
export type IncidentList = z.infer<typeof IncidentListSchema>;
