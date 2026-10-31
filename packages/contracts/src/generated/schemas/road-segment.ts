import { z } from "zod";
import { hasUniqueItems } from "../../schema-helpers";
import { IdSchema } from "./id";
import { PolylineSchema } from "./polyline";
import { ProvenanceSchema } from "./provenance";
import { TravelProfileSchema } from "./travel-profile";
import { TurnRestrictionSchema } from "./turn-restriction";
import { VehicleTypeSchema } from "./vehicle-type";

export const RoadSegmentSchema = z.strictObject({
  "segment_id": IdSchema,
  "from_node_id": IdSchema,
  "to_node_id": IdSchema,
  "polyline": PolylineSchema,
  "length_m": z.number().finite().gt(0),
  "allowed_vehicle_types": z.array(VehicleTypeSchema).refine(v => v.length >= 1, "Too few items").refine(hasUniqueItems, "Duplicate items"),
  "travel_profiles": z.array(TravelProfileSchema).refine(v => v.length >= 1, "Too few items"),
  "turn_restrictions": z.array(TurnRestrictionSchema),
  "provenance": z.array(ProvenanceSchema).refine(v => v.length >= 1, "Too few items"),
});
export type RoadSegment = z.infer<typeof RoadSegmentSchema>;
