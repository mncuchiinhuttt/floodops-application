import { z } from "zod";
import { CoordinateSchema } from "./coordinate";
import { IdSchema } from "./id";
import { QuantitySchema } from "./quantity";

export const HubSchema = z.strictObject({
  "hub_id": IdSchema,
  "node_id": IdSchema,
  "coordinate": CoordinateSchema,
  "status": z.literal(["open","limited","closed"]),
  "capacity": z.array(QuantitySchema).refine(v => v.length >= 1, "Too few items"),
  "capacity_window_minute": z.number().finite().gt(0),
  "available_order_ids": z.array(IdSchema),
  "is_assumed": z.boolean(),
});
export type Hub = z.infer<typeof HubSchema>;
