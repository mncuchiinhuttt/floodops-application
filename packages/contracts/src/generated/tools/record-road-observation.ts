import { z } from "zod";
import { hasUniqueItems } from "../../schema-helpers";
import { ConditionSchema } from "../schemas/condition";
import { ObservationSchema } from "../schemas/observation";
import { VehicleTypeSchema } from "../schemas/vehicle-type";

export const recordRoadObservation = {
  name: "record_road_observation",
  input: z.strictObject({
  "report_id": z.string().refine(v => [...v].length <= 128, "String too long").regex(new RegExp("^[a-z][a-z0-9_]{1,23}_[A-Za-z0-9_-]{6,96}$")),
  "segment_id": z.string().refine(v => [...v].length <= 128, "String too long").regex(new RegExp("^[a-z][a-z0-9_]{1,23}_[A-Za-z0-9_-]{6,96}$")),
  "vehicle_types": z.array(VehicleTypeSchema).refine(v => v.length >= 1, "Too few items").refine(hasUniqueItems, "Duplicate items"),
  "condition": ConditionSchema,
  "evidence_ids": z.array(z.string().refine(v => [...v].length <= 128, "String too long").regex(new RegExp("^[a-z][a-z0-9_]{1,23}_[A-Za-z0-9_-]{6,96}$"))).refine(v => v.length >= 1, "Too few items"),
}),
  output: ObservationSchema,
  modelCallable: false, milestone: "M1",
  sideEffect: "validated_transition_proposal_only",
} as const;
