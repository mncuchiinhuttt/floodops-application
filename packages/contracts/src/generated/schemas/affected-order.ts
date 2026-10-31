import { z } from "zod";
import { IdSchema } from "./id";

export const AffectedOrderSchema = z.strictObject({
  "order_id": IdSchema,
  "driver_id": z.union([IdSchema, z.null()]),
  "cause_segment_ids": z.array(IdSchema),
  "predicted_lateness_minute": z.union([z.number().finite().min(0), z.null()]),
  "tier": z.literal(["critical","food","standard"]),
  "is_unreachable": z.boolean(),
});
export type AffectedOrder = z.infer<typeof AffectedOrderSchema>;
