import { z } from "zod";
import { hasUniqueItems } from "../../schema-helpers";
import { ConditionSchema } from "./condition";
import { IdSchema } from "./id";
import { VehicleTypeSchema } from "./vehicle-type";

export const ReviewInputSchema = z.strictObject({
  "decision": z.literal(["accept","reject"]),
  "reason": z.string().refine(v => [...v].length <= 2000, "String too long"),
  "mapped_segment_id": z.union([IdSchema, z.null()]),
  "vehicle_types": z.array(VehicleTypeSchema).refine(hasUniqueItems, "Duplicate items"),
  "condition": z.union([ConditionSchema, z.null()]),
}).describe("Dispatcher may confirm normalized segment/vehicle/condition with reason; policy derives source/confidence/expiry from original capture and policy. Cannot make an expired capture current by review. Accept requires an unambiguous candidate; reject does not create observation.");
export type ReviewInput = z.infer<typeof ReviewInputSchema>;
