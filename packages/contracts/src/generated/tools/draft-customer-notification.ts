import { z } from "zod";
import { NotificationSchema } from "../schemas/notification";

export const draftCustomerNotification = {
  name: "draft_customer_notification",
  input: z.strictObject({
  "order_id": z.string().refine(v => [...v].length <= 128, "String too long").regex(new RegExp("^[a-z][a-z0-9_]{1,23}_[A-Za-z0-9_-]{6,96}$")),
  "committed_revision": z.number().finite().refine(Number.isInteger, "Expected integer").min(0),
}),
  output: NotificationSchema,
  modelCallable: false, milestone: "M1",
  sideEffect: "preview_only",
} as const;
