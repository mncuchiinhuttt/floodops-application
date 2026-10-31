import { z } from "zod";
import { IncidentListSchema } from "./incident-list";
import { MetaSchema } from "./meta";

export const IncidentListResponseSchema = z.strictObject({
  "success": z.literal(true),
  "data": IncidentListSchema,
  "error": z.null(),
  "meta": MetaSchema,
});
export type IncidentListResponse = z.infer<typeof IncidentListResponseSchema>;
