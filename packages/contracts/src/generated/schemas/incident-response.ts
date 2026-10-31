import { z } from "zod";
import { IncidentSchema } from "./incident";
import { MetaSchema } from "./meta";

export const IncidentResponseSchema = z.strictObject({
  "success": z.literal(true),
  "data": IncidentSchema,
  "error": z.null(),
  "meta": MetaSchema,
});
export type IncidentResponse = z.infer<typeof IncidentResponseSchema>;
