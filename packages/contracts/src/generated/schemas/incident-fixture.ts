import { z } from "zod";
import { IdSchema } from "./id";
import { ProvenanceLabelSchema } from "./provenance-label";

export const IncidentFixtureSchema = z.strictObject({
  "fixture_incident_id": IdSchema,
  "cause": z.literal(["rain","high_tide","combined"]),
  "title": z.string().refine(v => [...v].length <= 2000, "String too long"),
  "road_event_ids": z.array(IdSchema).refine(v => v.length >= 1, "Too few items"),
  "label": ProvenanceLabelSchema,
});
export type IncidentFixture = z.infer<typeof IncidentFixtureSchema>;
