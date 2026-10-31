import { z } from "zod";
import { ConditionSchema } from "./condition";
import { ConfidenceSchema } from "./confidence";
import { IdSchema } from "./id";
import { VehicleTypeSchema } from "./vehicle-type";

export const SegmentKnowledgeSchema = z.strictObject({
  "segment_id": IdSchema,
  "vehicle_type": VehicleTypeSchema,
  "knowledge_epoch": z.number().finite().refine(Number.isInteger, "Expected integer").min(0),
  "condition": ConditionSchema,
  "confidence_band": z.union([ConfidenceSchema, z.null()]),
  "state": z.literal(["known","ordinary_unknown","unresolved_conflict","authoritative_closed"]),
  "observation_ids": z.array(IdSchema),
  "restriction_ids": z.array(IdSchema),
  "expires_sim_minute": z.union([z.number().finite().min(0).describe("Finite simulation minutes from scenario T0; fractional minutes allowed. Reject NaN/Infinity."), z.null()]),
});
export type SegmentKnowledge = z.infer<typeof SegmentKnowledgeSchema>;
