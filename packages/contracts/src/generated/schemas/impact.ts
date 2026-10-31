import { z } from "zod";
import { AffectedOrderSchema } from "./affected-order";
import { IdSchema } from "./id";

export const ImpactSchema = z.strictObject({
  "incident_ids": z.array(IdSchema),
  "affected_orders": z.array(AffectedOrderSchema),
  "affected_driver_ids": z.array(IdSchema),
  "priority_order_ids": z.array(IdSchema),
});
export type Impact = z.infer<typeof ImpactSchema>;
