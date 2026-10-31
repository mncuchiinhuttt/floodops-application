import { z } from "zod";
import { hasUniqueItems } from "../../schema-helpers";
import { IdSchema } from "./id";
import { VehicleTypeSchema } from "./vehicle-type";

export const TurnRestrictionSchema = z.strictObject({
  "from_segment_id": IdSchema,
  "to_segment_id": IdSchema,
  "vehicle_types": z.array(VehicleTypeSchema).refine(v => v.length >= 1, "Too few items").refine(hasUniqueItems, "Duplicate items"),
  "kind": z.literal(["no_turn","only_turn"]),
});
export type TurnRestriction = z.infer<typeof TurnRestrictionSchema>;
