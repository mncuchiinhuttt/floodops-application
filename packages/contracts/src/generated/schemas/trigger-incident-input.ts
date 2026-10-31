import { z } from "zod";
import { IdSchema } from "./id";

export const TriggerIncidentInputSchema = z.strictObject({
  "cause": z.literal(["rain","high_tide","combined"]),
  "fixture_incident_id": IdSchema,
});
export type TriggerIncidentInput = z.infer<typeof TriggerIncidentInputSchema>;
