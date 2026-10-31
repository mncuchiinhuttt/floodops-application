import { z } from "zod";
import { IdSchema } from "./id";

export const ActionChangeSchema = z.strictObject({
  "order_id": z.union([IdSchema, z.null()]),
  "driver_id": z.union([IdSchema, z.null()]),
  "hub_id": z.union([IdSchema, z.null()]),
  "route_id": z.union([IdSchema, z.null()]),
  "defer_minute": z.union([z.number().finite().gt(0), z.null()]),
});
export type ActionChange = z.infer<typeof ActionChangeSchema>;
