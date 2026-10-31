import { z } from "zod";
import { IdSchema } from "./id";

export const NotificationSchema = z.strictObject({
  "notification_id": IdSchema,
  "order_id": IdSchema,
  "committed_revision": z.number().finite().refine(Number.isInteger, "Expected integer").min(0),
  "eta_minute": z.union([z.number().finite().min(0).describe("Finite simulation minutes from scenario T0; fractional minutes allowed. Reject NaN/Infinity."), z.null()]),
  "message": z.string().refine(v => [...v].length <= 2000, "String too long"),
  "is_preview_only": z.literal(true),
  "is_simulated": z.literal(true),
});
export type Notification = z.infer<typeof NotificationSchema>;
