import { z } from "zod";
import { IdSchema } from "./id";
import { ProvenanceLabelSchema } from "./provenance-label";
import { QuantitySchema } from "./quantity";

export const OrderSchema = z.strictObject({
  "order_id": IdSchema,
  "tier": z.literal(["critical","food","standard"]),
  "demand": z.array(QuantitySchema).refine(v => v.length >= 1, "Too few items"),
  "pickup_hub_id": IdSchema,
  "destination_node_id": IdSchema,
  "driver_id": z.union([IdSchema, z.null()]),
  "original_sla_minute": z.number().finite().min(0).describe("Finite simulation minutes from scenario T0; fractional minutes allowed. Reject NaN/Infinity."),
  "eta_minute": z.union([z.number().finite().min(0).describe("Finite simulation minutes from scenario T0; fractional minutes allowed. Reject NaN/Infinity."), z.null()]),
  "service_minute": z.number().finite().min(0),
  "lifecycle": z.literal(["unpicked","picked_up","delivered"]),
  "delivered_at_minute": z.union([z.number().finite().min(0).describe("Finite simulation minutes from scenario T0; fractional minutes allowed. Reject NaN/Infinity."), z.null()]),
  "cumulative_defer_minute": z.number().finite().min(0),
  "provenance_label": ProvenanceLabelSchema,
});
export type Order = z.infer<typeof OrderSchema>;
