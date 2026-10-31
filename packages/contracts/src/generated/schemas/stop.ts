import { z } from "zod";
import { IdSchema } from "./id";

export const StopSchema = z.strictObject({
  "stop_id": IdSchema,
  "order_id": IdSchema,
  "kind": z.literal(["pickup","delivery"]),
  "node_id": IdSchema,
  "service_minute": z.number().finite().min(0),
});
export type Stop = z.infer<typeof StopSchema>;
