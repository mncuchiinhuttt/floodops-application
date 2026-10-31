import { z } from "zod";
import { DriverPositionSchema } from "./driver-position";
import { IdSchema } from "./id";
import { QuantitySchema } from "./quantity";
import { StopSchema } from "./stop";
import { VehicleTypeSchema } from "./vehicle-type";

export const DriverSchema = z.strictObject({
  "driver_id": IdSchema,
  "vehicle_type": VehicleTypeSchema,
  "capacity": z.array(QuantitySchema).refine(v => v.length >= 1, "Too few items"),
  "load": z.array(QuantitySchema).refine(v => v.length >= 1, "Too few items"),
  "position": DriverPositionSchema,
  "status": z.literal(["idle","moving","servicing","waiting"]),
  "carrying_order_ids": z.array(IdSchema),
  "ordered_stops": z.array(StopSchema),
});
export type Driver = z.infer<typeof DriverSchema>;
