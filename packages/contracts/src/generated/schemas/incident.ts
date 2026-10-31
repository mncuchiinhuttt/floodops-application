import { z } from "zod";
import { IdSchema } from "./id";
import { ProvenanceLabelSchema } from "./provenance-label";

export const IncidentSchema = z.strictObject({
  "incident_id": IdSchema,
  "cause": z.literal(["rain","high_tide","combined"]),
  "fixture_event_ids": z.array(IdSchema).refine(v => v.length >= 1, "Too few items"),
  "sim_minute": z.number().finite().min(0).describe("Finite simulation minutes from scenario T0; fractional minutes allowed. Reject NaN/Infinity."),
  "affected_segment_ids": z.array(IdSchema),
  "label": ProvenanceLabelSchema,
});
export type Incident = z.infer<typeof IncidentSchema>;
