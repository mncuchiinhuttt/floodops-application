import { z } from "zod";
import { isTimestamp } from "../../schema-helpers";
import { ConditionSchema } from "./condition";
import { CoordinateSchema } from "./coordinate";
import { IdSchema } from "./id";
import { ObservationSchema } from "./observation";
import { ReportReasonSchema } from "./report-reason";
import { VehicleTypeSchema } from "./vehicle-type";

export const ReportSchema = z.strictObject({
  "report_id": IdSchema,
  "participant_id": IdSchema,
  "kind": z.literal(["driver","citizen"]),
  "segment_id": z.union([IdSchema, z.null()]),
  "coordinate": z.union([CoordinateSchema, z.null()]),
  "captured_at": z.string().refine(isTimestamp, "Invalid RFC3339 timestamp"),
  "captured_sim_minute": z.number().finite().min(0).describe("Finite simulation minutes from scenario T0; fractional minutes allowed. Reject NaN/Infinity."),
  "received_at": z.string().refine(isTimestamp, "Invalid RFC3339 timestamp"),
  "vehicle_types": z.array(VehicleTypeSchema),
  "description": z.string().refine(v => [...v].length <= 2000, "String too long"),
  "media_id": z.union([IdSchema, z.null()]),
  "fixture_photo_id": z.union([IdSchema, z.null()]),
  "status": z.literal(["normalizing","needs_clarification","pending_review","accepted","rejected"]),
  "reason_codes": z.array(ReportReasonSchema),
  "observation_ids": z.array(IdSchema),
  "award_id": z.union([IdSchema, z.null()]),
  "input_revision": z.number().finite().refine(Number.isInteger, "Expected integer").min(0),
  "observation_candidates": z.array(ObservationSchema),
  "input_mode": z.literal(["quick","text","photo"]),
  "quick_condition": z.union([ConditionSchema, z.null()]),
  "reporter_entity_id": IdSchema,
});
export type Report = z.infer<typeof ReportSchema>;
