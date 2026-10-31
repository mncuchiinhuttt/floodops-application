import { z } from "zod";
import { isTimestamp } from "../../schema-helpers";
import { ConditionSchema } from "./condition";
import { CoordinateSchema } from "./coordinate";
import { IdSchema } from "./id";
import { ObservationSchema } from "./observation";
import { ReportReasonSchema } from "./report-reason";
import { ReportRewardSchema } from "./report-reward";
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
  "reward": ReportRewardSchema,
  "review_result_id": z.union([IdSchema, z.null()]),
  "reviewed_at": z.union([z.string().refine(isTimestamp, "Invalid RFC3339 timestamp"), z.null()]),
}).refine(v => z.unknown().refine(v => !z.object({"reward": z.object({"status": z.literal("committed").optional()}).optional()}).safeParse(v).success || z.object({"award_id": IdSchema.optional(), "status": z.literal("accepted").optional(), "kind": z.literal("citizen").optional()}).safeParse(v).success, "Conditional constraint").safeParse(v).success, "Conditional constraint").refine(v => z.unknown().refine(v => !z.object({"reward": z.object({"status": z.literal(["pending_review","pending_config","ineligible"]).optional()}).optional()}).safeParse(v).success || z.object({"award_id": z.null().optional()}).safeParse(v).success, "Conditional constraint").safeParse(v).success, "Conditional constraint").refine(v => z.unknown().refine(v => !z.object({"status": z.literal(["accepted","rejected"]).optional()}).safeParse(v).success || z.object({"review_result_id": IdSchema.optional(), "reviewed_at": z.string().refine(isTimestamp, "Invalid RFC3339 timestamp").optional()}).safeParse(v).success, "Conditional constraint").safeParse(v).success, "Conditional constraint").refine(v => z.unknown().refine(v => !z.object({"status": z.literal(["normalizing","needs_clarification","pending_review"]).optional()}).safeParse(v).success || z.object({"review_result_id": z.null().optional(), "reviewed_at": z.null().optional()}).safeParse(v).success, "Conditional constraint").safeParse(v).success, "Conditional constraint").refine(v => z.unknown().refine(v => !z.object({"reward": z.object({"status": z.literal("pending_review").optional()}).optional()}).safeParse(v).success || z.object({"status": z.literal(["normalizing","needs_clarification","pending_review"]).optional()}).safeParse(v).success, "Conditional constraint").safeParse(v).success, "Conditional constraint").describe("New-session M1 report. reward.policy is captured at receipt by the server, never caller-selected; review_result_id/reviewed_at are assigned atomically with review. Driver text uses deterministic clarification, never a model parser. No mission is required.");
export type Report = z.infer<typeof ReportSchema>;
