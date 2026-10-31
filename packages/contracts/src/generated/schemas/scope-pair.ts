import { z } from "zod";
import { IdSchema } from "./id";
import { VehicleTypeSchema } from "./vehicle-type";

export const ScopePairSchema = z.strictObject({
  "segment_id": IdSchema,
  "vehicle_type": VehicleTypeSchema,
});
export type ScopePair = z.infer<typeof ScopePairSchema>;
