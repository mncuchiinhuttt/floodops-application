import { z } from "zod";
import { hasUniqueItems } from "../../schema-helpers";
import { IdSchema } from "./id";
import { VehicleTypeSchema } from "./vehicle-type";

export const RestrictionSchema = z.strictObject({
  "restriction_id": IdSchema,
  "segment_id": IdSchema,
  "vehicle_types": z.array(VehicleTypeSchema).refine(v => v.length >= 1, "Too few items").refine(hasUniqueItems, "Duplicate items"),
  "kind": z.literal(["closure","reopening"]),
  "authority_profile_id": IdSchema,
  "effective_sim_minute": z.number().finite().min(0).describe("Finite simulation minutes from scenario T0; fractional minutes allowed. Reject NaN/Infinity."),
  "supersedes_restriction_id": z.union([IdSchema, z.null()]),
  "evidence_ids": z.array(IdSchema).refine(v => v.length >= 1, "Too few items"),
});
export type Restriction = z.infer<typeof RestrictionSchema>;
