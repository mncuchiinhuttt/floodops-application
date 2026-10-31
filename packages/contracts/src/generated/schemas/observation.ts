import { z } from "zod";
import { hasUniqueItems, isTimestamp } from "../../schema-helpers";
import { ConditionSchema } from "./condition";
import { ConfidenceSchema } from "./confidence";
import { IdSchema } from "./id";
import { VehicleTypeSchema } from "./vehicle-type";

export const ObservationSchema = z.strictObject({
  "observation_id": IdSchema,
  "source_id": IdSchema,
  "segment_id": IdSchema,
  "knowledge_epoch": z.number().finite().refine(Number.isInteger, "Expected integer").min(0),
  "vehicle_types": z.array(VehicleTypeSchema).refine(v => v.length >= 1, "Too few items").refine(hasUniqueItems, "Duplicate items"),
  "condition": ConditionSchema,
  "validation": z.literal(["pending","accepted","rejected","superseded"]),
  "confidence_band": ConfidenceSchema,
  "observed_at": z.string().refine(isTimestamp, "Invalid RFC3339 timestamp"),
  "observed_sim_minute": z.number().finite().min(0).describe("Finite simulation minutes from scenario T0; fractional minutes allowed. Reject NaN/Infinity."),
  "expires_at": z.string().refine(isTimestamp, "Invalid RFC3339 timestamp"),
  "expires_sim_minute": z.number().finite().min(0).describe("Finite simulation minutes from scenario T0; fractional minutes allowed. Reject NaN/Infinity."),
  "evidence_ids": z.array(IdSchema).refine(v => v.length >= 1, "Too few items"),
  "has_conflict": z.boolean(),
});
export type Observation = z.infer<typeof ObservationSchema>;
