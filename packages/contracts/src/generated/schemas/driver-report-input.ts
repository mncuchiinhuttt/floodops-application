import { z } from "zod";
import { hasUniqueItems, isTimestamp } from "../../schema-helpers";
import { ConditionSchema } from "./condition";
import { CoordinateSchema } from "./coordinate";
import { IdSchema } from "./id";
import { VehicleTypeSchema } from "./vehicle-type";

export const DriverReportInputSchema = z.strictObject({
  "kind": z.literal("driver"),
  "input_mode": z.literal(["quick","text"]),
  "quick_condition": z.union([ConditionSchema, z.null()]),
  "segment_id": z.union([IdSchema, z.null()]),
  "coordinate": z.union([CoordinateSchema, z.null()]),
  "captured_at": z.string().refine(isTimestamp, "Invalid RFC3339 timestamp"),
  "captured_sim_minute": z.number().finite().min(0).describe("Finite simulation minutes from scenario T0; fractional minutes allowed. Reject NaN/Infinity."),
  "vehicle_types": z.array(VehicleTypeSchema).refine(hasUniqueItems, "Duplicate items"),
  "description": z.string().refine(v => [...v].length <= 2000, "String too long"),
  "reporter_entity_id": IdSchema.optional(),
}).describe("For driver/contributor tokens, optional reporter_entity_id must equal their server binding. Dispatcher may explicitly select a simulated entity permitted in frozen scenario; original submitter retained for audit, never promotes role.");
export type DriverReportInput = z.infer<typeof DriverReportInputSchema>;
