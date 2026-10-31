import { z } from "zod";
import { VehicleTypeSchema } from "./vehicle-type";

export const TravelProfileSchema = z.strictObject({
  "vehicle_type": VehicleTypeSchema,
  "travel_time_minute": z.number().finite().gt(0),
  "valid_from_minute": z.number().finite().min(0).describe("Finite simulation minutes from scenario T0; fractional minutes allowed. Reject NaN/Infinity."),
  "valid_until_minute": z.union([z.number().finite().min(0).describe("Finite simulation minutes from scenario T0; fractional minutes allowed. Reject NaN/Infinity."), z.null()]),
  "parameter_keys": z.array(z.string().refine(v => [...v].length <= 100, "String too long")),
});
export type TravelProfile = z.infer<typeof TravelProfileSchema>;
